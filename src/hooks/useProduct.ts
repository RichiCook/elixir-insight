import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useProductTranslations(productId: string | undefined, language = 'EN') {
  return useQuery({
    queryKey: ['product-translations', productId, language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_translations')
        .select('*')
        .eq('product_id', productId!)
        .eq('language', language)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useProductComposition(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-composition', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_composition')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useProductTechnicalData(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-technical-data', productId],
    queryFn: async () => {
      // Try direct table access (works for authenticated admin users)
      const { data, error } = await supabase
        .from('product_technical_data')
        .select('*')
        .eq('product_id', productId!)
        .single();
      if (!error) return data;
      // Fall back to public RPC for anonymous/consumer access (excludes supplier info)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_product_nutrition', { p_product_id: productId! });
      if (rpcError) throw rpcError;
      return rpcData as Record<string, any> | null;
    },
    enabled: !!productId,
  });
}

export function useProductServeMoments(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-serve-moments', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_serve_moments')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useProductAiPairings(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-ai-pairings', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ai_pairings')
        .select('*')
        .eq('product_id', productId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('line')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

interface CollaborationPublic {
  id: string;
  brand_name: string;
  brand_slug: string;
  brand_logo_url: string | null;
  brand_color: string | null;
  event_name: string | null;
  event_date: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export function useCollaboration(productId: string | undefined) {
  return useQuery<CollaborationPublic | null>({
    queryKey: ['product-collaboration', productId],
    queryFn: async () => {
      const { data: product } = await supabase
        .from('products')
        .select('collaboration_id')
        .eq('id', productId!)
        .single();
      if (!product?.collaboration_id) return null;
      const { data, error } = await supabase
        .from('collaborations_public' as any)
        .select('*')
        .eq('id', product.collaboration_id)
        .single();
      if (error) return null;
      return data as unknown as CollaborationPublic;
    },
    enabled: !!productId,
  });
}

export function useProductEanCodes(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-ean-codes', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ean_codes')
        .select('*')
        .eq('product_id', productId!)
        .order('market');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [productsRes, translationsRes, techSheetsRes] = await Promise.all([
        supabase.from('products').select('id, completeness'),
        supabase.from('product_translations').select('language'),
        supabase.from('tech_sheet_uploads').select('status').eq('status', 'complete'),
      ]);

      const products = productsRes.data || [];
      const translations = translationsRes.data || [];
      const techSheets = techSheetsRes.data || [];

      const languages = new Set(translations.map((t) => t.language));
      const complete = products.filter((p) => (p.completeness || 0) >= 85).length;

      return {
        totalProducts: products.length,
        languages: languages.size,
        completeProfiles: complete,
        techSheetsProcessed: techSheets.length,
      };
    },
  });
}
