import { CrosshatchPattern, CLettermark } from './DecorativeSVG';

interface Props {
  line: string;
  bottleColor: string | null;
  editorialImageUrl?: string | null;
  customContent?: Record<string, any>;
}

function getContent(line: string) {
  if (line === 'No Regrets') {
    return {
      title: <>Genuinely <em className="italic text-cc-gold">Healthy</em></>,
      body: 'Every ingredient chosen for what it gives you. Reishi mushroom, aronia, ginger. No alcohol. No regrets.',
    };
  }
  if (line === 'Sparkling') {
    return {
      title: <>Reinventing the <em className="italic text-cc-gold">Spritz</em></>,
      body: 'Not your average aperitivo. Natural botanicals, sparkling wine, and a citrus twist — light, lively, genuinely special.',
    };
  }
  return {
    title: <>The Art of the <em className="italic text-cc-gold">Aperitivo</em></>,
    body: 'A moment of pause, of pleasure, of character. Classy Cocktails brings the Italian aperitivo ritual into every glass — crafted, ready, and unforgettable.',
  };
}

function darkenHex(hex: string): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.floor(parseInt(h.substring(0, 2), 16) * 0.25));
  const g = Math.max(0, Math.floor(parseInt(h.substring(2, 4), 16) * 0.25));
  const b = Math.max(0, Math.floor(parseInt(h.substring(4, 6), 16) * 0.25));
  return `rgb(${r},${g},${b})`;
}

export function EditorialBlock({ line, bottleColor, editorialImageUrl, customContent }: Props) {
  const defaults = getContent(line);
  const bg = darkenHex(bottleColor || '#2a2a2a');

  // Use custom content if provided, otherwise fall back to defaults
  const hasCustom = customContent && (customContent.heading || customContent.body);
  const lineLabel = customContent?.line_label || `${line} Line`;
  const title = hasCustom && customContent.heading
    ? <>{customContent.heading.replace(customContent.heading_accent || '', '')} {customContent.heading_accent && <em className="italic text-cc-gold">{customContent.heading_accent}</em>}</>
    : defaults.title;
  const body = (hasCustom && customContent.body) || defaults.body;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '3 / 4', backgroundColor: bg }}
    >
      {/* Editorial background image if available */}
      {editorialImageUrl && (
        <img
          src={editorialImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!editorialImageUrl && (
        <>
          <CrosshatchPattern id="editorial-cross" />
          <CLettermark />
        </>
      )}

      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.75))' }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10">
        <p className="font-sans-consumer text-[9px] tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {lineLabel}
        </p>
        <h2 className="font-display text-[28px] font-normal text-white leading-[1.15] mb-4">
          {title}
        </h2>
        <p className="font-sans-consumer text-xs font-light leading-[1.6]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {body}
        </p>
      </div>
    </section>
  );
}
