import { useState } from 'react';
import {
  useSyncToVariants,
  SYNC_SECTIONS,
  type SyncSectionKey,
  type CocktailVariant,
} from '@/hooks/useCustom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface Props {
  sourceProduct: { id: string; name: string };
  variants: CocktailVariant[];
  /** Sections edited this session — pre-ticked for convenience. */
  defaultSections?: Set<SyncSectionKey>;
  onClose: () => void;
}

export function SyncToVariantsDialog({ sourceProduct, variants, defaultSections, onClose }: Props) {
  const sync = useSyncToVariants();

  const [sections, setSections] = useState<Set<SyncSectionKey>>(
    () => new Set(defaultSections ?? [])
  );
  const [targets, setTargets] = useState<Set<string>>(
    () => new Set(variants.map((v) => v.id))
  );

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  };

  const infoSections = SYNC_SECTIONS.filter((s) => s.kind === 'info');
  const customSections = SYNC_SECTIONS.filter((s) => s.kind === 'custom');

  const canApply = sections.size > 0 && targets.size > 0 && !sync.isPending;

  const apply = async () => {
    try {
      const res = await sync.mutateAsync({
        sourceProductId: sourceProduct.id,
        targetProductIds: [...targets],
        sectionKeys: [...sections],
      });
      toast.success(`Synced ${res.sections} section(s) to ${res.targets} brand(s)`);
      onClose();
    } catch {
      toast.error('Sync failed');
    }
  };

  const Row = ({
    checked, onChange, label, hint,
  }: { checked: boolean; onChange: () => void; label: string; hint?: string }) => (
    <label className="flex items-start gap-2.5 px-2 py-1.5 rounded hover:bg-accent/40 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 accent-primary" />
      <span className="flex flex-col min-w-0">
        <span className="text-sm text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-card rounded-lg border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl text-foreground">Apply to other brands</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Copy the selected sections from <strong>{sourceProduct.name}</strong> to the other brands
              using this cocktail.
            </p>
          </div>

          {/* Target brands */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Brands</p>
            <div className="rounded-md border border-border divide-y divide-border/60">
              {variants.map((v) => (
                <Row
                  key={v.id}
                  checked={targets.has(v.id)}
                  onChange={() => setTargets((s) => toggle(s, v.id))}
                  label={v.brandLabel}
                  hint={v.name}
                />
              ))}
            </div>
          </div>

          {/* Info sections */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Product info to copy</p>
              <button
                type="button"
                className="text-[11px] text-primary hover:underline"
                onClick={() =>
                  setSections((s) => {
                    const allInfo = infoSections.map((x) => x.key);
                    const hasAll = allInfo.every((k) => s.has(k));
                    const next = new Set(s);
                    allInfo.forEach((k) => (hasAll ? next.delete(k) : next.add(k)));
                    return next;
                  })
                }
              >
                {infoSections.every((x) => sections.has(x.key)) ? 'Clear info' : 'Select all info'}
              </button>
            </div>
            <div className="rounded-md border border-border divide-y divide-border/60">
              {infoSections.map((s) => (
                <Row
                  key={s.key}
                  checked={sections.has(s.key)}
                  onChange={() => setSections((cur) => toggle(cur, s.key))}
                  label={s.label}
                />
              ))}
            </div>
          </div>

          {/* Custom (destructive) sections */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Layout &amp; images — overwrites each brand's customization
            </p>
            <div className="rounded-md border border-amber-500/30 divide-y divide-border/60">
              {customSections.map((s) => (
                <Row
                  key={s.key}
                  checked={sections.has(s.key)}
                  onChange={() => setSections((cur) => toggle(cur, s.key))}
                  label={s.label}
                  hint="Replaces the target brand's own version"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={apply}
              disabled={!canApply}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {sync.isPending ? 'Applying…' : `Apply to ${targets.size} brand${targets.size === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
