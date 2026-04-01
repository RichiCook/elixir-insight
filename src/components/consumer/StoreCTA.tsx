interface Props {
  slug: string;
  onCtaClick?: () => void;
  customButtonText?: string;
  customButtonUrl?: string;
  customFooterText?: string;
}

export function StoreCTA({ slug, onCtaClick, customButtonText, customButtonUrl, customFooterText }: Props) {
  const buttonText = customButtonText || 'View on our Store ↗';
  const buttonUrl = customButtonUrl || `https://classycocktails.com/products/${slug}`;
  const footerText = customFooterText || '';

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
        {footerText || <>Powered by <span className="text-cc-gold">Aitems</span> · Product Intelligence</>}
      </p>
    </section>
  );
}
