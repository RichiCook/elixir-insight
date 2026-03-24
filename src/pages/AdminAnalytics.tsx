import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProduct';
import { usePageViews, useSectionInteractions, useImageViews, useImageStats, type DateRange } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = {
  gold: '#b8975a',
  green: '#4a8c5c',
  blue: '#4a70c4',
  red: '#a04040',
  cream: '#f5f0ea',
  bg: '#161616',
  pageBg: '#0d0d0d',
  grid: 'rgba(255,255,255,0.08)',
};

const LINE_COLORS: Record<string, string> = {
  Classic: COLORS.gold,
  'No Regrets': COLORS.green,
  Sparkling: COLORS.blue,
};

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  how_to_serve: 'How to Serve',
  sensory: 'Sensory Description',
  composition: 'Composition',
  moments: 'Serve Moments',
  pairings: 'Pairings',
  ingredients: 'Ingredients',
  nutritional_passport: 'Digital Nutritional Passport',
  editorial: 'Editorial',
  heritage: 'Brand Heritage',
  cta_click: 'Store CTA',
};

const LANG_COLORS: Record<string, string> = { EN: COLORS.gold, IT: COLORS.green, DE: COLORS.blue, FR: COLORS.red };

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="font-display text-3xl font-light leading-none" style={{ color: COLORS.gold }}>{value}</p>
      <p className="font-admin text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-admin text-[9px] uppercase tracking-[0.16em] mb-4 mt-8" style={{ color: COLORS.gold }}>
      {children}
    </h3>
  );
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-sans-consumer text-[11px] rounded px-3 py-2" style={{ background: '#1c1c1c', border: `1px solid ${COLORS.gold}`, color: 'white' }}>
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg p-12 text-center" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[40px] mb-3 opacity-30">C</p>
      <p className="font-sans text-sm text-muted-foreground">
        No data yet — scans will appear here once consumers start using the platform
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<DateRange>('30d');
  const [drillProduct, setDrillProduct] = useState<string>('');
  const { data: products } = useProducts();
  const { data: pageViews = [], isLoading: pvLoading } = usePageViews(range);
  const { data: interactions = [], isLoading: intLoading } = useSectionInteractions(range);
  const { data: imageStats } = useImageStats();

  const isLoading = pvLoading || intLoading;
  const hasData = pageViews.length > 0;

  // KPIs
  const totalViews = pageViews.length;
  const uniqueSessions = new Set(pageViews.map((v: any) => v.session_id).filter(Boolean)).size;
  const productViewCounts = useMemo(() => {
    const m: Record<string, number> = {};
    pageViews.forEach((v: any) => { m[v.product_slug] = (m[v.product_slug] || 0) + 1; });
    return m;
  }, [pageViews]);
  const mostScanned = Object.entries(productViewCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const langCounts = useMemo(() => {
    const m: Record<string, number> = {};
    pageViews.forEach((v: any) => { const l = (v.language || 'en').toUpperCase(); m[l] = (m[l] || 0) + 1; });
    return m;
  }, [pageViews]);
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const ctaClicks = interactions.filter((i: any) => i.section_name === 'cta_click').length;
  const ctaRate = totalViews > 0 ? ((ctaClicks / totalViews) * 100).toFixed(1) : '0';

  // Views by product
  const productBarData = useMemo(() => {
    return Object.entries(productViewCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([slug, count]) => {
        const p = products?.find((pr) => pr.slug === slug);
        return { name: p?.name || slug, views: count, line: p?.line || 'Classic' };
      });
  }, [productViewCounts, products]);

  // Product detail table
  const productTableData = useMemo(() => {
    return productBarData.map((item) => {
      const slug = products?.find((p) => p.name === item.name)?.slug || item.name;
      const sessions = new Set(pageViews.filter((v: any) => v.product_slug === slug).map((v: any) => v.session_id)).size;
      const productInteractions = interactions.filter((i: any) => i.product_slug === slug);
      const sectionViews = productInteractions.filter((i: any) => i.interaction_type === 'view');
      const uniqueSectionSessions = new Set(sectionViews.map((i: any) => i.session_id)).size;
      const avgSections = uniqueSectionSessions > 0 ? (sectionViews.length / uniqueSectionSessions).toFixed(1) : '0';
      const cta = productInteractions.filter((i: any) => i.section_name === 'cta_click').length;
      const ctaR = item.views > 0 ? ((cta / item.views) * 100).toFixed(1) : '0';
      return { ...item, slug, sessions, avgSections, ctaClicks: cta, ctaRate: ctaR };
    });
  }, [productBarData, pageViews, interactions, products]);

  // Language distribution
  const langPieData = useMemo(() => {
    return Object.entries(langCounts).map(([lang, count]) => ({
      name: lang, value: count, color: LANG_COLORS[lang] || COLORS.gold,
    }));
  }, [langCounts]);

  const langTableData = useMemo(() => {
    return Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => {
        const pct = totalViews > 0 ? ((count / totalViews) * 100).toFixed(1) : '0';
        const langViews = pageViews.filter((v: any) => (v.language || 'en').toUpperCase() === lang);
        const slugCounts: Record<string, number> = {};
        langViews.forEach((v: any) => { slugCounts[v.product_slug] = (slugCounts[v.product_slug] || 0) + 1; });
        const topSlug = Object.entries(slugCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        const topName = products?.find((p) => p.slug === topSlug)?.name || topSlug;
        return { lang, count, pct, topProduct: topName };
      });
  }, [langCounts, totalViews, pageViews, products]);

  // Section engagement
  const sectionEngagement = useMemo(() => {
    const viewInteractions = interactions.filter((i: any) => i.interaction_type === 'view');
    const sessionsSet = new Set(pageViews.map((v: any) => v.session_id).filter(Boolean));
    const totalSess = sessionsSet.size || 1;
    const sectionCounts: Record<string, Set<string>> = {};
    viewInteractions.forEach((i: any) => {
      if (!sectionCounts[i.section_name]) sectionCounts[i.section_name] = new Set();
      if (i.session_id) sectionCounts[i.section_name].add(i.session_id);
    });
    return Object.entries(SECTION_LABELS)
      .map(([key, label]) => {
        const sessions = sectionCounts[key]?.size || 0;
        const rate = ((sessions / totalSess) * 100);
        return { key, label, sessions, rate: Math.min(rate, 100), count: sessions };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [interactions, pageViews]);

  // Passport to CTA insight
  const passportSessions = new Set(
    interactions.filter((i: any) => i.section_name === 'nutritional_passport' && i.interaction_type === 'view').map((i: any) => i.session_id)
  );
  const passportToCtaSessions = interactions.filter(
    (i: any) => i.section_name === 'cta_click' && passportSessions.has(i.session_id)
  ).length;
  const passportToCta = passportSessions.size > 0 ? ((passportToCtaSessions / passportSessions.size) * 100).toFixed(1) : '0';

  // Timeline
  const timelineData = useMemo(() => {
    const dayMap: Record<string, Record<string, number>> = {};
    const allSlugs = new Set<string>();
    pageViews.forEach((v: any) => {
      const day = (v.viewed_at || '').substring(0, 10);
      if (!day) return;
      if (!dayMap[day]) dayMap[day] = {};
      dayMap[day][v.product_slug] = (dayMap[day][v.product_slug] || 0) + 1;
      allSlugs.add(v.product_slug);
    });
    return {
      data: Object.entries(dayMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, slugs]) => ({ day, ...slugs })),
      slugs: Array.from(allSlugs),
    };
  }, [pageViews]);

  // Peak day
  const peakDay = useMemo(() => {
    const dayCounts: Record<string, { total: number; slugCounts: Record<string, number> }> = {};
    pageViews.forEach((v: any) => {
      const day = (v.viewed_at || '').substring(0, 10);
      if (!day) return;
      if (!dayCounts[day]) dayCounts[day] = { total: 0, slugCounts: {} };
      dayCounts[day].total++;
      dayCounts[day].slugCounts[v.product_slug] = (dayCounts[day].slugCounts[v.product_slug] || 0) + 1;
    });
    const peak = Object.entries(dayCounts).sort((a, b) => b[1].total - a[1].total)[0];
    if (!peak) return null;
    const topSlug = Object.entries(peak[1].slugCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return { day: peak[0], count: peak[1].total, product: products?.find((p) => p.slug === topSlug)?.name || topSlug };
  }, [pageViews, products]);

  // Drilldown
  const drillData = useMemo(() => {
    if (!drillProduct) return null;
    const pvs = pageViews.filter((v: any) => v.product_slug === drillProduct);
    const ints = interactions.filter((i: any) => i.product_slug === drillProduct);
    // Mini timeline
    const dayMap: Record<string, number> = {};
    pvs.forEach((v: any) => { const d = (v.viewed_at || '').substring(0, 10); if (d) dayMap[d] = (dayMap[d] || 0) + 1; });
    const timeline = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, views: count }));
    // Lang
    const langM: Record<string, number> = {};
    pvs.forEach((v: any) => { const l = (v.language || 'en').toUpperCase(); langM[l] = (langM[l] || 0) + 1; });
    const langData = Object.entries(langM).map(([name, value]) => ({ name, value, color: LANG_COLORS[name] || COLORS.gold }));
    // Funnel
    const funnelSections = ['hero', 'how_to_serve', 'composition', 'moments', 'pairings', 'ingredients', 'nutritional_passport', 'cta_click'];
    const sessionsTotal = new Set(pvs.map((v: any) => v.session_id)).size || 1;
    const funnel = funnelSections.map((s) => {
      const count = new Set(ints.filter((i: any) => i.section_name === s).map((i: any) => i.session_id)).size;
      return { section: SECTION_LABELS[s] || s, count, pct: Math.round((count / sessionsTotal) * 100) };
    });
    // Top referrers
    const refM: Record<string, number> = {};
    pvs.forEach((v: any) => { if (v.referrer) { try { const h = new URL(v.referrer).hostname; refM[h] = (refM[h] || 0) + 1; } catch {} } });
    const referrers = Object.entries(refM).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { timeline, langData, funnel, referrers };
  }, [drillProduct, pageViews, interactions]);

  const exportCsv = (data: any[], filename: string) => {
    if (!data.length) { toast.error('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.pageBg }}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Analytics & Insights</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · Consumer Engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* SECTION 1: KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard value={totalViews} label="Total Page Views" />
              <StatCard value={uniqueSessions} label="Unique Sessions" />
              <StatCard value={mostScanned} label="Most Scanned" />
              <StatCard value={topLang} label="Top Language" />
              <StatCard value={`${ctaRate}%`} label="CTA Click Rate" />
            </div>

            {/* SECTION 2: Views by Product */}
            <SectionTitle>Views by Product</SectionTitle>
            <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
              <ResponsiveContainer width="100%" height={Math.max(200, productBarData.length * 40)}>
                <BarChart data={productBarData} layout="vertical" margin={{ left: 120, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis type="number" tick={{ fill: '#999', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: COLORS.cream, fontSize: 11 }} width={110} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                    {productBarData.map((entry, i) => (
                      <Cell key={i} fill={LINE_COLORS[entry.line] || COLORS.gold} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Product table */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Product', 'Views', 'Sessions', 'Avg Sections', 'CTA Clicks', 'CTA Rate'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-admin text-[9px] uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productTableData.map((row) => (
                    <tr key={row.slug} className="border-b border-border/30">
                      <td className="px-4 py-2 text-foreground">{row.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.views}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.sessions}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.avgSections}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.ctaClicks}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.ctaRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Language Distribution */}
            <SectionTitle>Language Distribution</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg p-5 flex items-center justify-center" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={langPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {langPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Language', 'Views', '% of Total', 'Top Product'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-admin text-[9px] uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {langTableData.map((row) => (
                      <tr key={row.lang} className="border-b border-border/30">
                        <td className="px-4 py-2 text-foreground font-medium">{row.lang}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.count}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.pct}%</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.topProduct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: Section Engagement Heatmap */}
            <SectionTitle>Which sections do users actually read?</SectionTitle>
            <div className="rounded-lg p-5 space-y-2" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
              {sectionEngagement.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-[180px] truncate">{s.label}</span>
                  <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-full rounded" style={{ width: `${s.rate}%`, backgroundColor: COLORS.gold, transition: 'width 0.5s' }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{s.rate.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{s.count}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(184,151,90,0.08)', border: '1px solid rgba(184,151,90,0.15)' }}>
              <p className="text-xs text-muted-foreground">
                <span style={{ color: COLORS.gold }} className="font-medium">{passportToCta}%</span> of users who reached the Digital Nutritional Passport clicked through to the store
              </p>
            </div>

            {/* SECTION 5: Scan Activity Timeline */}
            <SectionTitle>Scan Activity Timeline</SectionTitle>
            <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timelineData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="day" tick={{ fill: '#999', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {timelineData.slugs.map((slug, i) => {
                    const p = products?.find((pr) => pr.slug === slug);
                    const color = LINE_COLORS[p?.line || 'Classic'] || COLORS.gold;
                    return <Line key={slug} type="monotone" dataKey={slug} name={p?.name || slug} stroke={color} strokeWidth={2} dot={false} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {peakDay && (
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(184,151,90,0.08)', border: '1px solid rgba(184,151,90,0.15)' }}>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium" style={{ color: COLORS.gold }}>Peak day:</span> {peakDay.day} with {peakDay.count} views — driven by {peakDay.product}
                </p>
              </div>
            )}

            {/* SECTION 6: Product Drilldown */}
            <SectionTitle>Product Detail Drilldown</SectionTitle>
            <Select value={drillProduct} onValueChange={setDrillProduct}>
              <SelectTrigger className="w-[260px] text-xs"><SelectValue placeholder="Drill into product →" /></SelectTrigger>
              <SelectContent>
                {products?.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {drillData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {/* Mini line chart */}
                <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[9px] font-admin uppercase tracking-wider text-muted-foreground mb-3">Views over time</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={drillData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                      <XAxis dataKey="day" tick={{ fill: '#999', fontSize: 8 }} />
                      <YAxis tick={{ fill: '#999', fontSize: 9 }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="views" stroke={COLORS.gold} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Mini donut */}
                <div className="rounded-lg p-5 flex items-center justify-center" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={drillData.langData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name }) => name}>
                        {drillData.langData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Funnel */}
                <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[9px] font-admin uppercase tracking-wider text-muted-foreground mb-3">Engagement Funnel</p>
                  <div className="space-y-1">
                    {drillData.funnel.map((step: any) => (
                      <div key={step.section} className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground w-[140px] truncate">{step.section}</span>
                        <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          <div className="h-full rounded" style={{ width: `${step.pct}%`, backgroundColor: COLORS.gold }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{step.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Referrers */}
                <div className="rounded-lg p-5" style={{ backgroundColor: COLORS.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[9px] font-admin uppercase tracking-wider text-muted-foreground mb-3">Top Referrers</p>
                  {drillData.referrers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No referrer data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {drillData.referrers.map(([host, count]: [string, number], i: number) => (
                        <div key={host} className="flex justify-between text-xs">
                          <span className="text-foreground">{i + 1}. {host}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 7: Image Library Stats */}
            {imageStats && (
              <>
                <SectionTitle>Image Library Stats</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard value={imageStats.total} label="Total Images" />
                  <StatCard value={imageStats.analysed} label="AI Analysed" />
                  <StatCard value={imageStats.approved} label="Approved & Live" />
                  <StatCard value={imageStats.productsWithImages} label="Products with Images" />
                </div>
              </>
            )}

            {/* SECTION 8: Export */}
            <SectionTitle>Export & Reports</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" size="sm" onClick={() => exportCsv(pageViews, 'page_views.csv')}>Export Page Views CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportCsv(interactions, 'section_interactions.csv')}>Export Interactions CSV</Button>
              <Button variant="outline" size="sm" onClick={() => toast.info('Coming Soon — PDF reports are in development')}>Generate PDF Report</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
