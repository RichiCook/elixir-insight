import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type Translation = Database['public']['Tables']['product_translations']['Row'];

interface Props {
  product: Product;
  translation: Translation | undefined;
}

export function BottleHero({ product, translation }: Props) {
  const isNoRegrets = product.line === 'No Regrets';

  return (
    <section
      className="relative px-6 pt-8 pb-10"
      style={{ backgroundColor: product.hero_bg || '#f5f0ea' }}
    >
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-6"
      >
        <p className="font-sans-consumer text-[10px] tracking-[0.3em] uppercase text-cc-text-lt mb-1">
          Classy Cocktails
        </p>
        <h1 className="font-display text-4xl font-light tracking-wide text-cc-black">
          {product.name}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="font-sans-consumer text-xs tracking-widest uppercase text-cc-text-md">
            {product.line}
          </span>
          <span className="w-1 h-1 rounded-full bg-cc-gold" />
          <span className="font-sans-consumer text-xs text-cc-text-md">
            {isNoRegrets ? 'Alcohol Free' : `${product.abv}% ABV`}
          </span>
        </div>
      </motion.div>

      {/* Bottle silhouette placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mx-auto w-24 h-48 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: product.bottle_color || '#2a2a2a' }}
      >
        <div
          className="w-16 h-8 rounded-sm"
          style={{ backgroundColor: product.label_color || '#f5f0ea' }}
        />
      </motion.div>

      {/* Claim */}
      {translation?.claim && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-display italic text-sm text-center text-cc-text-md mt-6 leading-relaxed whitespace-pre-line"
        >
          {translation.claim}
        </motion.p>
      )}
    </section>
  );
}
