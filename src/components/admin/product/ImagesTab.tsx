import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductImages } from '@/hooks/useImages';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';

const SECTIONS = ['hero', 'editorial', 'serve_moment', 'pairing', 'gallery'] as const;

export function ImagesTab({ productId }: { productId: string }) {
  const { data: productImages } = useProductImages(productId);
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('hero');

  const handleAttachUrl = async (url: string) => {
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
      section: selectedSection,
      sort_order: (productImages?.length || 0),
    }, { onConflict: 'product_id,image_id,section' });
    if (error) { toast.error('Failed to attach image'); return; }
    toast.success('Image attached');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from('product_images').delete().eq('id', id);
    toast.success('Image removed');
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
  };

  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s] = productImages?.filter((pi: any) => pi.section === s) || [];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-admin uppercase tracking-wider text-muted-foreground capitalize">{section.replace('_', ' ')}</h4>
            <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => { setSelectedSection(section); setAdding(true); }}>
              + Add Image
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {grouped[section].map((pi: any) => (
              <div key={pi.id} className="relative group rounded border border-border overflow-hidden">
                <img src={pi.brand_images?.public_url} alt="" className="w-full aspect-square object-cover" />
                <button
                  onClick={() => handleRemove(pi.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {grouped[section].length === 0 && (
              <p className="text-[10px] text-muted-foreground col-span-4 py-3">No images for this section</p>
            )}
          </div>
        </div>
      ))}

      {adding && (
        <ImagePickerDialog onSelect={handleAttachUrl} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
