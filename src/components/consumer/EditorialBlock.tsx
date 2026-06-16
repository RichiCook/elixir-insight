import { CrosshatchPattern, CLettermark } from './DecorativeSVG';
import { getLocalizedContent } from '@/lib/consumerI18n';
import type { LineEditorial } from '@/hooks/useLineContent';

interface Props {
  line: string;
  bottleColor: string | null;
  editorialImageUrl?: string | null;
  customContent?: Record<string, any>;
  /** Editable per-line copy from the admin "Line Content" page (DB). */
  lineContent?: LineEditorial | null;
  lang?: string;
}

// Final fallback if neither a per-product override nor a DB line row exists.
function getDefault(line: string): { heading: string; accent: string; body: string } {
  if (line === 'No Regrets') {
    return {
      heading: 'Genuinely Healthy', accent: 'Healthy',
      body: 'Every ingredient chosen for what it gives you. Reishi mushroom, aronia, ginger. No alcohol. No regrets.',
    };
  }
  if (line === 'Sparkling') {
    return {
      heading: 'Reinventing the Spritz', accent: 'Spritz',
      body: 'Not your average aperitivo. Natural botanicals, sparkling wine, and a citrus twist — light, lively, genuinely special.',
    };
  }
  return {
    heading: 'The Art of the Aperitivo', accent: 'Aperitivo',
    body: 'A moment of pause, of pleasure, of character. Classy Cocktails brings the Italian aperitivo ritual into every glass — crafted, ready, and unforgettable.',
  };
}

// Render a heading with its accent word in gold italic. The accent is the
// tail of the heading (e.g. "Reinventing the" + gold "Spritz").
function renderTitle(heading: string, accent: string) {
  if (accent && heading.includes(accent)) {
    return (
      <>{heading.slice(0, heading.lastIndexOf(accent))}<em className="italic text-cc-gold">{accent}</em></>
    );
  }
  return <>{heading}{accent && <> <em className="italic text-cc-gold">{accent}</em></>}</>;
}

function darkenHex(hex: string): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.floor(parseInt(h.substring(0, 2), 16) * 0.25));
  const g = Math.max(0, Math.floor(parseInt(h.substring(2, 4), 16) * 0.25));
  const b = Math.max(0, Math.floor(parseInt(h.substring(4, 6), 16) * 0.25));
  return `rgb(${r},${g},${b})`;
}

export function EditorialBlock({ line, bottleColor, editorialImageUrl, customContent, lineContent, lang = 'EN' }: Props) {
  const fallback = getDefault(line);
  const bg = darkenHex(bottleColor || '#2a2a2a');

  // Resolve each field most-specific-first:
  //   per-product override (customContent) → per-line DB row (lineContent) → hardcoded fallback
  const heading =
    getLocalizedContent(customContent, 'heading', lang) || lineContent?.heading || fallback.heading;
  const accent =
    getLocalizedContent(customContent, 'heading_accent', lang) || lineContent?.heading_accent || fallback.accent;
  const body =
    getLocalizedContent(customContent, 'body', lang) || lineContent?.body || fallback.body;
  const lineLabel =
    getLocalizedContent(customContent, 'line_label', lang) || lineContent?.line_label || `${line} Line`;

  const title = renderTitle(heading, accent || '');

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
