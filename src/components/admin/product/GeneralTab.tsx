import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PRODUCT_LINES } from '@/constants/app';
import { useApiForm } from '@/hooks/useApiForm';
import { slugify } from '@/lib/utils';
import { Badge } from './Badge';

/** Find a unique slug for this product, suffixing -2, -3… if the desired one is taken. */
async function resolveUniqueSlug(desired: string, productId: string): Promise<string> {
  let candidate = desired;
  for (let n = 2; ; n++) {
    const { data: clash } = await supabase
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .neq('id', productId)
      .maybeSingle();
    if (!clash) return candidate;
    candidate = `${desired}-${n}`;
  }
}

export function GeneralTab({ product, onSave }: { product: any; onSave: (newSlug?: string) => void }) {
  const { form, set, saving, handleSave } = useApiForm<Record<string, any>>(product, async (data) => {
    if (!data.name || !String(data.name).trim()) { toast.error('Name is required'); return; }
    const name = String(data.name).trim();

    // Keep the URL slug in sync with the name. Only changes when the name does,
    // and falls back to the existing slug if the name has no slug-able characters.
    let nextSlug = product.slug as string;
    const desired = slugify(name);
    if (desired && desired !== product.slug) {
      nextSlug = await resolveUniqueSlug(desired, product.id);
    }

    const { error } = await supabase.from('products').update({
      name,
      slug: nextSlug,
      line: data.line,
      spirit: data.spirit,
      abv: data.abv,
      serving: data.serving,
      garnish: data.garnish,
      glass: data.glass,
      ice: data.ice,
      flavour: data.flavour,
      food_pairing: data.food_pairing,
      occasion: data.occasion,
      uk_units: data.uk_units,
      allergens_summary: data.allergens_summary,
      hero_bg: data.hero_bg,
      bottle_color: data.bottle_color,
      product_link: data.product_link || null,
    }).eq('id', product.id);
    if (error) { toast.error('Failed to save'); return; }

    if (nextSlug !== product.slug) {
      // Record the retired slug so old QR codes / links redirect to the new one.
      // (cast: product_slug_history isn't in the generated Supabase types yet.)
      const db = supabase as any;
      await db.from('product_slug_history').delete().eq('old_slug', nextSlug); // new slug is live again
      await db.from('product_slug_history').upsert(
        { product_id: product.id, old_slug: product.slug },
        { onConflict: 'old_slug' },
      );
    }

    toast.success(nextSlug !== product.slug ? `Product updated · URL is now /${nextSlug}` : 'Product updated');
    onSave(nextSlug !== product.slug ? nextSlug : undefined);
  });

  const fields: { key: string; label: string; badges: ('STICKER' | 'WEBSITE' | 'BOTTLE')[] }[] = [
    { key: 'spirit', label: 'Spirit', badges: ['STICKER', 'WEBSITE'] },
    { key: 'abv', label: 'ABV (%)', badges: ['STICKER', 'WEBSITE', 'BOTTLE'] },
    { key: 'serving', label: 'Serving', badges: ['STICKER', 'WEBSITE'] },
    { key: 'garnish', label: 'Garnish', badges: ['WEBSITE'] },
    { key: 'glass', label: 'Glass', badges: ['WEBSITE'] },
    { key: 'ice', label: 'Ice', badges: ['WEBSITE'] },
    { key: 'flavour', label: 'Flavour', badges: ['WEBSITE'] },
    { key: 'food_pairing', label: 'Food Pairing', badges: ['WEBSITE'] },
    { key: 'occasion', label: 'Occasion', badges: ['WEBSITE'] },
    { key: 'uk_units', label: 'UK Units', badges: ['STICKER'] },
    { key: 'allergens_summary', label: 'Allergens Summary', badges: ['STICKER', 'WEBSITE'] },
    { key: 'product_link', label: 'Product Link (URL)', badges: ['WEBSITE'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Badge type="WEBSITE" />
        </div>
        <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Cocktail name" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-xs text-muted-foreground">Line</Label>
          <Badge type="BOTTLE" />
        </div>
        <Select value={form.line} onValueChange={(v) => set('line', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRODUCT_LINES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.badges.map((b) => <Badge key={b} type={b} />)}
            </div>
            <Input value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Hero Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.hero_bg || '#f5f0ea'}
              onChange={(e) => set('hero_bg', e.target.value)}
              className="w-10 h-10 rounded border border-border cursor-pointer"
            />
            <Input value={form.hero_bg || ''} onChange={(e) => set('hero_bg', e.target.value)} className="flex-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Bottle Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.bottle_color || '#2a2a2a'}
              onChange={(e) => set('bottle_color', e.target.value)}
              className="w-10 h-10 rounded border border-border cursor-pointer"
            />
            <Input value={form.bottle_color || ''} onChange={(e) => set('bottle_color', e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save General Info'}
      </Button>
    </div>
  );
}
