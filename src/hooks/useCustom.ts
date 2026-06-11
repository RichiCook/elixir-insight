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
  /** Public URL segment (alias). NULL = fall back to the linked product's own slug. */
  public_slug: string | null;
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

/**
 * Fork a shared CORE cocktail into a collab-owned, independently-editable product.
 * Clones the product row + all its content (translations, technical data,
 * composition, serve moments, pairings, EAN codes, layout sections, images),
 * gives it a unique internal slug, then repoints the collaboration_cocktails
 * row at the clone while remembering the original slug as the public alias —
 * so /b/<collab>/<original-slug> stays stable. The original Classy product is
 * left untouched.
 */
export function useCustomizeCoreCocktail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      collaborationId,
      productId,
      collabSlug,
    }: {
      entryId: string;
      collaborationId: string;
      productId: string;
      collabSlug: string;
    }) => {
      // 1. Load the source (shared) product row in full.
      const { data: src, error: srcErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (srcErr || !src) throw srcErr ?? new Error('Source product not found');

      // 2. Derive a unique internal slug "<slug>-<collab>", de-duplicating on clash.
      const base = `${(src as any).slug}-${collabSlug}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');
      let newSlug = base;
      for (let i = 2; i < 50; i++) {
        const { data: clash } = await supabase
          .from('products')
          .select('id')
          .eq('slug', newSlug)
          .maybeSingle();
        if (!clash) break;
        newSlug = `${base}-${i}`;
      }

      // 3. Clone the product row (carry brand_id et al; override identity fields).
      const { id: _pid, created_at: _pc, updated_at: _pu, ...productRest } = src as any;
      const { data: clone, error: cloneErr } = await supabase
        .from('products')
        .insert({
          ...productRest,
          slug: newSlug,
          collaboration_id: collaborationId,
          is_collaboration: true,
        } as any)
        .select('id, slug')
        .single();
      if (cloneErr || !clone) throw cloneErr ?? new Error('Failed to clone product');
      const newId = clone.id;

      // 4. Clone content child tables (link rows for images point at the same assets).
      const cloneTable = async (table: string, single = false) => {
        const q = supabase.from(table as any).select('*').eq('product_id', productId);
        const strip = ({ id: _i, product_id: _p, created_at: _c, updated_at: _u, ...r }: any) => ({
          ...r,
          product_id: newId,
        });
        if (single) {
          const { data: row } = await q.maybeSingle();
          if (row) await supabase.from(table as any).insert(strip(row));
        } else {
          const { data: rows } = await q;
          if (rows?.length) await supabase.from(table as any).insert((rows as any[]).map(strip));
        }
      };
      await Promise.all([
        cloneTable('product_translations'),
        cloneTable('product_technical_data', true),
        cloneTable('product_composition'),
        cloneTable('product_serve_moments'),
        cloneTable('product_ai_pairings'),
        cloneTable('product_ean_codes'),
        cloneTable('product_sections'),
        cloneTable('product_images'),
      ]);

      // 5. Repoint the join row at the clone; remember the original slug as the
      //    public alias so the shareable link stays /b/<collab>/<original-slug>.
      const { error: relinkErr } = await supabase
        .from('collaboration_cocktails')
        .update({ product_id: newId, public_slug: (src as any).slug })
        .eq('id', entryId);
      if (relinkErr) throw relinkErr;

      return { newSlug, newId, publicSlug: (src as any).slug };
    },
    onSuccess: (_d, { collaborationId }) => {
      qc.invalidateQueries({ queryKey: ['collaboration-cocktails', collaborationId] });
      qc.invalidateQueries({ queryKey: ['custom-cocktail-counts'] });
      qc.invalidateQueries({ queryKey: ['products'] });
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
