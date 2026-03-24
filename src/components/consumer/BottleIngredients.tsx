import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Translation = Database['public']['Tables']['product_translations']['Row'];

interface Props {
  translation: Translation;
  allergensSummary: string | null;
  onExpand?: () => void;
}

export function BottleIngredients({ translation, allergensSummary, onExpand }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-4">
        Ingredients
      </h2>

      {/* Short list */}
      {translation.ingredient_list_short && (
        <p className="font-sans-consumer text-xs tracking-wide uppercase text-cc-text-md leading-relaxed">
          {translation.ingredient_list_short}
        </p>
      )}

      {/* Expandable full list */}
      {translation.ingredient_list_full && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-sans-consumer text-xs text-cc-gold mt-3 flex items-center gap-1"
          >
            {expanded ? 'Hide full list' : 'View full ingredient list'}
            <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
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
                <p className="font-sans-consumer text-xs text-cc-text-md leading-relaxed mt-3 p-3 bg-cc-cream rounded-lg">
                  {translation.ingredient_list_full}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Allergens */}
      {allergensSummary && allergensSummary !== 'None' && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded bg-[#fef3cd]">
          <span className="text-sm">⚠️</span>
          <p className="font-sans-consumer text-xs font-medium text-[#856404]">
            {allergensSummary}
          </p>
        </div>
      )}
    </section>
  );
}
