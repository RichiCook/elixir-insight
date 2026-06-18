import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductComposition } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const PALETTE = ['#caa850', '#7a5c3e', '#b5651d', '#3b5e4f', '#8e44ad', '#c0392b', '#2c3e50', '#95a5a6'];

export function CompositionTab({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const { data: composition, isLoading } = useProductComposition(productId);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (composition) setItems(composition.map((c) => ({ ...c })));
  }, [composition]);

  const total = items.reduce((sum, i) => sum + (parseFloat(i.percentage) || 0), 0);

  const addItem = () =>
    setItems((prev) => [...prev, {
      id: `new-${Date.now()}`,
      product_id: productId,
      ingredient_name: '',
      percentage: '',
      color: PALETTE[prev.length % PALETTE.length],
      sort_order: prev.length,
    }]);

  const updateItem = (index: number, key: string, value: any) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const moveItem = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= items.length) return;
    const next = [...items];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setItems(next.map((item, i) => ({ ...item, sort_order: i })));
  };

  const handleSave = async () => {
    for (const it of items) {
      if (!String(it.ingredient_name || '').trim() || it.percentage === '' || it.percentage == null) {
        toast.error('Each ingredient needs a name and a percentage');
        return;
      }
    }
    setSaving(true);
    try {
      const currentIds = items.filter((i) => !String(i.id).startsWith('new-')).map((i) => i.id);
      const removedIds = (composition || []).filter((c) => !currentIds.includes(c.id)).map((c) => c.id);
      for (const id of removedIds) {
        await supabase.from('product_composition').delete().eq('id', id);
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const payload = {
          product_id: productId,
          ingredient_name: String(item.ingredient_name).trim(),
          percentage: parseFloat(item.percentage) || 0,
          color: item.color || '#caa850',
          sort_order: i,
        };
        if (String(item.id).startsWith('new-')) {
          await supabase.from('product_composition').insert(payload);
        } else {
          await supabase.from('product_composition').update(payload).eq('id', item.id);
        }
      }
      toast.success('Composition saved');
      queryClient.invalidateQueries({ queryKey: ['product-composition', productId] });
      onSaved?.();
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground text-xs">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Composition</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ingredient breakdown shown as bars on the consumer bottle page</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${Math.round(total) === 100 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            Total: {Math.round(total)}%
          </span>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-3 h-3 mr-1" /> Add Ingredient
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground mb-3">No composition yet. Add the ingredient breakdown for this product.</p>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add First Ingredient</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▲</button>
                <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▼</button>
              </div>
              <input
                type="color"
                value={item.color || '#caa850'}
                onChange={(e) => updateItem(index, 'color', e.target.value)}
                className="w-9 h-9 rounded border border-border cursor-pointer shrink-0 bg-transparent"
                title="Bar colour"
              />
              <Input
                value={item.ingredient_name}
                onChange={(e) => updateItem(index, 'ingredient_name', e.target.value)}
                placeholder="Ingredient (e.g. Gin)"
                className="flex-1 h-8 text-xs"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={item.percentage}
                  onChange={(e) => updateItem(index, 'percentage', e.target.value)}
                  placeholder="0"
                  className="w-20 h-8 text-xs text-right"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? 'Saving…' : 'Save Composition'}
        </Button>
      )}
    </div>
  );
}
