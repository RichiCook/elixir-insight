import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductServeMoments } from '@/hooks/useProduct';
import { useProductImages } from '@/hooks/useImages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles, ImagePlus, X } from 'lucide-react';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';

const EMOJI_OPTIONS = ['🍊', '🌙', '✦', '🥂', '🍸', '☀️', '🌅', '🎉', '🕯️', '⛱️', '🎶', '🧊', '🌊', '🏌️', '🍽️', '💫', '🔥', '❄️', '🌆', '🥃'];

export function ServeMomentsTab({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const { data: moments, isLoading } = useProductServeMoments(productId);
  const { data: productImages } = useProductImages(productId);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pickingImageFor, setPickingImageFor] = useState<number | null>(null);

  useEffect(() => {
    if (!moments) return;
    // Legacy pool: approved images tagged serve_moment, mapped to cards by
    // position. Prefill each card's own image from it so what the admin sees
    // matches what the consumer page shows today; saving persists it per card.
    const legacyPool = (productImages || []).filter((pi: any) => pi.section === 'serve_moment');
    setItems(moments.map((m: any, i: number) => ({
      ...m,
      image_url: m.image_url ?? legacyPool[i]?.brand_images?.public_url ?? null,
    })));
  }, [moments, productImages]);

  const addItem = () => {
    setItems((prev) => [...prev, {
      id: `new-${Date.now()}`,
      product_id: productId,
      occasion: '',
      title: '',
      description: '',
      emoji: '✦',
      image_url: null,
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
  // single "occasion pairing" value (imported from the tech sheet). Appended for review.
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('name, occasion, spirit, flavour, garnish, glass')
        .eq('id', productId)
        .single();
      const occ = (prod as any)?.occasion;
      if (!occ) {
        toast.error('No “occasion pairing” value on this product to generate from');
        return;
      }
      const { data, error } = await supabase.functions.invoke('generate-serve-moments', {
        body: {
          occasion: occ,
          productName: (prod as any)?.name ?? '',
          spirit: (prod as any)?.spirit ?? null,
          flavour: (prod as any)?.flavour ?? null,
          garnish: (prod as any)?.garnish ?? null,
          glass: (prod as any)?.glass ?? null,
          targetLangs: ['IT', 'FR', 'DE'],
        },
      });
      if (error || !Array.isArray(data?.moments) || !data.moments.length) {
        toast.error(error?.message || 'Generation returned no serve moments');
        return;
      }
      setItems((prev) => [
        ...prev,
        ...data.moments.map((m: any, idx: number) => ({
          id: `new-${Date.now()}-${idx}`,
          product_id: productId,
          occasion: m.occasion,
          title: m.title,
          description: m.description,
          emoji: m.emoji || '✦',
          image_url: null,
          translations: m.translations || {},
          sort_order: prev.length + idx,
        })),
      ]);
      toast.success(`Generated ${data.moments.length} serve moment${data.moments.length > 1 ? 's' : ''} — review & save`);
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const currentIds = items.filter((i) => !i.id.startsWith('new-')).map((i) => i.id);
    const removedIds = (moments || []).filter((m) => !currentIds.includes(m.id)).map((m) => m.id);
    for (const id of removedIds) {
      await supabase.from('product_serve_moments').delete().eq('id', id);
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const payload = {
        product_id: productId,
        occasion: item.occasion,
        title: item.title,
        description: item.description,
        emoji: item.emoji || '✦',
        image_url: item.image_url || null,
        background_color: item.background_color ?? null,
        sort_order: i,
        translations: item.translations ?? {},
      };
      if (item.id.startsWith('new-')) {
        await supabase.from('product_serve_moments').insert(payload as any);
      } else {
        await supabase.from('product_serve_moments').update(payload as any).eq('id', item.id);
      }
    }
    setSaving(false);
    toast.success('Serve moments saved');
    queryClient.invalidateQueries({ queryKey: ['product-serve-moments', productId] });
    onSaved?.();
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground text-xs">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Serve Moments</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">"The Perfect Occasion" cards shown on the consumer bottle page</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-3 h-3 mr-1" /> {generating ? 'Generating…' : 'Generate from tech sheet'}
          </Button>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-3 h-3 mr-1" /> Add Moment
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            No serve moments yet. Generate them from the tech sheet's occasion pairing, or add one by hand.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="w-3 h-3 mr-1" /> {generating ? 'Generating…' : 'Generate from tech sheet'}
            </Button>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add First Moment</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex flex-col gap-0.5 pt-1">
                <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▲</button>
                <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">▼</button>
              </div>

              {/* Card image — shown on the consumer card; emoji is the fallback */}
              <div className="relative group flex-shrink-0">
                {item.image_url ? (
                  <>
                    <button onClick={() => setPickingImageFor(index)} title="Change photo">
                      <img src={item.image_url} alt="" className="w-20 aspect-[4/3] object-cover rounded-md border border-border" />
                    </button>
                    <button
                      onClick={() => updateItem(index, 'image_url', null)}
                      title="Remove photo (card falls back to emoji)"
                      className="absolute -top-1.5 -right-1.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPickingImageFor(index)}
                    title="Add a photo of the drink being served"
                    className="w-20 aspect-[4/3] rounded-md border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-[8px] mt-0.5">Photo</span>
                  </button>
                )}
              </div>

              <Select value={item.emoji || '✦'} onValueChange={(v) => updateItem(index, 'emoji', v)}>
                <SelectTrigger className="w-14 h-9 text-lg justify-center"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map((e) => <SelectItem key={e} value={e} className="text-lg">{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-1.5">
                  <Input value={item.occasion} onChange={(e) => updateItem(index, 'occasion', e.target.value)} placeholder="Occasion label (e.g. Aperitivo)" className="h-8 text-xs w-44" />
                  <Input value={item.title} onChange={(e) => updateItem(index, 'title', e.target.value)} placeholder="Title (e.g. Golden Hour)" className="h-8 text-xs flex-1" />
                </div>
                <Textarea value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Description (e.g. Serve over a large ice cube with an orange twist. The ritual begins.)" className="text-xs min-h-[52px]" />
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
          {saving ? 'Saving…' : 'Save Serve Moments'}
        </Button>
      )}

      {pickingImageFor !== null && (
        <ImagePickerDialog
          onSelect={(url) => { updateItem(pickingImageFor, 'image_url', url); setPickingImageFor(null); }}
          onClose={() => setPickingImageFor(null)}
        />
      )}
    </div>
  );
}
