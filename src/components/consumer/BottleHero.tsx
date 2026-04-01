import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
  heroImageUrl?: string | null;
  collab?: { brand_name: string; brand_logo_url?: string | null; brand_color?: string | null } | null;
}

export function BottleHero({ product, heroImageUrl, collab }: Props) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: product.hero_bg || '#f5f0ea',
        aspectRatio: '4 / 5',
      }}
    >
      {/* Hero background image if available */}
      {heroImageUrl && (
        <img
          src={heroImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Bottle silhouette — only when no hero image */}
      {!heroImageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-24 h-48 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: product.bottle_color || '#2a2a2a' }}
          >
            <div
              className="w-16 h-8 rounded-sm"
              style={{ backgroundColor: product.label_color || '#f5f0ea' }}
            />
          </div>
        </motion.div>
      )}

      {/* Dot navigation — only show when no real hero image */}
      {!heroImageUrl && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cc-black opacity-80" />
          <span className="w-2 h-2 rounded-full bg-cc-black opacity-25" />
          <span className="w-2 h-2 rounded-full bg-cc-black opacity-25" />
        </div>
      )}
    </section>
  );
}
