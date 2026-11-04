import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCollection, normalizeLine, type CollectionProduct } from '@/hooks/useCollection';
import { ClassyWordmark } from '@/components/consumer/ClassyWordmark';
import { formatAbv } from '@/lib/abv';

/** Resized WebP via Vercel's image optimizer — source photos are ~1–1.5 MB. */
function thumb(url: string, w = 640): string {
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=72`;
}

const C = {
  bg: '#efebe4',
  card: '#fbf9f6',
  line: 'rgba(28,24,18,0.10)',
  text: '#1c1812',
  muted: '#7b7265',
  gold: '#b8975a',
};

const COPY = {
  IT: {
    kicker: 'La collezione',
    title: 'Tutti i nostri cocktail',
    sub: 'Miscelati in Italia da Patrick Pistolesi.',
    search: 'Cerca un cocktail',
    all: 'Tutti',
    discover: 'Scopri il cocktail',
    none: 'Nessun cocktail trovato.',
    count: (n: number) => `${n} cocktail`,
  },
  EN: {
    kicker: 'The collection',
    title: 'All our cocktails',
    sub: 'Mixed in Italy by Patrick Pistolesi.',
    search: 'Search a cocktail',
    all: 'All',
    discover: 'Discover the cocktail',
    none: 'No cocktails found.',
    count: (n: number) => `${n} cocktails`,
  },
};

export default function CollectionPage() {
  const { data, isLoading } = useCollection();
  const [lang, setLang] = useState<'IT' | 'EN'>('IT');
  const [q, setQ] = useState('');
  const [line, setLine] = useState<string>('all');
  const t = COPY[lang];

  const lines = useMemo(() => {
    const s = new Set((data ?? []).map((p) => normalizeLine(p.line)));
    return [...s].sort();
  }, [data]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (line !== 'all' && normalizeLine(p.line) !== line) return false;
      if (!needle) return true;
      return [p.name, p.spirit, p.flavour, p.line].some((f) => (f ?? '').toLowerCase().includes(needle));
    });
  }, [data, q, line]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.line}`, background: 'rgba(251,249,246,0.75)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <ClassyWordmark height={22} />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['IT', 'EN'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', fontSize: 12, letterSpacing: '0.12em',
                         color: lang === l ? C.gold : C.muted, fontWeight: lang === l ? 600 : 400 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 20px 60px' }}>
        {/* Title + search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold }}>
              ✦ {t.kicker}
            </p>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)', fontWeight: 400, fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.1 }}>
              {t.title}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.muted }}>{t.sub}</p>
          </div>
          <label style={{ position: 'relative', display: 'block', minWidth: 230, flex: '0 1 300px' }}>
            <span aria-hidden style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }}>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              style={{ width: '100%', padding: '11px 14px 11px 32px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, color: C.text, fontSize: 16, outline: 'none' }}
            />
          </label>
        </div>

        {/* Line filters */}
        {lines.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
            {[{ k: 'all', label: t.all }, ...lines.map((l) => ({ k: l, label: l }))].map((f) => {
              const on = line === f.k;
              return (
                <button key={f.k} onClick={() => setLine(f.k)}
                  style={{ padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, letterSpacing: '0.04em',
                           border: `1px solid ${on ? C.gold : C.line}`, background: on ? C.gold : 'transparent', color: on ? '#fff' : C.muted }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, height: 280, opacity: 0.6 }} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p style={{ color: C.muted, padding: '48px 0', textAlign: 'center' }}>{t.none}</p>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: C.muted }}>{t.count(shown.length)}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
              {shown.map((p, i) => <Card key={p.id} p={p} i={i} discover={t.discover} />)}
            </div>
          </>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '20px', textAlign: 'center', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
        Mixed in Italy · Classy Cocktails
      </footer>
    </div>
  );
}

function Card({ p, i, discover }: { p: CollectionProduct; i: number; discover: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.2) }}
    >
      <Link to={`/b/classy/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', height: '100%' }}>
        <div style={{ aspectRatio: '4 / 3', background: p.liquid_color || '#e7e1d7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {p.image_url ? (
            <img src={thumb(p.image_url)} alt={p.name} loading="lazy"
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 30, color: 'rgba(28,24,18,0.25)' }}>
              {p.name.charAt(0)}
            </span>
          )}
        </div>
        <div style={{ padding: '13px 14px 15px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)', fontSize: 19, lineHeight: 1.2 }}>{p.name}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: C.muted }}>
            {[normalizeLine(p.line), formatAbv(p.abv)].filter(Boolean).join(' · ')}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: C.gold }}>{discover} ↗</p>
        </div>
      </Link>
    </motion.div>
  );
}
