import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface Props {
  url: string;
  /** Logo drawn in the centre of the code (brand logo by default). */
  logoUrl?: string | null;
  size?: number;
  /** Base filename for downloads (no extension). */
  filename?: string;
  /** Thumbnail look: gold-on-dark for admin cards, black-on-white otherwise. */
  variant?: 'dark' | 'light';
  showDownload?: boolean;
}

/** Print export resolution (px). 2000px ≈ 17cm at 300dpi. */
const PRINT_SIZE = 2000;

/**
 * qr-code-styling awaits its centre image with no onerror handler, so an image
 * it can't load hangs the draw forever (blank QR). Verify the logo ourselves —
 * load + non-zero size, with a timeout — and only pass it on once it's proven.
 */
function verifyImage(src: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0 && img.naturalHeight > 0); };
    img.onerror = () => { clearTimeout(t); resolve(false); };
    img.src = src;
  });
}

function buildOptions(url: string, logo: string | null | undefined, size: number, dark: boolean) {
  const ink = dark ? '#CAA850' : '#000000';
  return {
    width: size,
    height: size,
    data: url,
    margin: Math.round(size * 0.04),
    // 'H' = 30% error correction — required so the centre logo doesn't break scanning.
    qrOptions: { errorCorrectionLevel: 'H' as const },
    image: logo || undefined,
    imageOptions: { crossOrigin: 'anonymous', margin: Math.round(size * 0.03), imageSize: 0.32, hideBackgroundDots: true },
    dotsOptions: { color: ink, type: 'rounded' as const },
    cornersSquareOptions: { color: ink, type: 'extra-rounded' as const },
    cornersDotOptions: { color: ink },
    backgroundOptions: { color: dark ? '#1B1711' : '#FFFFFF' },
  };
}

export function BrandQrCode({ url, logoUrl, size = 140, filename = 'qr-code', variant = 'light', showDownload = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // The logo URL, but only once we've confirmed the browser can actually load it.
  const [verifiedLogo, setVerifiedLogo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setVerifiedLogo(null);
    if (!logoUrl) return;
    verifyImage(logoUrl).then((ok) => { if (alive) setVerifiedLogo(ok ? logoUrl : null); });
    return () => { alive = false; };
  }, [logoUrl]);

  // Always draw: first without a logo (instant), then again once the logo is verified.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const qr = new QRCodeStyling({ ...buildOptions(url, verifiedLogo, size, variant === 'dark'), type: 'svg' });
      el.innerHTML = '';
      qr.append(el);
    } catch {
      // Last-resort fallback: never leave the slot blank.
      const qr = new QRCodeStyling({ ...buildOptions(url, null, size, variant === 'dark'), type: 'svg' });
      el.innerHTML = '';
      qr.append(el);
    }
  }, [url, verifiedLogo, size, variant]);

  // Print export: a fresh high-res, black-on-white instance so the thumbnail size never limits quality.
  const download = async (ext: 'png' | 'svg') => {
    const logo = verifiedLogo ?? (logoUrl && (await verifyImage(logoUrl)) ? logoUrl : null);
    const make = (withLogo: string | null, type: 'svg' | 'canvas') =>
      new QRCodeStyling({ ...buildOptions(url, withLogo, PRINT_SIZE, false), type });
    try {
      await make(logo, ext === 'svg' ? 'svg' : 'canvas').download({ name: filename, extension: ext });
    } catch {
      // e.g. canvas tainted by a cross-origin logo → export as SVG instead, never fail silently.
      await make(logo, 'svg').download({ name: filename, extension: 'svg' });
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div ref={ref} style={{ width: size, height: size, borderRadius: 6, overflow: 'hidden', lineHeight: 0 }} />
      {showDownload && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['png', 'svg'] as const).map((ext) => (
            <button
              key={ext}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); void download(ext); }}
              title={`Download print-ready ${ext.toUpperCase()}`}
              style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(202,168,80,0.35)', color: '#CAA850', background: 'transparent', cursor: 'pointer' }}
            >
              {ext}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
