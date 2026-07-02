import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CASE_STUDY_BETA } from '@/lib/featureFlags';
import { buildCaseStudyHtml, slugify, type CaseStudyCopy } from '@/lib/caseStudy';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const EMPTY_COPY: CaseStudyCopy = {
  name: '', tagline: '', category: '', sector: '', client: '',
  intro: '', body: ['', '', ''], closing: '', services: [],
};

type Scene = { key: string; label: string; prompt: string };
type ProductProfile = {
  category?: string;
  product_type?: string;
  materials?: string[];
  finishes?: string[];
  palette?: string[];
  typography?: string;
  mood?: string[];
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminCaseStudyGenerator() {
  const perms = usePermissions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [heroDataUri, setHeroDataUri] = useState<string>('');
  const [facts, setFacts] = useState('');
  const [busy, setBusy] = useState<false | 'uploading' | 'generating'>(false);
  const [copy, setCopy] = useState<CaseStudyCopy | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [images, setImages] = useState<{ key: string; context: string; image: string }[]>([]);
  const [imgBusy, setImgBusy] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [profile, setProfile] = useState<ProductProfile | null>(null);
  const [log, setLog] = useState<{ t: string; level: 'info' | 'ok' | 'err'; msg: string }[]>([]);

  const pushLog = (level: 'info' | 'ok' | 'err', msg: string) =>
    setLog((l) => [...l.slice(-79), { t: new Date().toLocaleTimeString(), level, msg }]);

  // Hidden-beta guard: route is already team-gated, but this keeps it admin-only
  // and invisible unless the build flag is on.
  if (perms.isLoading) return null;
  if (!CASE_STUDY_BETA || !perms.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">This feature is not available.</p>
          <Link to="/admin" className="text-sm text-primary underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const html = useMemo(
    () => (copy && heroDataUri ? buildCaseStudyHtml(copy, heroDataUri, images.map((i) => i.image)) : ''),
    [copy, heroDataUri, images],
  );

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (f.size > MAX_SIZE) { toast.error('Image exceeds the 10 MB limit'); return; }
    setFile(f);
    setCopy(null);
    setImages([]);
    setPublicUrl('');
    setScenes([]);
    setProfile(null);
    try {
      setHeroDataUri(await readAsDataUrl(f));
    } catch {
      toast.error('Could not read that image');
    }
  };

  // Upload the photo to Storage once; reused by both copy and image generation.
  const ensureUploaded = async (): Promise<string> => {
    if (publicUrl) return publicUrl;
    if (!file) throw new Error('Upload a product photo first');
    const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `case-studies/${Date.now()}_${safe}`;
    const { error: upErr } = await supabase.storage.from('brand-images').upload(path, file);
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('brand-images').getPublicUrl(path);
    setPublicUrl(data.publicUrl);
    return data.publicUrl;
  };

  // Pull a function's JSON error body out of a FunctionsHttpError, if present.
  const fnError = async (error: any): Promise<string> => {
    try {
      const body = await error?.context?.json?.();
      if (body?.error) return body.detail ? `${body.error} — ${String(body.detail).slice(0, 200)}` : body.error;
    } catch { /* ignore */ }
    return error?.message || 'failed';
  };

  // Vision analysis: returns copy + structured profile + category-appropriate scene briefs.
  const runAnalysis = async (): Promise<{ copy: CaseStudyCopy; scenes: Scene[] }> => {
    const url = await ensureUploaded();
    pushLog('info', 'Analysing product + writing copy (Gemini vision)…');
    const start = performance.now();
    const { data, error } = await supabase.functions.invoke('generate-case-study', {
      body: { public_url: url, facts },
    });
    const secs = ((performance.now() - start) / 1000).toFixed(1);
    if (error) { pushLog('err', `Analysis failed: ${await fnError(error)} (${secs}s)`); throw error; }
    const payload = (data?.data ?? data) as { copy?: CaseStudyCopy; profile?: ProductProfile; scenes?: Scene[] };
    // Backward-compat: older function returned copy fields at the top level.
    const rawCopy = (payload.copy ?? (payload as unknown as CaseStudyCopy));
    const normCopy: CaseStudyCopy = {
      ...EMPTY_COPY,
      ...rawCopy,
      body: Array.isArray(rawCopy.body) ? [rawCopy.body[0] ?? '', rawCopy.body[1] ?? '', rawCopy.body[2] ?? ''] : ['', '', ''],
      services: Array.isArray(rawCopy.services) ? rawCopy.services : [],
    };
    const sc = (Array.isArray(payload.scenes) ? payload.scenes : []).filter((s) => s && s.prompt);
    setCopy(normCopy);
    setProfile(payload.profile ?? null);
    setScenes(sc);
    setImages([]); // fresh analysis → start the image set over
    pushLog('ok', `Analysis ready — ${payload.profile?.category ?? 'product'} · ${sc.length} scene briefs (${secs}s)`);
    return { copy: normCopy, scenes: sc };
  };

  // Ask the model for additional, distinctly-different scene concepts and append them.
  const addMoreScenes = async (count = 4) => {
    if (!file) { toast.error('Upload a product photo first'); return; }
    setMoreBusy(true);
    try {
      const url = await ensureUploaded();
      pushLog('info', `Requesting ${count} more scene concepts…`);
      const start = performance.now();
      const { data, error } = await supabase.functions.invoke('generate-case-study', {
        body: { public_url: url, facts, scene_count: count, exclude_labels: scenes.map((s) => s.label) },
      });
      const secs = ((performance.now() - start) / 1000).toFixed(1);
      if (error) { const m = await fnError(error); pushLog('err', `More scenes failed: ${m} (${secs}s)`); toast.error(m); return; }
      const payload = (data?.data ?? data) as { scenes?: Scene[] };
      const fresh = (Array.isArray(payload.scenes) ? payload.scenes : []).filter((s) => s && s.prompt);
      let added = 0;
      setScenes((prev) => {
        const labels = new Set(prev.map((s) => s.label.toLowerCase()));
        const keys = new Set(prev.map((s) => s.key));
        const out: Scene[] = [];
        for (const s of fresh) {
          if (labels.has(s.label.toLowerCase())) continue; // skip near-duplicates
          let k = s.key || s.label.toLowerCase().replace(/\s+/g, '-');
          while (keys.has(k)) k = `${k}-x`;
          keys.add(k);
          labels.add(s.label.toLowerCase());
          out.push({ ...s, key: k });
        }
        added = out.length;
        return [...prev, ...out];
      });
      pushLog('ok', `Added ${added} new scene concept${added === 1 ? '' : 's'} (${secs}s)`);
      if (added) toast.success(`Added ${added} scenes — hit "Generate images"`);
      else toast.message('No new distinct scenes returned — try again');
    } catch (err: any) {
      pushLog('err', `Aborted: ${err?.message || 'failed'}`);
      toast.error(err?.message || 'Could not add scenes');
    } finally {
      setMoreBusy(false);
    }
  };

  const generateImages = async () => {
    if (!file) { toast.error('Upload a product photo first'); return; }
    setImgBusy(true);
    try {
      const url = await ensureUploaded();
      let sc = scenes;
      if (!sc.length) {
        pushLog('info', 'No scene briefs yet — analysing product first…');
        const res = await runAnalysis();
        sc = res.scenes;
      }
      if (!sc.length) { pushLog('err', 'No scene briefs produced — try Analyse & copy first'); toast.error('No scenes to render'); return; }

      // Only render scenes that don't already have an image (incremental — keeps existing).
      const have = new Set(images.map((im) => im.key));
      const todo = sc.filter((s) => !have.has(s.key));
      if (!todo.length) { pushLog('info', 'All current scenes already rendered — use "More scenes" to add contexts'); toast.message('Nothing new to render'); return; }

      pushLog('info', `Image generation started — ${todo.length} new scene${todo.length === 1 ? '' : 's'} via gemini-2.5-flash-image`);
      const results = await Promise.all(
        todo.map(async (s, i) => {
          // Stagger starts so we don't hit the image model with simultaneous requests.
          await new Promise((r) => setTimeout(r, i * 1200));
          pushLog('info', `${s.label}: requesting render…`);
          const start = performance.now();
          const { data, error } = await supabase.functions.invoke('generate-case-study-images', {
            body: { public_url: url, context: s.key, prompt: s.prompt },
          });
          const secs = ((performance.now() - start) / 1000).toFixed(1);
          if (error) {
            const msg = await fnError(error);
            pushLog('err', `${s.label}: ${msg} (${secs}s)`);
            toast.error(`${s.label}: ${msg}`);
            return null;
          }
          const img = (data?.data ?? data)?.image as string | undefined;
          if (!img) { pushLog('err', `${s.label}: model returned no image (${secs}s)`); return null; }
          pushLog('ok', `${s.label}: rendered (${secs}s)`);
          return { key: s.key, context: s.label, image: img };
        }),
      );
      const ok = results.filter(Boolean) as { key: string; context: string; image: string }[];
      setImages((prev) => [...prev, ...ok]);
      pushLog(ok.length === todo.length ? 'ok' : 'err', `Done — ${ok.length}/${todo.length} new scenes succeeded`);
      if (ok.length) toast.success(`Generated ${ok.length}/${todo.length} new images`);
    } catch (err: any) {
      pushLog('err', `Aborted: ${err?.message || 'image generation failed'}`);
      toast.error(err?.message || 'Image generation failed');
    } finally {
      setImgBusy(false);
    }
  };

  const set = <K extends keyof CaseStudyCopy>(k: K, v: CaseStudyCopy[K]) =>
    setCopy((c) => (c ? { ...c, [k]: v } : c));

  const setBody = (i: number, v: string) =>
    setCopy((c) => {
      if (!c) return c;
      const body = [...c.body];
      body[i] = v;
      return { ...c, body };
    });

  const generate = async () => {
    if (!file) { toast.error('Upload a product photo first'); return; }
    try {
      setBusy('generating');
      pushLog('info', publicUrl ? 'Reusing uploaded photo' : 'Uploading photo to storage…');
      await runAnalysis();
      toast.success('Analysis & copy generated');
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!html || !copy) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(copy.name)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderedKeys = new Set(images.map((im) => im.key));
  const pendingScenes = scenes.filter((s) => !renderedKeys.has(s.key)).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-admin font-semibold text-foreground">Case Study Generator</h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary">Beta</span>
        </div>
        <Link to="/admin"><Button variant="ghost" size="sm">Back</Button></Link>
      </header>

      <main className="p-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Product photo</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <div
              className="border border-dashed border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-primary/50"
              onClick={() => fileRef.current?.click()}
            >
              {heroDataUri ? (
                <img src={heroDataUri} alt="" className="w-20 h-20 object-cover rounded" />
              ) : (
                <div className="w-20 h-20 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
              <div className="text-sm text-muted-foreground">
                {file ? file.name : 'Click to choose a product image (max 10 MB)'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facts">Brand facts (optional)</Label>
            <Textarea
              id="facts"
              placeholder="Client, sector, product name, heritage, tone… Leave blank to infer from the image."
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={!file || busy !== false} className="bg-primary text-primary-foreground">
              {busy === 'generating' ? 'Analysing…' : copy ? 'Re-analyse & copy' : 'Analyse & copy'}
            </Button>
            <Button onClick={generateImages} variant="outline" disabled={!file || imgBusy || moreBusy}>
              {imgBusy ? 'Generating images…' : `Generate images${scenes.length ? ` (${pendingScenes})` : ' (4)'}`}
            </Button>
            {scenes.length > 0 && (
              <Button onClick={() => addMoreScenes(4)} variant="outline" disabled={!file || moreBusy || imgBusy}>
                {moreBusy ? 'Adding scenes…' : '+ More scenes'}
              </Button>
            )}
          </div>

          {imgBusy && (
            <p className="text-xs text-muted-foreground">Rendering product scenes — this can take 10–30s.</p>
          )}

          {profile && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label>Product analysis</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                {(profile.category || profile.product_type) && (
                  <div><span className="text-foreground">Category:</span> {[profile.category, profile.product_type].filter(Boolean).join(' · ')}</div>
                )}
                {profile.materials?.length ? <div><span className="text-foreground">Materials:</span> {profile.materials.join(', ')}</div> : null}
                {profile.finishes?.length ? <div><span className="text-foreground">Finishes:</span> {profile.finishes.join(', ')}</div> : null}
                {profile.mood?.length ? <div><span className="text-foreground">Mood:</span> {profile.mood.join(', ')}</div> : null}
                {profile.palette?.length ? (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-foreground">Palette:</span>
                    {profile.palette.map((c, i) => (
                      <span key={i} className="inline-block w-4 h-4 rounded-sm border border-border" style={{ background: c }} title={c} />
                    ))}
                  </div>
                ) : null}
              </div>
              {scenes.length > 0 && (
                <div className="text-[11px] text-muted-foreground pt-1">
                  Scenes: {scenes.map((s) => s.label).join(' · ')}
                </div>
              )}
            </div>
          )}

          {log.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Processing log</Label>
                <button type="button" onClick={() => setLog([])} className="text-[11px] text-muted-foreground hover:text-foreground underline">Clear</button>
              </div>
              <div className="font-mono text-[11px] leading-relaxed bg-muted/40 border border-border rounded-md p-3 max-h-48 overflow-auto">
                {log.map((e, i) => (
                  <div key={i} className={e.level === 'err' ? 'text-red-500' : e.level === 'ok' ? 'text-emerald-500' : 'text-muted-foreground'}>
                    <span className="opacity-50">{e.t}</span>{' '}
                    {e.level === 'ok' ? '✓' : e.level === 'err' ? '✕' : '•'} {e.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-2">
              <Label>Generated scenes ({images.length}/{scenes.length || images.length})</Label>
              <div className="grid grid-cols-2 gap-2">
                {images.map((im) => (
                  <a
                    key={im.context}
                    href={im.image}
                    download={`${slugify(copy?.name || 'case-study')}-${im.context}.png`}
                    className="block group"
                    title={`Download ${im.context}`}
                  >
                    <img src={im.image} alt={im.context} className="w-full rounded border border-border group-hover:border-primary/50" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{im.context}</span>
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">These populate the case-study grid in the preview. Click any to download.</p>
            </div>
          )}

          {copy && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Edit any field — the preview updates live.</p>
              <Field label="Name"><Input value={copy.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Tagline"><Input value={copy.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category"><Input value={copy.category} onChange={(e) => set('category', e.target.value)} /></Field>
                <Field label="Sector"><Input value={copy.sector} onChange={(e) => set('sector', e.target.value)} /></Field>
              </div>
              <Field label="Client"><Input value={copy.client} onChange={(e) => set('client', e.target.value)} /></Field>
              <Field label="Intro"><Textarea rows={3} value={copy.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
              <Field label="Body — naming & strategy"><Textarea rows={3} value={copy.body[0]} onChange={(e) => setBody(0, e.target.value)} /></Field>
              <Field label="Body — design story"><Textarea rows={3} value={copy.body[1]} onChange={(e) => setBody(1, e.target.value)} /></Field>
              <Field label="Body — finishes & details"><Textarea rows={3} value={copy.body[2]} onChange={(e) => setBody(2, e.target.value)} /></Field>
              <Field label="Closing"><Input value={copy.closing} onChange={(e) => set('closing', e.target.value)} /></Field>
              <Field label="Services (comma-separated)">
                <Input
                  value={copy.services.join(', ')}
                  onChange={(e) => set('services', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                />
              </Field>
              <Button onClick={download} variant="outline" className="w-full">Download .html</Button>
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border border-border rounded-lg overflow-hidden bg-white" style={{ height: '70vh' }}>
            {html ? (
              <iframe title="case-study-preview" srcDoc={html} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                Generate to see a live preview
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
