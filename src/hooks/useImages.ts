import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*, brand_images!inner(*, image_attributes(*))')
        .eq('product_id', productId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useApprovedProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: ['approved-product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*, brand_images!inner(*, image_attributes!inner(*))')
        .eq('product_id', productId!)
        .eq('brand_images.image_attributes.is_approved', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useApprovedBrandImages() {
  return useQuery({
    queryKey: ['approved-brand-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_images')
        .select('*, image_attributes(*)')
        .eq('status', 'complete')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
