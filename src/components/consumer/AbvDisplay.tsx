import type { Database } from '@/integrations/supabase/types';
import { parseAbvNumber, ABV_UNIT } from '@/lib/abv';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
}

export function AbvDisplay({ product }: Props) {
  const isNoRegrets = product.line === 'No Regrets';

  return (
    <div className="flex items-baseline justify-between px-5 py-5">
      {/* Left: ABV */}
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[28px] font-light text-cc-text leading-none">
          {isNoRegrets ? '0.0' : (parseAbvNumber(product.abv) ?? '0.0')}
        </span>
        <span className="font-sans-consumer text-[10px] tracking-[0.06em] text-cc-text-lt">{ABV_UNIT}</span>
      </div>

      {/* Right: EAN + Serving */}
      <div className="text-right">
        {product.ean_int && (
          <p className="font-sans-consumer text-[9px] tracking-[0.1em] text-cc-text-lt uppercase">
            EAN {product.ean_int}
          </p>
        )}
        {product.serving && (
          <p className="font-sans-consumer text-[9px] tracking-[0.1em] text-cc-text-lt uppercase">
            {product.serving}
          </p>
        )}
      </div>
    </div>
  );
}
