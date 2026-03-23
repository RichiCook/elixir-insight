import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Composition = Database['public']['Tables']['product_composition']['Row'];

interface Props {
  composition: Composition[];
}

export function BottleComposition({ composition }: Props) {
  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-5">
        Composition
      </h2>

      {/* Horizontal bar */}
      <div className="flex rounded overflow-hidden h-3 mb-4">
        {composition.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ width: 0 }}
            whileInView={{ width: `${c.percentage}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ backgroundColor: c.color }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {composition.map((c) => (
          <div key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="font-sans-consumer text-xs text-cc-text">
                {c.ingredient_name}
              </span>
            </div>
            <span className="font-sans-consumer text-xs font-medium text-cc-text-md">
              {c.percentage}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
