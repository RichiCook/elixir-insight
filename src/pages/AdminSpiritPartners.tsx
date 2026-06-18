import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProduct';
import { useSpiritPartners, findSpiritPartner, useUpsertSpiritPartner } from '@/hooks/useSpiritPartners';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Image as ImageIcon, X } from 'lucide-react';

interface Draft { logo_url: string | null; website_url: string }

export default function AdminSpiritPartners() {
  const { data: products } = useProducts();
  const { data: partners, isLoading } = useSpiritPartners();
  const upsert = useUpsertSpiritPartner();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [picker, setPicker] = useState<string | null>(null);

  // Distinct partner names = every '+'-split spirit across products, plus any
  // names already in the registry.
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products ?? []) {
      const spirit = (p as any).spirit as string | null;
      if (!spirit) continue;
      for (const raw of spirit.split('+')) {
        const name = raw.trim();
        if (name) map.set(name.toLowerCase(), name);
      }
    }
    for (const sp of partners ?? []) {
      if (sp.name) map.set(sp.name.toLowerCase(), sp.name);
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }, [products, partners]);

  const getDraft = (name: string): Draft => {
    if (drafts[name]) return drafts[name];
    const existing = findSpiritPartner(partners, name);
    return { logo_url: existing?.logo_url ?? null, website_url: existing?.website_url ?? '' };
  };
  const setDraft = (name: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [name]: { ...getDraft(name), ...patch } }));

  const save = async (name: string) => {
    const d = getDraft(name);
    try {
      await upsert.mutateAsync({ name, logo_url: d.logo_url, website_url: d.website_url || null });
      toast.success(`${name} saved`);
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message || 'unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Spirit Partners</h1>
          <p className="text-xs text-muted-foreground">Logos for the "Crafted With" block</p>
        </div>
        <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-3">
        <p className="text-xs text-muted-foreground">
          Assign a logo to each spirit partner once — it then shows on every product that uses that spirit.
          Upload partner logos to the <Link to="/admin/images" className="text-primary hover:underline">Image Library</Link> first, then pick them here.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : names.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No spirit partners found — set a product's Spirit field first.</div>
        ) : (
          names.map((name) => {
            const d = getDraft(name);
            return (
              <div key={name} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
                {d.logo_url ? (
                  <div className="relative w-16 h-16 rounded border border-border bg-white/5 flex items-center justify-center shrink-0 p-1">
                    <img src={d.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                    <button onClick={() => setDraft(name, { logo_url: null })} className="absolute -top-2 -right-2 bg-black/70 rounded-full p-0.5" title="Remove logo">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <Input
                    value={d.website_url}
                    onChange={(e) => setDraft(name, { website_url: e.target.value })}
                    placeholder="https:// (optional website)"
                    className="h-7 text-xs mt-1"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setPicker(name)}>
                  <ImageIcon className="w-3 h-3 mr-1" /> {d.logo_url ? 'Change' : 'Logo'}
                </Button>
                <Button size="sm" onClick={() => save(name)} disabled={upsert.isPending} className="bg-primary text-primary-foreground">
                  Save
                </Button>
              </div>
            );
          })
        )}
      </main>

      {picker && (
        <ImagePickerDialog
          onSelect={(url) => { setDraft(picker, { logo_url: url }); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
