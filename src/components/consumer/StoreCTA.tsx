import { t, getLocalizedContent } from '@/lib/consumerI18n';

interface Props {
  slug: string;
  productLink?: string | null;
  brandWebsiteUrl?: string | null;
  onCtaClick?: () => void;
  customButtonText?: string;
  customButtonUrl?: string;
  customFooterText?: string;
  customContent?: Record<string, any>;
  lang?: string;
  /** Signature collab cocktails point to the Classy catalogue instead of a per-product store page. */
  isSignature?: boolean;
}

const EXPLORE_CLASSY_URL = 'https://classycocktails.com/en/collections/all-products';

export function StoreCTA({
  slug,
  productLink,
  brandWebsiteUrl,
  onCtaClick,
  customButtonText,
  customButtonUrl,
  customFooterText,
  customContent,
  lang = 'EN',
  isSignature = false,
}: Props) {
  const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);
  const defaultUrl = isSignature
    ? EXPLORE_CLASSY_URL
    : productLink || (brandWebsiteUrl
      ? `${brandWebsiteUrl.replace(/\/$/, '')}/products/${slug}`
      : `https://classycocktails.com/products/${slug}`);

  // Button text: explicit prop > localized custom_content > i18n default
  const localizedButtonText = getLocalizedContent(customContent, 'button_text', lang);
  const defaultButtonText = isSignature ? t(lang, 'explore_classy') : t(lang, 'view_on_store');
  const buttonText = customButtonText || localizedButtonText || defaultButtonText;

  // Button URL: explicit prop > localized custom_content > default
  const localizedButtonUrl = getLocalizedContent(customContent, 'button_url', lang);
  const rawButtonUrl = customButtonUrl || localizedButtonUrl;
  const buttonUrl = rawButtonUrl && isSafeUrl(rawButtonUrl) ? rawButtonUrl : defaultUrl;

  // Footer text
  const localizedFooterText = getLocalizedContent(customContent, 'footer_text', lang);
  const footerText = customFooterText || localizedFooterText || t(lang, 'digital_product_passport');

  return (
    <section className="px-[18px] pb-4">
      <a
        href={buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCtaClick}
        className="block w-full text-center font-sans-consumer text-[13px] font-medium tracking-[0.08em] text-white rounded py-[17px]"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {buttonText}
      </a>
      <p className="text-center font-sans-consumer text-[9px] text-cc-text-lt mt-3">
        {footerText}
      </p>
    </section>
  );
}
