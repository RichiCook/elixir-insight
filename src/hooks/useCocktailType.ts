import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the product's role within a collaboration ('core' | 'signature' | null).
 * Used so signature collab cocktails can show a Classy-catalogue CTA.
 * Reads collaboration_cocktails directly (public-read RLS).
 */
export function useCocktailType(
  collaborationId: string | undefined,
  productId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['cocktail-type', collaborationId, productId],
    enabled: enabled && !!collaborationId && !!productId,
    staleTime: 60_000,
    queryFn: async () => {
      // cast: collaboration_cocktails columns aren't in the generated Supabase types.
      const { data } = await (supabase as any)
        .from('collaboration_cocktails')
        .select('cocktail_type')
        .eq('collaboration_id', collaborationId!)
        .eq('product_id', productId!)
        .maybeSingle();
      return ((data as { cocktail_type?: string } | null)?.cocktail_type) ?? null;
    },
  });
}
