import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  line: string | null;
  spirit: string | null;
  abv: string | null;
  flavour: string | null;
  serving: string | null;
  liquid_color: string | null;
  image_url: string | null;
}

/** Normalize line casing ("CLASSIC" and "Classic" are the same line). */
export function normalizeLine(line: string | null | undefined): string {
  const v = (line ?? '').trim();
  if (!v) return 'Other';
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

/**
 * The full Classy range for the sales team: every core product (partner-cloned
 * variants excluded, so the Negroni appears once) with its hero image, in one
 * request against public-read tables — no RPC or migration needed.
 */
export function useCollection() {
  return useQuery<CollectionProduct[]>({
    queryKey: ['collection-all'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, line, spirit, abv, flavour, serving, liquid_color, product_images(section, sort_order, brand_images(public_url))')
        .is('collaboration_id', null)
        .eq('product_images.section', 'hero')
        .order('name');
      if (error) throw error;

      return (data ?? []).map((p: any) => {
        const imgs = (p.product_images ?? [])
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          line: p.line,
          spirit: p.spirit,
          abv: p.abv,
          flavour: p.flavour,
          serving: p.serving,
          liquid_color: p.liquid_color,
          image_url: imgs[0]?.brand_images?.public_url ?? null,
        } as CollectionProduct;
      });
    },
  });
}
