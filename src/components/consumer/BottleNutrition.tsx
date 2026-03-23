import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type TechData = Database['public']['Tables']['product_technical_data']['Row'];

interface Props {
  data: TechData;
}

export function BottleNutrition({ data }: Props) {
  const [expanded, setExpanded] = useState(false);

  const nutritionRows = [
    { label: 'Energy', value: `${data.energy_kcal} kcal / ${data.energy_kj} kJ` },
    { label: 'Fats', value: data.fats },
    { label: '  of which saturated', value: data.saturated_fats },
    { label: 'Carbohydrates', value: data.carbohydrates },
    { label: '  of which sugars', value: data.sugars },
    { label: 'Fibre', value: data.fibre },
    { label: 'Proteins', value: data.proteins },
    { label: 'Salt', value: data.salt },
  ].filter((r) => r.value);

  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="font-display text-lg font-light tracking-wide text-cc-black">
          Nutrition & Technical
        </h2>
        <span className="font-sans-consumer text-xs text-cc-gold">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mt-4 mb-3">
              Per 100ml
            </p>
            <div className="space-y-0">
              {nutritionRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-2 border-b border-cc-border last:border-0"
                >
                  <span className="font-sans-consumer text-xs text-cc-text-md">
                    {row.label}
                  </span>
                  <span className="font-sans-consumer text-xs font-medium text-cc-text">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Extra info */}
            {data.taste_profile && (
              <div className="mt-4">
                <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mb-1">
                  Taste Profile
                </p>
                <p className="font-sans-consumer text-xs text-cc-text-md">
                  {data.taste_profile}
                </p>
              </div>
            )}

            {data.storage_conditions && (
              <div className="mt-3">
                <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mb-1">
                  Storage
                </p>
                <p className="font-sans-consumer text-xs text-cc-text-md">
                  {data.storage_conditions}
                </p>
              </div>
            )}

            {data.shelf_life && (
              <div className="mt-3">
                <p className="font-sans-consumer text-[10px] tracking-[0.15em] uppercase text-cc-text-lt mb-1">
                  Shelf Life
                </p>
                <p className="font-sans-consumer text-xs text-cc-text-md">
                  {data.shelf_life}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
