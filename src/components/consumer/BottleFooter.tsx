import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
  customContent?: Record<string, any>;
}

export function BottleFooter({ product, customContent }: Props) {
  const websiteText = customContent?.website_text || 'classycocktails.com';
  const passportLabel = customContent?.passport_label || 'Digital Nutritional Passport';
  return (
    <footer className="px-6 py-8 border-t border-cc-border text-center">
      <p className="font-display text-sm italic text-cc-text-lt mb-1">
        classycocktails.com
      </p>
      <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-text-lt">
        Digital Nutritional Passport
      </p>
      {product.ean_int && (
        <p className="font-sans-consumer text-[10px] text-cc-text-lt mt-2">
          EAN {product.ean_int}
        </p>
      )}
      <div className="flex items-center justify-center gap-1 mt-4">
        <span className="w-1 h-1 rounded-full bg-cc-gold" />
        <span className="w-1 h-1 rounded-full bg-cc-gold opacity-60" />
        <span className="w-1 h-1 rounded-full bg-cc-gold opacity-30" />
      </div>
    </footer>
  );
}
