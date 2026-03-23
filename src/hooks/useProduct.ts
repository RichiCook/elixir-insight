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
      const { data, error } = await supabase
        .from('product_technical_data')
        .select('*')
        .eq('product_id', productId!)
        .single();
      if (error) throw error;
      return data;
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
