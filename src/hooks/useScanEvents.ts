import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrandStore } from '@/stores/brandStore';

export interface ScanRow {
  product_slug: string;
  brand_slug: string | null;
  source: string | null;
  language: string | null;
  market: string | null;
  user_agent: string | null;
  session_id: string | null;
  scanned_at: string;
}

/** Raw scan events (last `days`) for the active brand — powers the Scan Explorer. */
export function useScanEvents(days = 90) {
  const activeBrand = useBrandStore((s) => s.activeBrand);
  return useQuery<ScanRow[]>({
    queryKey: ['scan-events-raw', activeBrand?.slug, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await (supabase.from('scan_events') as any)
        .select('product_slug, brand_slug, source, language, market, user_agent, session_id, scanned_at')
        .gte('scanned_at', since.toISOString())
        .order('scanned_at', { ascending: false })
        .limit(20000);
      if (error) throw error;
      const brandSlug = activeBrand?.slug ?? null;
      return (data as ScanRow[]).filter((r) => !(brandSlug && r.brand_slug && r.brand_slug !== brandSlug));
    },
    staleTime: 30_000,
  });
}

/** Best-effort device / OS / browser from a user-agent string. */
export function parseUA(ua: string | null | undefined): { device: string; os: string; browser: string } {
  if (!ua) return { device: 'Unknown', os: '—', browser: '—' };
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'Mobile' : 'Desktop';
  let os = 'Other';
  if (/iPhone|iPad|iPod|iOS/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  return { device, os, browser };
}
