import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve a retired product slug to the product's current slug via
 * product_slug_history. Used by the bottle page so old QR codes / links keep
 * working after a product is renamed. Returns null when there is no alias.
 */
export function useSlugRedirect(oldSlug: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['slug-redirect', oldSlug],
    enabled: enabled && !!oldSlug,
    staleTime: 300_000,
    queryFn: async () => {
      // cast: product_slug_history isn't in the generated Supabase types yet.
      const db = supabase as any;
      const { data: alias } = await db
        .from('product_slug_history')
        .select('product_id')
        .eq('old_slug', oldSlug)
        .maybeSingle();
      if (!alias?.product_id) return null;

      const { data: prod } = await supabase
        .from('products')
        .select('slug')
        .eq('id', alias.product_id)
        .maybeSingle();
      return prod?.slug ?? null;
    },
  });
}
