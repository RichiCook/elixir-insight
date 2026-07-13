import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductAiPairings } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles } from 'lucide-react';

const EMOJI_OPTIONS = ['🧀', '🥩', '🍫', '🫒', '🍕', '🥗', '🍝', '🐟', '🦐', '🥖', '🍰', '🍷', '🍸', '🥂', '☕', '🍋', '🌶️', '🥑', '🍓', '✦'];

export function PairingsTab({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const { data: pairings, isLoading } = useProductAiPairings(productId);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (pairings) setItems(pairings.map((p) => ({ ...p })));
  }, [pairings]);

  const addItem = () => {
    setItems((prev) => [...prev, {
      id: `new-${Date.now()}`,
      product_id: productId,
      name: '',
      subtitle: '',
      emoji: '✦',
      is_featured: false,
      sort_order: prev.length,
    }]);
  };

  const updateItem = (index: number, key: string, value: any) =>
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const moveItem = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
  };

  // Generate structured, grammar-checked, translated cards from the product's
  // single "food pairing" value (imported from the tech sheet). Appended for review.
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('name, food_pairing, spirit, flavour')
        .eq('id', productId)
        .single();
      const fp = (prod as any)?.food_pairing;
      if (!fp) {
        toast.error('No “food pairing” value on this product to generate from');
        return;
      }
      const { data, error } = await supabase.functions.invoke('generate-pairings', {
        body: {
          foodPairing: fp,
          productName: (prod as any)?.name ?? '',
          spirit: (prod as any)?.spirit ?? null,
          flavour: (prod as any)?.flavour ?? null,
          targetLangs: ['IT', 'FR', 'DE'],
        },
      });
      if (error || !Array.isArray(data?.pairings) || !data.pairings.length) {
        toast.error(error?.message || 'Generation returned no pairings');
        return;
      }
      setItems((prev) => [
        ...prev,
        ...data.pairings.map((c: any, idx: number) => ({
          id: `new-${Date.now()}-${idx}`,
          product_id: productId,
          name: c.name,
          subtitle: c.subtitle || '',
          emoji: c.emoji || '✦',
          is_featured: prev.length === 0 && idx === 0,
          translations: c.translations || {},
          sort_order: prev.length + idx,
        })),
      ]);
      toast.success(`Generated ${data.pairings.length} pairing${data.pairings.length > 1 ? 's' : ''} — review & save`);
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const currentIds = items.filter((i) => !i.id.startsWith('new-')).map((i) => i.id);
    const removedIds = (pairings || []).filter((p) => !currentIds.includes(p.id)).map((p) => p.id);
    for (const id of removedIds) {
      await supabase.from('product_ai_pairings').delete().eq('id', id);
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const payload = {
        product_id: productId,
        name: item.name,
        subtitle: item.subtitle || null,
        emoji: item.emoji || '✦',
        is_featured: item.is_featured ?? false,
        sort_order: i,
        translations: item.translations ?? {},
      };
      if (item.id.startsWith('new-')) {
        await supabase.from('product_ai_pairings').insert(payload as any);
      } else {
        await supabase.from('product_ai_pairings').update(payload as any).eq('id', item.id);
      }
    }
    setSaving(false);
    toast.success('Pairings saved');
    queryClient.invalidateQueries({ queryKey: ['product-ai-pairings', productId] });
    onSaved?.();
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground text-xs">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Food & Drink Pairings</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Curate pairing suggestions shown on the consumer bottle page</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-3 h-3 mr-1" /> {generating ? 'Generating…' : 'Generate from tech sheet'}
          </Button>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-3 h-3 mr-1" /> Add Pairing
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground mb-3">No pairings yet. Add food & drink suggestions for this product.</p>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add First Pairing</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex flex-col gap-0.5 pt-1">
                <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▲</button>
                <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▼</button>
              </div>
              <Select value={item.emoji || '✦'} onValueChange={(v) => updateItem(index, 'emoji', v)}>
                <SelectTrigger className="w-14 h-9 text-lg justify-center"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map((e) => <SelectItem key={e} value={e} className="text-lg">{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1 space-y-1.5">
                <Input value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} placeholder="Pairing name (e.g. Aged Pecorino)" className="h-8 text-xs" />
                <Input value={item.subtitle || ''} onChange={(e) => updateItem(index, 'subtitle', e.target.value)} placeholder="Subtitle (e.g. Sheep milk · DOP)" className="h-8 text-xs" />
              </div>
              <div className="flex flex-col items-center gap-1 pt-1">
                <Switch checked={item.is_featured ?? false} onCheckedChange={(v) => updateItem(index, 'is_featured', v)} />
                <span className="text-[8px] text-muted-foreground">Featured</span>
              </div>
              <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive pt-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? 'Saving…' : 'Save Pairings'}
        </Button>
      )}
    </div>
  );
}
