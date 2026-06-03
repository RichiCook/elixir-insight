import { useState, useCallback, useId, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type ScanStats, periodRationale } from '@/hooks/useScanStats';
import { useBrandStore } from '@/stores/brandStore';

// ── Design tokens (matching the prototype exactly) ────────────────────────
const T = {
  cardBg:   '#1b1711',
  cardHover:'#1f1a13',
  border:   'rgba(216,190,128,0.12)',
  borderH:  'rgba(216,190,128,0.26)',
  text:     '#f4efe6',
  muted:    '#9b9382',
  faint:    '#6f6856',
  gold:     '#caa850',
  goldSoft: 'rgba(202,168,80,0.14)',
  up:       'oklch(0.77 0.13 150)',
  upSoft:   'oklch(0.77 0.13 150 / 0.15)',
  down:     'oklch(0.70 0.15 41)',
  downSoft: 'oklch(0.70 0.15 41 / 0.15)',
} as const;

// ── Atoms ─────────────────────────────────────────────────────────────────

function Sparkle({ size = 12, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 12 12"
      fill={color} aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M6 0c.3 2.7 1.3 3.7 4 4-2.7.3-3.7 1.3-4 4-.3-2.7-1.3-3.7-4-4 2.7-.3 3.7-1.3 4-4z" />
    </svg>
  );
}

function TrendPill({ pct, period }: { pct: number; period: string }) {
  const positive = pct >= 0;
  const c   = positive ? T.up   : T.down;
  const bg  = positive ? T.upSoft : T.downSoft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      color: c, background: bg, borderRadius: 999,
      padding: '3px 8px', fontSize: 12.5, fontWeight: 600,
      lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    }}>
      <svg width="9" height="9" viewBox="0 0 10 10" fill={c}
        style={{ transform: positive ? 'none' : 'scaleY(-1)', flexShrink: 0 }}>
        <path d="M5 1l4 7H1z" />
      </svg>
      {(pct > 0 ? '+' : '') + pct + '%'}
      <span style={{ color: c, opacity: 0.6, fontWeight: 500 }}>
        vs last {period}
      </span>
    </span>
  );
}

function PeriodChip({
  period, isAi, rationale,
}: {
  period: string; isAi: boolean; rationale: string;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      position: 'relative', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.02em', color: T.gold,
      background: T.goldSoft, borderRadius: 999,
      padding: '3px 9px 3px 7px', cursor: 'default',
      userSelect: 'none',
    }}
      className="pi-chip"
    >
      <Sparkle size={10} />
      This {period}
      {isAi && (
        <span className="pi-tip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
          width: 210, background: '#2a241a', color: '#e7e0d2',
          borderRadius: 8, padding: '9px 11px',
          fontSize: 11.5, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: `1px solid ${T.border}`,
          opacity: 0, pointerEvents: 'none',
          transform: 'translateY(4px)',
          transition: 'opacity .15s, transform .15s',
          zIndex: 20,
        }}>
          <strong style={{ color: T.gold, fontWeight: 600 }}>
            AI chose this period.
          </strong>{' '}
          {rationale}
        </span>
      )}
    </span>
  );
}

function SparklineBar({
  data, color = T.gold, height = 44,
}: {
  data: number[]; color?: string; height?: number;
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const W = 100;
  const pad = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const bw = (W / data.length) * 0.56;

  return (
    <svg
      width="100%" height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const x = (i / data.length) * W + (W / data.length - bw) / 2;
        const h = ((v - min) / range) * (height - pad * 2) + pad;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i} x={x} y={height - h}
            width={bw} height={h} rx="1.1"
            fill={color} opacity={isLast ? 1 : 0.34}
          />
        );
      })}
    </svg>
  );
}

function SparklineLine({
  data, color = T.gold, height = 44, positive = true,
}: {
  data: number[]; color?: string; height?: number; positive?: boolean;
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const c = positive ? color : T.down;
  const W = 100;
  const pad = 6;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map((v) => pad + (1 - (v - min) / range) * (height - pad * 2));
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const area = `0,${height} ${line} ${W},${height}`;
  const lx = xs[xs.length - 1];
  const ly = ys[ys.length - 1];

  return (
    <svg
      width="100%" height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.30" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g${uid})`} />
      <polyline
        points={line} fill="none" stroke={c}
        strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="2.4" fill={c} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── QR code thumbnail ─────────────────────────────────────────────────────
// Renders the product's live bottle-page QR code using the qrserver.com API.
// Gold modules on the card background — no library needed.

function QrCode({ url, size = 56 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const apiUrl =
    'https://api.qrserver.com/v1/create-qr-code/?' +
    new URLSearchParams({
      data:    url,
      size:    `${size * 2}x${size * 2}`, // 2× for retina
      color:   'CAA850',
      bgcolor: '1B1711',
      format:  'svg',
      margin:  '2',
    }).toString();

  if (errored) {
    // Silent fallback: small empty rounded square
    return (
      <div style={{
        width: size, height: size, borderRadius: 6, flexShrink: 0,
        border: `1px solid rgba(202,168,80,0.18)`,
      }} />
    );
  }

  return (
    <img
      src={apiUrl}
      width={size} height={size}
      alt="QR code"
      onError={() => setErrored(true)}
      style={{
        borderRadius: 6, flexShrink: 0, display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}

function Completeness({ pct }: { pct: number }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 7,
      }}>
        <span style={{ fontSize: 12, color: T.muted }}>Completeness</span>
        <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 999,
        background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 999,
          background: T.gold,
        }} />
      </div>
    </div>
  );
}

// ── Regen button ──────────────────────────────────────────────────────────

function RegenButton({
  loading, onClick,
}: {
  loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      disabled={loading}
      title="Regenerate insight with AI"
      style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: 7,
        cursor: loading ? 'default' : 'pointer',
        border: `1px solid ${T.border}`, background: 'transparent', color: T.gold,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        transition: 'background .14s',
      }}
      onMouseEnter={(e) => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.background = T.goldSoft;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <svg
        width="13" height="13" viewBox="0 0 14 14" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ animation: loading ? 'pi-spin 0.8s linear infinite' : 'none' }}
      >
        <path d="M12 7a5 5 0 1 1-1.5-3.5" />
        <path d="M12 1.5V4H9.5" />
      </svg>
    </button>
  );
}

// ── Insight strip ─────────────────────────────────────────────────────────

function InsightStrip({
  text, loading, onRegen,
}: {
  text: string; loading: boolean; onRegen: () => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 9, alignItems: 'flex-start',
      background: 'rgba(202,168,80,0.05)',
      border: `1px solid rgba(202,168,80,0.13)`,
      borderRadius: 9, padding: '10px 11px',
    }}>
      <div style={{ paddingTop: 1 }}><Sparkle size={13} /></div>
      <p style={{
        flex: 1, margin: 0, fontSize: 13, lineHeight: 1.42,
        color: '#cfc7b5',
        transition: 'opacity .2s',
        opacity: loading ? 0.45 : 1,
      }}>
        {text}
      </p>
      <RegenButton loading={loading} onClick={onRegen} />
    </div>
  );
}

// ── No-data placeholder ───────────────────────────────────────────────────

function NoScansPlaceholder() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, gap: 6, opacity: 0.45,
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={T.faint} strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h1m4 0h1M14 19h2m2 0h1M19 14v2" />
      </svg>
      <p style={{ margin: 0, fontSize: 11, color: T.faint, textAlign: 'center' }}>
        No scan data yet
      </p>
    </div>
  );
}

// ── Public interface ──────────────────────────────────────────────────────

export interface ProductInsightCardProduct {
  id: string;
  name: string;
  slug: string;
  line: string | null;
  abv: string | null;
  completeness: number;
  bottle_color: string | null;
}

interface Props {
  product: ProductInsightCardProduct;
  stats: ScanStats | null;
}

// ── Main card component ────────────────────────────────────────────────────

export function ProductInsightCard({ product, stats }: Props) {
  const activeBrand = useBrandStore((s) => s.activeBrand);
  const brandSlug = activeBrand?.slug ?? 'classy';
  const bottleUrl = `${window.location.origin}/b/${brandSlug}/${product.slug}?source=qr`;

  const aiPeriod = stats?.aiPeriod ?? 'week';
  const d = stats?.[aiPeriod];

  const buildFallback = (s: ScanStats | null) => {
    const period = s?.aiPeriod ?? 'week';
    const pd = s?.[period];
    if (!s || !pd) return 'No QR scan data recorded yet for this product.';
    if (pd.changePct !== 0)
      return `${pd.changePct > 0 ? 'Up' : 'Down'} ${Math.abs(pd.changePct)}% this ${period} — keep an eye on scan trends.`;
    return `Steady this ${period} — no significant scan movement detected.`;
  };

  const [insightText, setInsightText] = useState(() => buildFallback(stats));
  const [regenLoading, setRegenLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Track whether the user has manually regenerated so we don't overwrite their custom insight
  const userRegenerated = useRef(false);

  // Sync the fallback text whenever scan stats first arrive (useState initializer
  // only runs once — stats is null on the first render while the query is loading)
  useEffect(() => {
    if (!userRegenerated.current) {
      setInsightText(buildFallback(stats));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  const handleRegen = useCallback(async () => {
    if (regenLoading || !stats) return;
    setRegenLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke('generate-insight', {
        body: {
          productName: product.name,
          period: aiPeriod,
          scans: d?.scans ?? 0,
          changePct: d?.changePct ?? 0,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const text = resp.data?.insight;
      if (text) {
        userRegenerated.current = true;
        setInsightText(text);
      }
    } catch {
      // keep existing text on error
    } finally {
      setRegenLoading(false);
    }
  }, [regenLoading, stats, product.name, aiPeriod, d]);

  const fmtNum = (n: number) => n.toLocaleString('en-US');

  return (
    <Link
      to={`/admin/product/${product.slug}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      {/* Inline CSS for transitions that rely on hover state */}
      <style>{`
        @keyframes pi-spin { to { transform: rotate(360deg); } }
        .pi-chip:hover .pi-tip {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: auto !important;
        }
      `}</style>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxSizing: 'border-box', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: hovered ? T.cardHover : T.cardBg,
          border: `1px solid ${hovered ? T.borderH : T.border}`,
          borderRadius: 14, padding: 20,
          fontFamily: 'inherit',
          transition: 'border-color .16s ease, background .16s ease',
          cursor: 'pointer',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0, fontSize: 18, fontWeight: 600,
              color: T.text, letterSpacing: '-0.01em', lineHeight: 1.15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {product.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
              <span style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em',
                color: T.gold, background: T.goldSoft,
                padding: '2px 7px', borderRadius: 4,
                textTransform: 'uppercase', lineHeight: 1.5, whiteSpace: 'nowrap',
              }}>
                {product.line ?? 'Classic'}
              </span>
              {product.abv && (
                <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
                  {product.abv}% ABV
                </span>
              )}
            </div>
          </div>
          <QrCode url={bottleUrl} size={56} />
        </div>

        {/* ── Metric row ── */}
        {stats && d ? (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
                  color: T.faint, textTransform: 'uppercase',
                }}>
                  QR Scans
                </span>
                <PeriodChip
                  period={aiPeriod}
                  isAi
                  rationale={periodRationale(stats)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: 38, fontWeight: 300, color: T.gold,
                  lineHeight: 0.95, letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {fmtNum(d.scans)}
                </span>
                <TrendPill pct={d.changePct} period={aiPeriod} />
              </div>
              {d.uniqueVisits > 0 && (
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                    stroke={T.faint} strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="6" cy="4" r="2.2" />
                    <path d="M1.5 10.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" />
                  </svg>
                  <span style={{
                    fontSize: 11, color: T.faint,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtNum(d.uniqueVisits)} unique
                  </span>
                </div>
              )}
            </div>

            {/* ── Sparkline ── */}
            <div style={{ marginTop: 12 }}>
              {aiPeriod === 'week' ? (
                <SparklineBar data={d.series} height={40} />
              ) : (
                <SparklineLine data={d.series} height={40} positive={d.changePct >= 0} />
              )}
            </div>

            {/* ── AI insight strip ── */}
            <div style={{ marginTop: 12 }}>
              <InsightStrip
                text={insightText}
                loading={regenLoading}
                onRegen={handleRegen}
              />
            </div>
          </>
        ) : (
          <NoScansPlaceholder />
        )}

        {/* ── Completeness bar ── */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <Completeness pct={product.completeness} />
        </div>
      </div>
    </Link>
  );
}
