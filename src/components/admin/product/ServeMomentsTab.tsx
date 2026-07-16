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
import { Plus, Trash2, Sparkles, X } from 'lucide-react';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';

const EMOJI_OPTIONS = ['🍊', '🌙', '✦', '🥂', '🍸', '☀️', '🌅', '🎉', '🕯️', '⛱️', '🎶', '🧊', '🌊', '🏌️', '🍽️', '💫', '🔥', '❄️', '🌆', '🥃'];

export function ServeMomentsTab({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const { data: moments, isLoading } = useProductServeMoments(productId);
  const { data: productImages } = useProductImages(productId);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  useEffect(() => {
    if (moments) setItems(moments.map((m) => ({ ...m })));
  }, [moments]);

  // Photos shown on the consumer cards: approved product images tagged with the
  // serve_moment section, matched to cards by position.
  const serveImages = (productImages || []).filter((pi: any) => pi.section === 'serve_moment');

  const addItem = () => {
    setItems((prev) => [...prev, {
      id: `new-${Date.now()}`,
      product_id: productId,
      occasion: '',
      title: '',
      description: '',
      emoji: '✦',
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

  // Same attach flow as ImagesTab, with the section fixed to serve_moment.
  const handleAttachImage = async (url: string) => {
    let imageId: string | null = null;
    const { data: existing } = await supabase.from('brand_images').select('id').eq('public_url', url).maybeSingle();
    if (existing) {
      imageId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('brand_images')
        .insert({ public_url: url, filename: url.split('/').pop() || 'image', storage_path: url, status: 'complete' })
        .select('id')
        .single();
      if (createErr || !created) { toast.error('Failed to register image'); return; }
      imageId = created.id;
    }
    const { data: existingAttr } = await supabase.from('image_attributes').select('id').eq('image_id', imageId!).maybeSingle();
    if (!existingAttr) {
      await supabase.from('image_attributes').insert({ image_id: imageId, is_approved: true });
    } else {
      await supabase.from('image_attributes').update({ is_approved: true }).eq('id', existingAttr.id);
    }
    const { error } = await supabase.from('product_images').upsert({
      product_id: productId,
      image_id: imageId,
      section: 'serve_moment',
      sort_order: (productImages?.length || 0),
    }, { onConflict: 'product_id,image_id,section' });
    if (error) { toast.error('Failed to attach image'); return; }
    toast.success('Image attached');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    setPickingImage(false);
  };

  const handleRemoveImage = async (id: string) => {
    await supabase.from('product_images').delete().eq('id', id);
    toast.success('Image removed');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
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

      {/* Card photos — consumer page matches these to the cards above by position */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-medium text-foreground">Card Photos</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Photos of the drink being served. The 1st photo goes on the 1st card, the 2nd on the 2nd, and so on; cards without a photo show their emoji.
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => setPickingImage(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Photo
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {serveImages.map((pi: any, idx: number) => (
            <div key={pi.id} className="relative group rounded-md overflow-hidden border border-border">
              <img src={pi.brand_images?.public_url} alt="" className="w-full aspect-[4/3] object-cover" />
              <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white rounded px-1">Card {idx + 1}</span>
              <button
                onClick={() => handleRemoveImage(pi.id)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {serveImages.length === 0 && (
            <p className="text-[10px] text-muted-foreground col-span-4 py-2">No photos yet — cards will show their emoji.</p>
          )}
        </div>
      </div>

      {pickingImage && (
        <ImagePickerDialog onSelect={handleAttachImage} onClose={() => setPickingImage(false)} />
      )}
    </div>
  );
}
