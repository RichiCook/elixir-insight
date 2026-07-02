import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalogueData, type CatalogueProduct } from '@/hooks/useCatalogues';
import { ActivationEmbed } from '@/components/consumer/ActivationRenderer';
import { ClassyWordmark } from '@/components/consumer/ClassyWordmark';
import { formatAbv } from '@/lib/abv';

// Resized WebP thumbnail via Vercel's same-origin image optimizer. The source
// product photos are ~1–1.5 MB each; this serves ~40–60 KB for the cards.
function thumb(url: string, w = 640): string {
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=72`;
}

export default function CataloguePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useCatalogueData(slug);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#c5a35a', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0b0f', color: '#9b9382', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center' }}>
        <p>This collection isn’t available.</p>
      </div>
    );
  }

  const c = data.catalogue;
  const bg = c.bg_color || '#0c0b0f';
  const accent = c.accent_color || '#c5a35a';
  const text = c.text_color || '#f4efe6';
  const muted = c.text_muted || '#9b9382';
  const partnerLogo = typeof c.partner_logo_url === 'string' && /^https?:\/\//i.test(c.partner_logo_url) ? c.partner_logo_url : undefined;

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <div className="px-3 sm:px-[22px]" style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40, paddingBottom: 64 }}>
        {/* Co-brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
          {c.show_classy && <ClassyWordmark color={text} height={30} />}
          {(partnerLogo || c.partner_name) && c.show_classy && <span style={{ fontSize: 12, color: accent }}>✕</span>}
          {partnerLogo ? (
            <img src={partnerLogo} alt={c.partner_name || 'Partner'} style={{ height: 26, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
          ) : c.partner_name ? (
            <span style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', letterSpacing: '0.13em', fontSize: 14, color: text }}>{c.partner_name}</span>
          ) : null}
        </div>

        {/* Hero copy */}
        <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 26px' }}>
          {c.kicker && <p style={{ fontSize: 11, letterSpacing: '0.28em', color: accent, margin: '0 0 10px' }}>{c.kicker}</p>}
          {c.title && <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontWeight: 400, fontSize: 34, lineHeight: 1.15, color: text, margin: '0 0 12px' }}>{c.title}</h1>}
          {c.intro && <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted, margin: 0 }}>{c.intro}</p>}
        </div>

        {/* Embedded activation — code + link revealed only after name+email submission */}
        {data.activation && (
          <div style={{ margin: '0 auto 30px', maxWidth: 520 }}>
            <ActivationEmbed activation={data.activation} productSlug={c.slug} brandName="Classy Cocktails" />
          </div>
        )}

        {/* Collection header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 17, color: text }}>The cocktails</span>
          <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: muted }}>{data.products.length} serves</span>
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {data.products.map((p, i) => (
            <CatalogueCard key={p.id} product={p} accent={accent} text={text} muted={muted} index={i} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, opacity: 0.7, margin: '34px 0 0' }}>
          Mixed in Italy · Classy Cocktails{c.partner_name ? ` ✕ ${c.partner_name}` : ''}
        </p>
      </div>
    </div>
  );
}

function CatalogueCard({ product, accent, text, muted, index }: { product: CatalogueProduct; accent: string; text: string; muted: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Link
        to={`/b/classy/${product.slug}`}
        style={{ textDecoration: 'none', display: 'block', background: '#16151c', border: '1px solid rgba(197,163,90,0.26)', borderRadius: 12, overflow: 'hidden' }}
      >
        <div style={{ aspectRatio: '3 / 4', background: product.liquid_color || '#1d1c24', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {product.image_url ? (
            <img
              src={thumb(product.image_url, 640)}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallback !== '1') { img.dataset.fallback = '1'; img.src = product.image_url!; }
              }}
              alt={product.name}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="30" height="56" viewBox="0 0 24 46" fill="none" stroke={accent} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
              <path d="M10 3 h4 v4.5 c0 1.6 0.7 2.3 1.7 3.4 C17.2 12.4 18 14.5 18 17.5 V40 c0 1.9-1.5 3.4-3.4 3.4 H9.4 C7.5 43.4 6 41.9 6 40 V17.5 c0-3 0.8-5.1 2.3-6.6 C9.3 9.8 10 9.1 10 7.5 Z" />
              <line x1="6.4" y1="25" x2="17.6" y2="25" />
              <line x1="6.4" y1="34" x2="17.6" y2="34" />
            </svg>
          )}
        </div>
        <div style={{ padding: '12px 13px' }}>
          <div style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: 17, color: text, lineHeight: 1.2 }}>{product.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {product.line && <span style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: accent }}>{product.line}</span>}
            {formatAbv(product.abv) && <span style={{ fontSize: 11, color: muted }}>{formatAbv(product.abv)}</span>}
          </div>
          <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
            View serve →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
