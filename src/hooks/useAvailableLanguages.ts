import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fields that indicate a language was really translated (ingredient_list_full is
// often auto-populated, so it's excluded from the "has real content" test).
const MEANINGFUL = ['claim', 'sensory_description', 'ingredient_list_short', 'allergens_local', 'glass', 'ice', 'garnish', 'flavour'] as const;
const ORDER = ['EN', 'IT', 'FR', 'DE', 'ES'];

/**
 * Languages actually worth offering for a product: EN (base) plus any language
 * whose product_translations row has real content. Avoids showing empty
 * DE/FR tabs that just fall back to English.
 */
export function useAvailableLanguages(productId: string | undefined, fallback: string[]): string[] {
  const { data } = useQuery({
    queryKey: ['available-languages', productId],
    enabled: !!productId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_translations')
        .select('language, claim, sensory_description, ingredient_list_short, allergens_local, glass, ice, garnish, flavour')
        .eq('product_id', productId!);
      if (error) throw error;
      const langs = new Set<string>(['EN']); // base language always offered
      (data ?? []).forEach((r: any) => {
        const hasContent = MEANINGFUL.some((c) => typeof r[c] === 'string' && r[c].trim());
        if (hasContent) langs.add(String(r.language).toUpperCase());
      });
      return [...langs].sort((a, b) => {
        const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    },
  });
  return data && data.length ? data : fallback;
}
