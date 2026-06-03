import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrandStore } from '@/stores/brandStore';

export interface PeriodStats {
  scans: number;
  changePct: number;
  /** Daily scan counts for sparkline, oldest → newest */
  series: number[];
}

export interface ScanStats {
  productSlug: string;
  week: PeriodStats;
  month: PeriodStats;
  /** AI-chosen period: whichever absolute % move is larger */
  aiPeriod: 'week' | 'month';
}

// ── helpers ──────────────────────────────────────────────────────────────────

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function buildSeries(events: string[], daysBack: number): number[] {
  const counts: Record<string, number> = {};
  const now = new Date();

  // Initialise every day slot to 0
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    counts[dayKey(d)] = 0;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysBack);

  for (const ts of events) {
    const key = ts.slice(0, 10);
    if (counts[key] !== undefined) counts[key] = (counts[key] || 0) + 1;
  }

  return Object.keys(counts).sort().map((k) => counts[k]);
}

function computePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function computeStats(
  events: string[], // ISO timestamps
  currentDays: number,
  prevDays: number,
): PeriodStats {
  const now = Date.now();
  const msPerDay = 86_400_000;

  let current = 0;
  let previous = 0;

  for (const ts of events) {
    const age = (now - new Date(ts).getTime()) / msPerDay;
    if (age < currentDays) current++;
    else if (age < currentDays + prevDays) previous++;
  }

  return {
    scans: current,
    changePct: computePct(current, previous),
    series: buildSeries(events, currentDays),
  };
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useScanStats() {
  const activeBrand = useBrandStore((s) => s.activeBrand);

  return useQuery<Record<string, ScanStats>>({
    queryKey: ['scan-stats', activeBrand?.slug],
    queryFn: async () => {
      // Fetch 60 days of scan events for this brand
      const since = new Date();
      since.setDate(since.getDate() - 60);

      // Select brand_slug so we can filter client-side; older rows may have
      // brand_slug = null (pre-multi-brand), so we never drop them server-side.
      let q = (supabase.from('scan_events') as any)
        .select('product_slug, brand_slug, scanned_at')
        .gte('scanned_at', since.toISOString())
        .order('scanned_at', { ascending: false })
        .limit(100_000);

      const { data, error } = await q;
      if (error) throw error;

      // Group timestamps by product_slug.
      // Include rows whose brand_slug matches OR is null/empty (legacy pre-multi-brand rows).
      const brandSlug = activeBrand?.slug ?? null;
      const bySlug: Record<string, string[]> = {};
      for (const row of data as { product_slug: string; brand_slug: string | null; scanned_at: string }[]) {
        if (!row.product_slug) continue;
        if (brandSlug && row.brand_slug && row.brand_slug !== brandSlug) continue;
        if (!bySlug[row.product_slug]) bySlug[row.product_slug] = [];
        bySlug[row.product_slug].push(row.scanned_at);
      }

      // Compute stats per slug
      const result: Record<string, ScanStats> = {};
      for (const [slug, timestamps] of Object.entries(bySlug)) {
        const week = computeStats(timestamps, 7, 7);
        const month = computeStats(timestamps, 30, 30);
        const aiPeriod: 'week' | 'month' =
          Math.abs(week.changePct) >= Math.abs(month.changePct) ? 'week' : 'month';
        result[slug] = { productSlug: slug, week, month, aiPeriod };
      }

      return result;
    },
    staleTime: 5 * 60_000, // 5 min
    enabled: true,
  });
}

export function periodRationale(stats: ScanStats): string {
  const w = stats.week.changePct;
  const m = stats.month.changePct;
  const fmtPct = (n: number) => (n > 0 ? '+' : '') + n + '%';
  return stats.aiPeriod === 'week'
    ? `The 7-day move (${fmtPct(w)}) is the sharper signal right now — bigger than the 30-day trend (${fmtPct(m)}).`
    : `The 30-day trend (${fmtPct(m)}) tells the clearer story than this week's noise (${fmtPct(w)}).`;
}
