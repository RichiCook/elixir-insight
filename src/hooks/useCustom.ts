import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CustomBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  brand_logo_url: string | null;
  brand_color: string | null;
  contact_name: string | null;
  contact_email: string | null;
  event_name: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborationCocktail {
  id: string;
  collaboration_id: string;
  product_id: string;
  cocktail_type: 'core' | 'signature';
  sort_order: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    line: string | null;
    abv: string | null;
    completeness: number | null;
    is_collaboration: boolean | null;
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useCustomBrands() {
  return useQuery({
    queryKey: ['custom-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomBrand[];
    },
  });
}

export function useCustomBrand(brandSlug: string) {
  return useQuery({
    queryKey: ['custom-brand', brandSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .eq('brand_slug', brandSlug)
        .single();
      if (error) throw error;
      return data as CustomBrand;
    },
    enabled: !!brandSlug,
  });
}

export function useCollaborationCocktails(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['collaboration-cocktails', collaborationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_cocktails')
        .select(`
          *,
          product:products (
            id, name, slug, line, abv, completeness, is_collaboration
          )
        `)
        .eq('collaboration_id', collaborationId!)
        .order('sort_order');
      if (error) throw error;
      return data as CollaborationCocktail[];
    },
    enabled: !!collaborationId,
  });
}

export function useCustomBrandCocktailCounts() {
  return useQuery({
    queryKey: ['custom-cocktail-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_cocktails')
        .select('collaboration_id, cocktail_type');
      if (error) throw error;
      const counts: Record<string, { core: number; signature: number; total: number }> = {};
      (data || []).forEach((row) => {
        if (!counts[row.collaboration_id]) {
          counts[row.collaboration_id] = { core: 0, signature: 0, total: 0 };
        }
        counts[row.collaboration_id][row.cocktail_type as 'core' | 'signature']++;
        counts[row.collaboration_id].total++;
      });
      return counts;
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAddCoreCocktails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collaborationId,
      productIds,
    }: {
      collaborationId: string;
      productIds: string[];
    }) => {
      const rows = productIds.map((product_id, i) => ({
        collaboration_id: collaborationId,
        product_id,
        cocktail_type: 'core' as const,
        sort_order: i,
      }));
      const { error } = await supabase
        .from('collaboration_cocktails')
        .upsert(rows, { onConflict: 'collaboration_id,product_id' });
      if (error) throw error;
    },
    onSuccess: (_d, { collaborationId }) => {
      qc.invalidateQueries({ queryKey: ['collaboration-cocktails', collaborationId] });
      qc.invalidateQueries({ queryKey: ['custom-cocktail-counts'] });
    },
  });
}

export function useAddSignatureCocktail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collaborationId,
      productId,
    }: {
      collaborationId: string;
      productId: string;
    }) => {
      const { error } = await supabase.from('collaboration_cocktails').insert({
        collaboration_id: collaborationId,
        product_id: productId,
        cocktail_type: 'signature',
        sort_order: 0,
      });
      if (error) throw error;
    },
    onSuccess: (_d, { collaborationId }) => {
      qc.invalidateQueries({ queryKey: ['collaboration-cocktails', collaborationId] });
      qc.invalidateQueries({ queryKey: ['custom-cocktail-counts'] });
    },
  });
}

export function useRemoveCocktail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      productId,
      cocktailType,
      collaborationId,
    }: {
      entryId: string;
      productId: string;
      cocktailType: 'core' | 'signature';
      collaborationId: string;
    }) => {
      // Remove from join table
      const { error } = await supabase
        .from('collaboration_cocktails')
        .delete()
        .eq('id', entryId);
      if (error) throw error;

      // Signature: soft-delete the product itself
      if (cocktailType === 'signature') {
        await supabase
          .from('products')
          .update({ active: false })
          .eq('id', productId);
      }
    },
    onSuccess: (_d, { collaborationId }) => {
      qc.invalidateQueries({ queryKey: ['collaboration-cocktails', collaborationId] });
      qc.invalidateQueries({ queryKey: ['custom-cocktail-counts'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
