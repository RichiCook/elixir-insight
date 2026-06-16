import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PRODUCT_LINES } from '@/constants/app';
import { useLineEditorials, useUpsertLineEditorial, type LineEditorial } from '@/hooks/useLineContent';

const LANGS = ['EN', 'IT'] as const;
type Lang = (typeof LANGS)[number];

interface Draft { line_label: string; heading: string; heading_accent: string; body: string }
const emptyDraft = (): Draft => ({ line_label: '', heading: '', heading_accent: '', body: '' });

function LineCard({ line, rows }: { line: string; rows: LineEditorial[] }) {
  const upsert = useUpsertLineEditorial();
  const [lang, setLang] = useState<Lang>('EN');
  const [drafts, setDrafts] = useState<Record<Lang, Draft>>({ EN: emptyDraft(), IT: emptyDraft() });

  useEffect(() => {
    const next = { EN: emptyDraft(), IT: emptyDraft() } as Record<Lang, Draft>;
    for (const l of LANGS) {
      const row = rows.find((r) => r.line === line && r.language?.toUpperCase() === l);
      if (row) {
        next[l] = {
          line_label: row.line_label || '',
          heading: row.heading || '',
          heading_accent: row.heading_accent || '',
          body: row.body || '',
        };
      }
    }
    setDrafts(next);
  }, [rows, line]);

  const d = drafts[lang];
  const set = (k: keyof Draft, v: string) =>
    setDrafts((s) => ({ ...s, [lang]: { ...s[lang], [k]: v } }));

  const save = async () => {
    try {
      await upsert.mutateAsync({ line, language: lang, ...d });
      toast.success(`${line} · ${lang} saved`);
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message || 'unknown error'}`);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">{line} Line</h2>
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider transition-colors ${
                lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-muted'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Line Label</Label>
        <Input value={d.line_label} onChange={(e) => set('line_label', e.target.value)} placeholder={`${line} Line`} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Heading</Label>
        <Input value={d.heading} onChange={(e) => set('heading', e.target.value)} placeholder="e.g. Reinventing the Spritz" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Gold accent word</Label>
        <Input value={d.heading_accent} onChange={(e) => set('heading_accent', e.target.value)} placeholder="e.g. Spritz" />
        <p className="text-[10px] text-muted-foreground mt-1">Must be part of the heading — it's shown in gold italic.</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Body</Label>
        <Textarea rows={4} value={d.body} onChange={(e) => set('body', e.target.value)} className="text-sm" />
      </div>

      <Button onClick={save} disabled={upsert.isPending} className="bg-primary text-primary-foreground">
        {upsert.isPending ? 'Saving…' : `Save ${line} · ${lang}`}
      </Button>
    </div>
  );
}

export default function AdminLineContent() {
  const { data: rows, isLoading } = useLineEditorials();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Line Content</h1>
          <p className="text-xs text-muted-foreground">The "Line Story" block, per product line</p>
        </div>
        <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <p className="text-xs text-muted-foreground">
          This copy appears in the Line Story block on every product of that line, in the selected language.
          A single product can still override it from its own Layout tab.
        </p>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          PRODUCT_LINES.map((line) => <LineCard key={line} line={line} rows={rows ?? []} />)
        )}
      </main>
    </div>
  );
}
