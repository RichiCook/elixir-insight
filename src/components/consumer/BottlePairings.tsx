import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';
import { t, getRowTranslation } from '@/lib/consumerI18n';

type Pairing = Database['public']['Tables']['product_ai_pairings']['Row'] & {
  translations?: Record<string, Record<string, string>> | null;
};

interface Props {
  pairings: Pairing[];
  lang?: string;
}

export function BottlePairings({ pairings, lang = 'EN' }: Props) {
  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-6">
        {t(lang, 'perfect_pairings')}
      </h2>
      <div className={`grid gap-3 ${pairings.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {pairings.map((p, i) => {
          const tr = getRowTranslation(p, lang);
          const name = tr.name || p.name;
          const subtitle = tr.subtitle || p.subtitle;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center text-center rounded-xl border border-cc-border bg-cc-white px-4 py-6"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cc-cream text-2xl mb-4">
                {p.emoji}
              </span>
              <p className="font-display text-[15px] leading-snug text-cc-black">
                {name}
              </p>
              {subtitle && (
                <p className="font-sans-consumer text-[9px] tracking-[0.18em] uppercase text-cc-text-lt mt-2">
                  {subtitle}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
