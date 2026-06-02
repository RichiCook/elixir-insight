import { CrosshatchPattern, CLettermark } from './DecorativeSVG';
import { getLocalizedContent } from '@/lib/consumerI18n';

interface Props {
  lang: string;
  customContent?: Record<string, any>;
}

// Default fallback text keyed by language — used when no custom content is set.
// Add more language keys here as needed.
const DEFAULT_TEXT: Record<string, string> = {
  EN: "Every bottle from Classy Cocktails starts with an obsession: to bring the world's great cocktails — crafted by the best bartenders — to your table, ready to pour. Mixed by <gold>Patrick Pistolesi</gold>, one of Italy's most celebrated bartenders, each recipe is dialled to perfection, then locked in a bottle.",
  IT: "Ogni bottiglia di Classy Cocktails nasce da un'ossessione: portare i grandi cocktail del mondo — realizzati dai migliori bartender — sulla tua tavola, pronti da versare. Ideati da <gold>Patrick Pistolesi</gold>, uno dei bartender più celebrati d'Italia, ogni ricetta è calibrata alla perfezione, poi chiusa in una bottiglia.",
};

function renderText(raw: string) {
  const parts = raw.split(/<gold>(.*?)<\/gold>/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-cc-gold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function BrandHeritage({ lang, customContent }: Props) {
  // Localized body — checks `body_it`, `body_en`, `body` in that order (for IT),
  // then falls back to the built-in DEFAULT_TEXT for the active language.
  const localizedBody = getLocalizedContent(customContent, 'body', lang);
  const text = localizedBody || DEFAULT_TEXT[lang.toUpperCase()] || DEFAULT_TEXT.EN;

  const badgeText = getLocalizedContent(customContent, 'badge_text', lang) || 'Since 2020 · Made in Italy';
  const headingMain = getLocalizedContent(customContent, 'heading', lang) || 'A Story of ';
  const headingAccent = getLocalizedContent(customContent, 'heading_accent', lang) || 'Craft';
  const hasCustomHeading = !!(customContent && (customContent.heading || customContent[`heading_${lang.toLowerCase()}`] || customContent.heading_en));

  return (
    <>
      {/* Part A — dark visual block */}
      <section
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', backgroundColor: '#0f0f0f' }}
      >
        <CrosshatchPattern id="heritage-cross" />
        <CLettermark />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.75))' }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10">
          <p className="font-sans-consumer text-[8px] tracking-[0.18em] uppercase text-cc-gold mb-3">
            {badgeText}
          </p>
          <h2 className="font-display text-[30px] font-light text-white leading-[1.15]">
            {headingMain}{headingAccent && <em className="italic text-cc-gold">{headingAccent}</em>}{!hasCustomHeading && ' & Character'}
          </h2>
        </div>
      </section>

      {/* Part B — white text block */}
      <section className="bg-cc-white px-[18px] py-6">
        <p className="font-sans-consumer text-[13px] font-light text-cc-text-md leading-[1.75]">
          {renderText(text)}
        </p>
      </section>
    </>
  );
}
