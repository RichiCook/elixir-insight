import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Pairing = Database['public']['Tables']['product_ai_pairings']['Row'];

interface Props {
  pairings: Pairing[];
}

export function BottlePairings({ pairings }: Props) {
  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-1">
        Perfect Pairings
      </h2>
      <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mb-5">
        AI-curated suggestions
      </p>
      <div className="grid grid-cols-2 gap-3">
        {pairings.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-lg p-4 border border-cc-border ${
              p.is_featured ? 'bg-cc-cream col-span-2' : 'bg-cc-white'
            }`}
          >
            <span className="text-xl mb-2 block">{p.emoji}</span>
            <p className="font-sans-consumer text-sm font-medium text-cc-text">
              {p.name}
            </p>
            {p.subtitle && (
              <p className="font-sans-consumer text-xs text-cc-text-lt mt-0.5">
                {p.subtitle}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
