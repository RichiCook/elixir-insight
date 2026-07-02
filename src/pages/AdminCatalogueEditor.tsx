import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatalogue, useCreateCatalogue, useUpdateCatalogue } from '@/hooks/useCatalogues';
import { useProducts } from '@/hooks/useProduct';
import { useActivations, useBrands } from '@/hooks/useActivations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { toast } from 'sonner';

interface CatalogueDraft {
  slug: string;
  short_code: string;
  title: string;
  kicker: string;
  intro: string;
  partner_name: string;
  partner_logo_url: string;
  show_classy: boolean;
  bg_color: string;
  accent_color: string;
  text_color: string;
  text_muted: string;
  product_ids: string[];
  activation_id: string | null;
  status: 'draft' | 'active';
  brand_id: string | null;
}

const DEFAULT_DRAFT: CatalogueDraft = {
  slug: '',
  short_code: '',
  title: '',
  kicker: '',
  intro: '',
  partner_name: '',
  partner_logo_url: '',
  show_classy: true,
  bg_color: '#0c0b0f',
  accent_color: '#c5a35a',
  text_color: '#f4efe6',
  text_muted: '#9b9382',
  product_ids: [],
  activation_id: null,
  status: 'draft',
  brand_id: null,
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminCatalogueEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const { data: existing } = useCatalogue(isNew ? undefined : id);
  const { data: products } = useProducts();
  const { data: activations } = useActivations();
  const { data: brands } = useBrands();
  const createMutation = useCreateCatalogue();
  const updateMutation = useUpdateCatalogue();

  const [draft, setDraft] = useState<CatalogueDraft>(DEFAULT_DRAFT);
  const [productSearch, setProductSearch] = useState('');
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (existing) {
      setDraft({
        slug: existing.slug || '',
        short_code: existing.short_code || '',
        title: existing.title || '',
        kicker: existing.kicker || '',
        intro: existing.intro || '',
        partner_name: existing.partner_name || '',
        partner_logo_url: existing.partner_logo_url || '',
        show_classy: existing.show_classy ?? true,
        bg_color: existing.bg_color || '#0c0b0f',
        accent_color: existing.accent_color || '#c5a35a',
        text_color: existing.text_color || '#f4efe6',
        text_muted: existing.text_muted || '#9b9382',
        product_ids: existing.product_ids || [],
        activation_id: existing.activation_id,
        status: existing.status,
        brand_id: existing.brand_id,
      });
    }
  }, [existing]);

  const update = (patch: Partial<CatalogueDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const productById = (pid: string) => products?.find((p) => p.id === pid);
  const addProduct = (pid: string) => {
    if (!draft.product_ids.includes(pid)) update({ product_ids: [...draft.product_ids, pid] });
  };
  const removeProduct = (pid: string) => update({ product_ids: draft.product_ids.filter((x) => x !== pid) });
  const moveProduct = (index: number, dir: -1 | 1) => {
    const next = [...draft.product_ids];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    update({ product_ids: next });
  };

  const handleSave = async (publish?: boolean) => {
    const slug = draft.slug ? slugify(draft.slug) : slugify(draft.title);
    if (!slug) {
      toast.error('A title or slug is required');
      return;
    }
    const brand_id = draft.brand_id || brands?.find((b) => b.slug === 'classy')?.id || brands?.[0]?.id || null;
    const short_code = draft.short_code ? slugify(draft.short_code) : null;
    const payload = {
      ...draft,
      slug,
      short_code,
      brand_id,
      activation_id: draft.activation_id || null,
      status: publish ? ('active' as const) : draft.status,
    };
    try {
      if (isNew) {
        const created = await createMutation.mutateAsync(payload);
        toast.success('Catalogue created');
        navigate(`/admin/catalogues/${created.id}`);
      } else {
        await updateMutation.mutateAsync({ id: id!, ...payload });
        toast.success('Catalogue saved');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const availableProducts = products?.filter(
    (p) => !draft.product_ids.includes(p.id) && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
  );
  const slugPreview = draft.slug ? slugify(draft.slug) : slugify(draft.title);
  const codeForLink = draft.short_code ? slugify(draft.short_code) : slugPreview;
  const shortLink = `${window.location.origin}/c/${codeForLink}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortLink)}&size=220x220&margin=10`;
  const qrDownload = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortLink)}&size=1000x1000&format=svg&margin=12`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shortLink); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="min-h-screen bg-background">
      {showLogoPicker && (
        <ImagePickerDialog
          onSelect={(url) => { update({ partner_logo_url: url }); setShowLogoPicker(false); }}
          onClose={() => setShowLogoPicker(false)}
        />
      )}

      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">{isNew ? 'New Catalogue' : `Edit: ${draft.title || draft.slug}`}</h1>
          {slugPreview && <p className="text-xs text-muted-foreground font-mono">/collab/{slugPreview}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/catalogues"><Button variant="outline" size="sm">← Back</Button></Link>
          {!isNew && draft.status === 'active' && (
            <a href={`/collab/${slugPreview}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">View live ↗</Button></a>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave(false)}>Save Draft</Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => handleSave(true)}>Publish</Button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* QR & short link */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-3">QR &amp; short link</h2>
          <div className="flex items-center gap-5 flex-wrap">
            <img src={qrSrc} alt="Catalogue QR code" width={140} height={140} className="rounded bg-white p-1.5 border border-border shrink-0" />
            <div className="flex-1 min-w-[220px] space-y-2.5">
              <code className="inline-block text-sm text-foreground bg-muted/40 rounded px-2.5 py-1.5 break-all">{shortLink}</code>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</Button>
                <a href={qrDownload} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Download QR (SVG)</Button></a>
              </div>
              {(isNew || draft.status !== 'active') && (
                <p className="text-[10px] text-muted-foreground">Publish the catalogue to make this link live.</p>
              )}
            </div>
          </div>
        </section>

        {/* Identity */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
              <Input value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="The Collection" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">URL slug</Label>
              <Input value={draft.slug} onChange={(e) => update({ slug: e.target.value })} placeholder="vivienne-westwood" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Short code (for the QR / short link)</Label>
            <Input value={draft.short_code} onChange={(e) => update({ short_code: e.target.value })} placeholder="vw" className="max-w-[160px]" />
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Short link: /c/{draft.short_code ? slugify(draft.short_code) : (slugPreview || '…')}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Kicker (small label above title)</Label>
            <Input value={draft.kicker} onChange={(e) => update({ kicker: e.target.value })} placeholder="LIMITED-EDITION COLLABORATION" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Intro</Label>
            <Textarea value={draft.intro} onChange={(e) => update({ intro: e.target.value })} placeholder="Seven signature serves..." />
          </div>
        </section>

        {/* Co-branding */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Co-branding</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={draft.show_classy} onCheckedChange={(v) => update({ show_classy: v })} />
            Show Classy mark
          </label>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Partner name (shown if no logo)</Label>
            <Input value={draft.partner_name} onChange={(e) => update({ partner_name: e.target.value })} placeholder="VIVIENNE WESTWOOD" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Partner logo</Label>
            {draft.partner_logo_url ? (
              <div className="flex items-center gap-3">
                <img src={draft.partner_logo_url} alt="Partner logo" className="h-8 w-auto max-w-[140px] object-contain bg-muted/40 rounded p-1" />
                <Button variant="ghost" size="sm" onClick={() => setShowLogoPicker(true)}>Change</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update({ partner_logo_url: '' })}>Remove</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowLogoPicker(true)}>Upload / pick logo</Button>
            )}
          </div>
        </section>

        {/* Products */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Products ({draft.product_ids.length})</h2>
          {draft.product_ids.length > 0 && (
            <div className="space-y-1.5">
              {draft.product_ids.map((pid, i) => (
                <div key={pid} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                  <span className="text-foreground">{i + 1}. {productById(pid)?.name || '(unknown product)'}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveProduct(i, -1)} disabled={i === 0} className="px-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">↑</button>
                    <button onClick={() => moveProduct(i, 1)} disabled={i === draft.product_ids.length - 1} className="px-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">↓</button>
                    <button onClick={() => removeProduct(pid)} className="px-1.5 text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <Input placeholder="Search products to add..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="mb-2" />
            <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
              {availableProducts?.length ? availableProducts.map((p) => (
                <button key={p.id} onClick={() => addProduct(p.id)} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center justify-between">
                  <span>{p.name} <span className="text-[10px] opacity-50">({p.line})</span></span>
                  <span className="text-primary">+ Add</span>
                </button>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">No more products to add.</p>
              )}
            </div>
          </div>
        </section>

        {/* Activation */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Embedded activation</h2>
          <p className="text-[11px] text-muted-foreground">Optional. The capture form appears on the page; the code &amp; link are revealed only after the visitor submits.</p>
          <Select value={draft.activation_id || 'none'} onValueChange={(v) => update({ activation_id: v === 'none' ? null : v })}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {activations?.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Theme */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Theme</h2>
          <div className="grid grid-cols-2 gap-3">
            {([['bg_color', 'Background'], ['accent_color', 'Accent'], ['text_color', 'Text'], ['text_muted', 'Muted text']] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft[key]} onChange={(e) => update({ [key]: e.target.value } as any)} className="h-8 w-10 rounded border border-border bg-transparent" />
                  <Input value={draft[key]} onChange={(e) => update({ [key]: e.target.value } as any)} className="font-mono text-xs" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>Save Draft</Button>
          <Button className="bg-primary text-primary-foreground" onClick={() => handleSave(true)}>Publish</Button>
        </div>
      </main>
    </div>
  );
}
