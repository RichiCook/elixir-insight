import { Link } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
  customContent?: Record<string, any>;
  collab?: { brand_name: string; brand_color?: string | null } | null;
  brandName?: string;
  brandWebsiteUrl?: string;
  brandPrivacyEmail?: string;
}

export function BottleFooter({ product, customContent, collab, brandName = 'Classy Cocktails', brandWebsiteUrl, brandPrivacyEmail }: Props) {
  const websiteText = customContent?.website_text || (brandWebsiteUrl ? brandWebsiteUrl.replace(/^https?:\/\//, '') : 'classycocktails.com');
  const passportLabel = customContent?.passport_label || 'Digital Nutritional Passport';
  const privacyEmail = brandPrivacyEmail || 'privacy@classycocktails.com';
  return (
    <footer className="px-6 py-8 border-t border-cc-border text-center">
      <p className="font-display text-sm italic text-cc-text-lt mb-1">
        {websiteText}
      </p>
      <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-text-lt">
        {passportLabel}
      </p>
      {product.ean_int && (
        <p className="font-sans-consumer text-[10px] text-cc-text-lt mt-2">
          EAN {product.ean_int}
        </p>
      )}
      {collab && (
        <p className="font-sans-consumer text-[10px] text-cc-text-lt mt-3 italic">
          Created exclusively for {collab.brand_name} × {brandName}
        </p>
      )}
      <div className="flex items-center justify-center gap-1 mt-4">
        <span className="w-1 h-1 rounded-full bg-cc-gold" />
        <span className="w-1 h-1 rounded-full bg-cc-gold opacity-60" />
        <span className="w-1 h-1 rounded-full bg-cc-gold opacity-30" />
      </div>
      <p className="font-sans-consumer text-[9px] text-cc-text-lt mt-4">
        Drink responsibly. Not for sale to persons under 18.
      </p>
      <p className="font-sans-consumer text-[9px] mt-2">
        <Link to="/privacy" className="text-cc-text-lt hover:text-cc-gold transition-colors">
          Privacy Policy
        </Link>
        {' · '}
        <a href={`mailto:${privacyEmail}`} className="text-cc-text-lt hover:text-cc-gold transition-colors">
          Data Requests
        </a>
      </p>
    </footer>
  );
}
