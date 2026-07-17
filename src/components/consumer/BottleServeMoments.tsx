import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { t, getRowTranslation } from '@/lib/consumerI18n';

type ServeMoment = Database['public']['Tables']['product_serve_moments']['Row'] & {
  translations?: Record<string, Record<string, string>> | null;
};

interface Props {
  moments: ServeMoment[];
  line: string;
  lang?: string;
  serveMomentImages?: Record<number, string>; // sort_order -> image url
}

function getSectionHeading(line: string, lang: string) {
  if (line === 'No Regrets') return t(lang, 'any_moment');
  if (line === 'Sparkling') return t(lang, 'made_for_aperitivo');
  return t(lang, 'perfect_occasion');
}

export function BottleServeMoments({ moments, line, lang = 'EN', serveMomentImages }: Props) {
  // Per-card images win; the positional serve_moment image pool only applies
  // to products saved before per-card images existed.
  const hasPerCardImages = moments.some((m) => m.image_url);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio
        let best: IntersectionObserverEntry | null = null;
        entries.forEach((e) => {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        });
        if (best && best.isIntersecting) {
          const idx = cardRefs.current.findIndex((el) => el === best!.target);
          if (idx >= 0) setActiveIndex(idx);
        }
      },
      { root: scroller, threshold: [0.5, 0.75, 1] }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [moments.length]);

  return (
    <section className="py-8 border-t border-cc-border">
      <h2 className="font-display text-[30px] font-light text-cc-black text-center mb-6 px-6">
        {getSectionHeading(line, lang)}
      </h2>

      {/* Horizontal scroll carousel with right-edge fade */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto px-6 pb-2 serve-carousel"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .serve-carousel::-webkit-scrollbar { display: none; }
          `}</style>
          {moments.map((m, i) => {
            const imageUrl = hasPerCardImages ? m.image_url : serveMomentImages?.[i];
            const tr = getRowTranslation(m, lang);
            const title = tr.title || m.title;
            const description = tr.description || m.description;
            const occasion = tr.occasion || m.occasion;
            return (
              <motion.div
                key={m.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 rounded-lg overflow-hidden border border-cc-border"
                style={{ minWidth: 220, width: '60%', scrollSnapAlign: 'start' }}
              >
              {/* Image area */}
              <div
                className="flex items-center justify-center relative overflow-hidden"
                style={{
                  aspectRatio: '4 / 3',
                  backgroundColor: m.background_color || '#1a1a1a',
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={title ?? ''} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-[52px]">{m.emoji}</span>
                )}
              </div>

              {/* Text body */}
              <div className="p-4 bg-cc-white">
                <p className="font-sans-consumer text-[9px] tracking-[0.16em] uppercase text-cc-gold mb-1">
                  {occasion}
                </p>
                <p className="font-display text-lg text-cc-text font-light mb-1">
                  {title}
                </p>
                <p className="font-sans-consumer text-[11px] font-light text-cc-text-lt leading-relaxed">
                  {description}
                </p>
              </div>
              </motion.div>
            );
          })}
        </div>
        {/* Right-edge gradient fade hint */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 h-full"
          style={{
            width: 40,
            background: 'linear-gradient(to right, rgba(245,240,234,0), #f5f0ea)',
          }}
        />
      </div>

      {/* Dot indicators */}
      {moments.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {moments.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                backgroundColor: i === activeIndex ? '#b8975a' : 'rgba(42,42,42,0.2)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
