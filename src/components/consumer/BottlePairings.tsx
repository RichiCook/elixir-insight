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
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-1">
        {t(lang, 'perfect_pairings')}
      </h2>
      <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mb-5">
        {t(lang, 'ai_curated')}
      </p>
      <div className="grid grid-cols-2 gap-2">
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
              transition={{ delay: i * 0.08 }}
              className="relative rounded-lg p-4 border border-cc-border bg-cc-white"
            >
              {p.is_featured && (
                <span className="absolute top-2 right-2 font-sans-consumer text-[8px] tracking-[0.12em] uppercase bg-cc-cream text-cc-gold border border-cc-border rounded px-1.5 py-0.5">
                  {t(lang, 'featured')}
                </span>
              )}
              <span className="text-xl mb-2 block">{p.emoji}</span>
              <p className="font-sans-consumer text-sm font-medium text-cc-text">
                {name}
              </p>
              {subtitle && (
                <p className="font-sans-consumer text-xs text-cc-text-lt mt-0.5">
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
