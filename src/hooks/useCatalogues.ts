import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Catalogue {
  id: string;
  brand_id: string | null;
  slug: string;
  short_code: string | null;
  title: string | null;
  kicker: string | null;
  intro: string | null;
  partner_name: string | null;
  partner_logo_url: string | null;
  show_classy: boolean;
  bg_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  text_muted: string | null;
  product_ids: string[];
  activation_id: string | null;
  status: 'draft' | 'active';
  created_at: string;
  updated_at: string;
}

export interface CatalogueProduct {
  id: string;
  name: string;
  slug: string;
  line: string | null;
  abv: string | null;
  liquid_color: string | null;
  image_url: string | null;
}

export interface CatalogueData {
  catalogue: {
    slug: string;
    title: string | null;
    kicker: string | null;
    intro: string | null;
    partner_name: string | null;
    partner_logo_url: string | null;
    show_classy: boolean;
    bg_color: string | null;
    accent_color: string | null;
    text_color: string | null;
    text_muted: string | null;
  };
  products: CatalogueProduct[];
  activation: any | null;
}

// ── Consumer: one RPC call returns the whole landing page ──
export function useCatalogueData(slug: string | undefined) {
  return useQuery({
    queryKey: ['catalogue-data', slug],
    queryFn: async (): Promise<CatalogueData | null> => {
      const { data, error } = await supabase.rpc('get_catalogue_data' as any, { p_slug: slug });
      if (error) throw error;
      return (data as CatalogueData | null) ?? null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

// ── Admin CRUD ──
export function useCatalogues() {
  return useQuery({
    queryKey: ['catalogues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogues' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Catalogue[]) ?? [];
    },
  });
}

export function useCatalogue(id: string | undefined) {
  return useQuery({
    queryKey: ['catalogue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogues' as any)
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as Catalogue;
    },
    enabled: !!id,
  });
}

export function useCreateCatalogue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<Catalogue>) => {
      const { data, error } = await supabase.from('catalogues' as any).insert(cat as any).select().single();
      if (error) throw error;
      return data as unknown as Catalogue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogues'] }),
  });
}

export function useUpdateCatalogue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Catalogue> & { id: string }) => {
      const { data, error } = await supabase.from('catalogues' as any).update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Catalogue;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['catalogues'] });
      qc.invalidateQueries({ queryKey: ['catalogue', vars.id] });
    },
  });
}

export function useDeleteCatalogue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catalogues' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogues'] }),
  });
}
