import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Brand } from '@/stores/brandStore';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, primary_color, description, active, website_url')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
    staleTime: 5 * 60_000,
  });
}
