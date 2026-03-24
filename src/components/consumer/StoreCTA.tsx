interface Props {
  slug: string;
  onCtaClick?: () => void;
}

export function StoreCTA({ slug, onCtaClick }: Props) {
  return (
    <section className="px-[18px] pb-4">
      <a
        href={`https://classycocktails.com/products/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCtaClick}
        className="block w-full text-center font-sans-consumer text-[13px] font-medium tracking-[0.08em] text-white rounded py-[17px]"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        View on our Store ↗
      </a>
      <p className="text-center font-sans-consumer text-[9px] text-cc-text-lt mt-3">
        Powered by <span className="text-cc-gold">Aitems</span> · Product Intelligence
      </p>
    </section>
  );
}
