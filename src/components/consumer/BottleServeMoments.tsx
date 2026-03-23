import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type ServeMoment = Database['public']['Tables']['product_serve_moments']['Row'];

interface Props {
  moments: ServeMoment[];
  line: string;
}

function getSectionHeading(line: string) {
  if (line === 'No Regrets') return 'Any Moment, No Regrets';
  if (line === 'Sparkling') return 'Made for the Aperitivo';
  return 'The Perfect Occasion';
}

export function BottleServeMoments({ moments, line }: Props) {
  return (
    <section className="py-8 border-t border-cc-border">
      <h2 className="font-display text-[30px] font-light text-cc-black text-center mb-6 px-6">
        {getSectionHeading(line)}
      </h2>

      {/* Horizontal scroll carousel */}
      <div
        className="flex gap-3 overflow-x-auto px-6 pb-2"
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
        {moments.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 rounded-lg overflow-hidden border border-cc-border"
            style={{ width: '70%', scrollSnapAlign: 'start' }}
          >
            {/* Dark image area */}
            <div
              className="flex items-center justify-center"
              style={{
                aspectRatio: '4 / 3',
                backgroundColor: m.background_color || '#1a1a1a',
              }}
            >
              <span className="text-[52px]">{m.emoji}</span>
            </div>

            {/* Text body */}
            <div className="p-4 bg-cc-white">
              <p className="font-sans-consumer text-[9px] tracking-[0.16em] uppercase text-cc-gold mb-1">
                {m.occasion}
              </p>
              <p className="font-display text-lg text-cc-text font-light mb-1">
                {m.title}
              </p>
              <p className="font-sans-consumer text-[11px] font-light text-cc-text-lt leading-relaxed">
                {m.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
