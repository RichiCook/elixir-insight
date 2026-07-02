import { ClassyLogo } from './ClassyLogo';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/**
 * Official "Classy Cocktails" heading lockup. Use this anywhere the brand name
 * is shown as a heading / co-brand tag / footer mark.
 *
 * Source of the artwork (first match wins):
 *   1. `imageUrl` prop (per-instance override)
 *   2. site_settings.brand_logo_url        (uploaded in Site Settings → Brand Assets)
 *   3. text fallback: the U mark + CLASSY / COCKTAILS, tinted to `color`
 *
 * On dark surfaces pass `onDark`: a dedicated light logo (brand_logo_light_url)
 * is used if uploaded, otherwise the standard (monochrome) logo is inverted to
 * white via a CSS filter.
 */

interface Props {
  color?: string;
  height?: number;        // overall lockup height in px
  showCocktails?: boolean;
  imageUrl?: string;      // per-instance override
  onDark?: boolean;       // surface is dark → prefer light logo / invert
  className?: string;
}

// Rough perceived-luminance test so a light `color` (foreground on a dark
// surface) auto-implies the wordmark sits on a dark background.
function isLightColor(c: string): boolean {
  const m = c.replace('#', '');
  const hex = m.length === 3 ? m.split('').map((x) => x + x).join('') : m.slice(0, 6);
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function ClassyWordmark({ color = '#1a1a1a', height = 28, showCocktails = true, imageUrl, onDark, className }: Props) {
  const { data: settings } = useSiteSettings();
  const darkLogo = imageUrl || settings?.brand_logo_url || '';
  const lightLogo = settings?.brand_logo_light_url || '';
  const dark = onDark ?? isLightColor(color);

  let src = '';
  let invert = false;
  if (dark) {
    if (lightLogo) src = lightLogo;
    else if (darkLogo) { src = darkLogo; invert = true; }
  } else {
    src = darkLogo;
  }

  if (src) {
    return (
      <img
        src={src}
        alt="Classy Cocktails"
        className={className}
        style={{ height, width: 'auto', objectFit: 'contain', display: 'inline-block', filter: invert ? 'brightness(0) invert(1)' : undefined }}
      />
    );
  }

  // Text fallback (no logo uploaded yet).
  const mark = Math.round(height * 0.92);
  const classySize = Math.max(13, Math.round(height * 0.58));
  const cocktailsSize = Math.max(8, Math.round(height * 0.245));
  const sans = "'Libre Franklin', system-ui, -apple-system, sans-serif";

  return (
    <span
      className={className}
      aria-label="Classy Cocktails"
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.26) }}
    >
      <ClassyLogo size={mark} color={color} />
      <span style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
        <span style={{ fontFamily: sans, fontWeight: 800, fontSize: classySize, letterSpacing: '0.015em', color }}>CLASSY</span>
        {showCocktails && (
          <span style={{ fontFamily: sans, fontWeight: 600, fontSize: cocktailsSize, letterSpacing: '0.3em', color, marginTop: Math.round(height * 0.07) }}>
            COCKTAILS
          </span>
        )}
      </span>
    </span>
  );
}
