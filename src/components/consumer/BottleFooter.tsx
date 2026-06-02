import { Link } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { t, getLocalizedContent } from '@/lib/consumerI18n';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
  customContent?: Record<string, any>;
  collab?: { brand_name: string; brand_color?: string | null } | null;
  brandName?: string;
  brandWebsiteUrl?: string;
  brandPrivacyEmail?: string;
  lang?: string;
}

export function BottleFooter({ product, customContent, collab, brandName = 'Classy Cocktails', brandWebsiteUrl, brandPrivacyEmail, lang = 'EN' }: Props) {
  const websiteText = getLocalizedContent(customContent, 'website_text', lang)
    || (brandWebsiteUrl ? brandWebsiteUrl.replace(/^https?:\/\//, '') : 'classycocktails.com');
  const passportLabel = getLocalizedContent(customContent, 'passport_label', lang)
    || t(lang, 'digital_nutritional_passport');
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
        {t(lang, 'drink_responsibly')}
      </p>
      <p className="font-sans-consumer text-[9px] mt-2">
        <Link to="/privacy" className="text-cc-text-lt hover:text-cc-gold transition-colors">
          {t(lang, 'privacy_policy')}
        </Link>
        {' · '}
        <a href={`mailto:${privacyEmail}`} className="text-cc-text-lt hover:text-cc-gold transition-colors">
          {t(lang, 'data_requests')}
        </a>
      </p>
    </footer>
  );
}
