import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DateRange = '24h' | '7d' | '30d' | '90d' | 'all';

function getDateFilter(range: DateRange): string | null {
  if (range === 'all') return null;
  const d = new Date();
  if (range === '24h') { d.setHours(d.getHours() - 24); return d.toISOString(); }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function usePageViews(range: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'page_views', range],
    queryFn: async () => {
      let q = (supabase.from('page_views') as any).select('*');
      const since = getDateFilter(range);
      if (since) q = q.gte('viewed_at', since);
      const { data, error } = await q.order('viewed_at', { ascending: false }).limit(10000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useSectionInteractions(range: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'section_interactions', range],
    queryFn: async () => {
      let q = (supabase.from('section_interactions') as any).select('*');
      const since = getDateFilter(range);
      if (since) q = q.gte('interacted_at', since);
      const { data, error } = await q.order('interacted_at', { ascending: false }).limit(10000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useScanEvents(range: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'scan_events', range],
    queryFn: async () => {
      let q = (supabase.from('scan_events') as any).select('*');
      const since = getDateFilter(range);
      if (since) q = q.gte('scanned_at', since);
      const { data, error } = await q.order('scanned_at', { ascending: false }).limit(5000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useImageViews(range: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'image_views', range],
    queryFn: async () => {
      let q = (supabase.from('image_views') as any).select('*');
      const since = getDateFilter(range);
      if (since) q = q.gte('viewed_at', since);
      const { data, error } = await q.limit(10000);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useImageStats() {
  return useQuery({
    queryKey: ['analytics', 'image_stats'],
    queryFn: async () => {
      const { count: total } = await supabase.from('brand_images').select('*', { count: 'exact', head: true });
      const { count: analysed } = await supabase.from('image_attributes').select('*', { count: 'exact', head: true });
      const { count: approved } = await supabase.from('image_attributes').select('*', { count: 'exact', head: true }).eq('is_approved', true);
      const { data: linked } = await supabase.from('product_images').select('product_id');
      const uniqueProducts = new Set((linked || []).map((r: any) => r.product_id)).size;
      return { total: total || 0, analysed: analysed || 0, approved: approved || 0, productsWithImages: uniqueProducts };
    },
  });
}
