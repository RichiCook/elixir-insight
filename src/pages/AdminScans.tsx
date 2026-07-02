import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useScanEvents, parseUA, type ScanRow } from '@/hooks/useScanEvents';

const GOLD = '#b8975a';
const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function countBy<T>(rows: T[], key: (r: T) => string): { label: string; count: number }[] {
  const m = new Map<string, number>();
  rows.forEach((r) => { const k = key(r) || '—'; m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function BarList({ title, data, total, accent = GOLD }: { title: string; data: { label: string; count: number }[]; total: number; accent?: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h3 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 8).map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-foreground truncate mr-2">{d.label}</span>
                <span className="text-muted-foreground tabular-nums">{d.count} · {total ? Math.round((d.count / total) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${total ? (d.count / total) * 100 : 0}%`, backgroundColor: accent }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function toCsv(rows: ScanRow[]): string {
  const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ['Time', 'Product', 'Source', 'Language', 'Market', 'Device', 'OS', 'Browser', 'Session'];
  const lines = rows.map((r) => {
    const ua = parseUA(r.user_agent);
    return [r.scanned_at, r.product_slug, r.source, r.language, r.market, ua.device, ua.os, ua.browser, r.session_id].map(esc).join(',');
  });
  return [head.join(','), ...lines].join('\n');
}

export default function AdminScans() {
  const [days, setDays] = useState(30);
  const { data: rows, isLoading } = useScanEvents(90);

  const scoped = useMemo(() => {
    if (!rows) return [];
    const cutoff = Date.now() - days * 86_400_000;
    return rows.filter((r) => new Date(r.scanned_at).getTime() >= cutoff);
  }, [rows, days]);

  const stats = useMemo(() => {
    const total = scoped.length;
    const sessions = new Set(scoped.filter((r) => r.session_id).map((r) => r.session_id)).size;
    const qr = scoped.filter((r) => r.source === 'qr').length;
    return { total, sessions, qr, direct: total - qr };
  }, [scoped]);

  const byProduct = useMemo(() => countBy(scoped, (r) => r.product_slug), [scoped]);
  const bySource = useMemo(() => countBy(scoped, (r) => (r.source === 'qr' ? 'QR scan' : 'Direct link')), [scoped]);
  const byLanguage = useMemo(() => countBy(scoped, (r) => (r.language || 'EN').toUpperCase()), [scoped]);
  const byMarket = useMemo(() => countBy(scoped, (r) => r.market || 'Unknown'), [scoped]);
  const byDevice = useMemo(() => countBy(scoped, (r) => parseUA(r.user_agent).device), [scoped]);
  const byOS = useMemo(() => countBy(scoped, (r) => parseUA(r.user_agent).os), [scoped]);

  const timeline = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      m.set(d, 0);
    }
    scoped.forEach((r) => { const k = r.scanned_at.slice(0, 10); if (m.has(k)) m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].map(([date, scans]) => ({ date: date.slice(5), scans }));
  }, [scoped, days]);

  const download = () => {
    const blob = new Blob([toCsv(scoped)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `scans-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div className="flex-1">
          <h1 className="text-lg font-admin font-semibold text-foreground">Scan Explorer</h1>
          <p className="text-xs text-muted-foreground">Who scanned what &amp; where — from QR scans and direct visits</p>
        </div>
        <div className="flex items-center gap-1 mr-2">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className={`text-xs px-2.5 py-1 rounded border ${days === r.days ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:text-foreground'}`}
              style={days === r.days ? { backgroundColor: GOLD } : {}}>{r.label}</button>
          ))}
        </div>
        <Button size="sm" onClick={download} disabled={scoped.length === 0} className="bg-primary text-primary-foreground">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </header>

      <main className="p-6 space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading scans…</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { v: stats.total, l: 'Total scans' },
                { v: stats.sessions, l: 'Unique people' },
                { v: stats.qr, l: 'QR scans' },
                { v: stats.direct, l: 'Direct visits' },
              ].map((s) => (
                <div key={s.l} className="border border-border rounded-lg p-4 bg-card">
                  <p className="font-display text-3xl font-light text-foreground leading-none">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">Scans over time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeline} margin={{ left: -20, right: 10, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="scans" stroke={GOLD} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdowns — the "what & where" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BarList title="What — by product" data={byProduct} total={stats.total} />
              <BarList title="Where — source" data={bySource} total={stats.total} />
              <BarList title="Where — language" data={byLanguage} total={stats.total} />
              <BarList title="Who — device" data={byDevice} total={stats.total} />
              <BarList title="Who — operating system" data={byOS} total={stats.total} />
              <BarList title="Where — market" data={byMarket} total={stats.total} />
            </div>

            {/* Detailed log */}
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">Recent scans ({scoped.length})</h3>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">Lang</th>
                      <th className="px-3 py-2 font-medium">Device</th>
                      <th className="px-3 py-2 font-medium">OS / Browser</th>
                      <th className="px-3 py-2 font-medium">Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoped.slice(0, 300).map((r, i) => {
                      const ua = parseUA(r.user_agent);
                      return (
                        <tr key={i} className="border-t border-border/60 text-foreground">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{new Date(r.scanned_at).toLocaleString()}</td>
                          <td className="px-3 py-2">{r.product_slug}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: r.source === 'qr' ? GOLD + '26' : 'hsl(var(--muted))', color: r.source === 'qr' ? GOLD : 'hsl(var(--muted-foreground))' }}>
                              {r.source === 'qr' ? 'QR' : 'Direct'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{(r.language || 'EN').toUpperCase()}</td>
                          <td className="px-3 py-2 text-muted-foreground">{ua.device}</td>
                          <td className="px-3 py-2 text-muted-foreground">{ua.os} · {ua.browser}</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{r.session_id ? r.session_id.slice(0, 8) : 'anon'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {scoped.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-lg mt-2">
                  <p className="text-muted-foreground text-sm">No scans in this window yet.</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              “Person” is an anonymous session id (only stored with cookie consent). Precise geographic location isn’t captured yet — “where” is shown via language, source and market. Ask to enable IP-based geolocation to add a country/city map.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
