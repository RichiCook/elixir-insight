import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
}

export function GenuineCard({ product }: Props) {
  const handleViewDpp = () => {
    window.dispatchEvent(new CustomEvent('dpp:open'));
  };
  const isNoRegrets = product.line === 'No Regrets';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mx-[14px] -mt-5 relative z-10 rounded-lg border border-cc-border bg-cc-white p-4"
    >
      {/* Genuine label */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-cc-gold text-[10px]">✦</span>
        <span className="font-sans-consumer text-[9px] tracking-[0.16em] uppercase text-cc-text-lt">
          Genuine Product
        </span>
      </div>

      {/* Product name */}
      <h1 className="font-display text-2xl font-normal text-cc-text leading-tight mb-1">
        {product.name}
      </h1>

      {/* Subtitle */}
      <p className="font-sans-consumer text-[11px] font-light text-cc-text-lt mb-3">
        Mixed in Italy by Patrick Pistolesi ·{' '}
        <span className="text-cc-gold">{product.line}</span> Line
      </p>

      {/* Compact product info row (ABV + EAN + Serving) */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-display text-[15px] font-light text-cc-text leading-none">
          {isNoRegrets ? '0.0% ALC. FREE' : product.abv}
        </span>
        <div className="text-right space-y-0.5">
          {product.ean_int && (
            <p className="font-sans-consumer text-[8px] tracking-[0.1em] text-cc-text-lt uppercase leading-none">
              EAN {product.ean_int}
            </p>
          )}
          {product.serving && (
            <p className="font-sans-consumer text-[8px] tracking-[0.1em] text-cc-text-lt uppercase leading-none">
              {product.serving}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-cc-border mb-3" />

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-cc-green"
            style={{ animation: 'cc-pulse-dot 2.4s ease-in-out infinite' }}
          />
          <style>{`
            @keyframes cc-pulse-dot {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.35; transform: scale(0.85); }
            }
          `}</style>
          <span className="font-sans-consumer text-[11px] text-cc-text">
            Digital Passport Available
          </span>
        </div>
        <button
          type="button"
          onClick={handleViewDpp}
          className="font-sans-consumer text-[11px] border border-cc-border rounded px-4 py-1.5 text-cc-text hover:bg-cc-cream2 transition-colors"
        >
          View ↗
        </button>
      </div>
    </motion.div>
  );
}
