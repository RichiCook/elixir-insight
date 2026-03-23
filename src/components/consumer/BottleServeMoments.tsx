import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type ServeMoment = Database['public']['Tables']['product_serve_moments']['Row'];

interface Props {
  moments: ServeMoment[];
}

export function BottleServeMoments({ moments }: Props) {
  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-5">
        Perfect Moments
      </h2>
      <div className="space-y-3">
        {moments.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg p-4"
            style={{ backgroundColor: m.background_color || '#1a1a1a' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{m.emoji}</span>
              <div>
                <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-gold mb-1">
                  {m.occasion}
                </p>
                <p className="font-display text-base text-[#fafaf8] font-light">
                  {m.title}
                </p>
                <p className="font-sans-consumer text-xs text-[#9a9a9a] mt-1 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
