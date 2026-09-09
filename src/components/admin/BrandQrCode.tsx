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

/** Fetch an image and return it as a data URL so the QR library embeds it
 *  reliably (avoids cross-origin canvas taint and image-load timing issues). */
async function toDataUrl(src: string): Promise<string | null> {
  try {
    const blob = await fetch(src, { mode: 'cors' }).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)));
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  const [logoData, setLogoData] = useState<string | null>(null);

  // Resolve the logo to a data URL once per logoUrl.
  useEffect(() => {
    let alive = true;
    setLogoData(null);
    if (!logoUrl) return;
    toDataUrl(logoUrl).then((d) => { if (alive) setLogoData(d); });
    return () => { alive = false; };
  }, [logoUrl]);

  useEffect(() => {
    if (!ref.current) return;
    const qr = new QRCodeStyling({ ...buildOptions(url, logoData, size, variant === 'dark'), type: 'svg' });
    ref.current.innerHTML = '';
    qr.append(ref.current);
  }, [url, logoData, size, variant]);

  // Print export: a fresh high-res, black-on-white instance so the thumbnail size never limits quality.
  const download = async (ext: 'png' | 'svg') => {
    // Make sure the logo is embedded even if the user clicks before it resolved.
    const logo = logoData ?? (logoUrl ? await toDataUrl(logoUrl) : null);
    const qr = new QRCodeStyling({ ...buildOptions(url, logo, PRINT_SIZE, false), type: ext === 'svg' ? 'svg' : 'canvas' });
    await qr.download({ name: filename, extension: ext });
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
