import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  blockType: string;
  blockConfig: Record<string, any>;
  customContent: Record<string, any>;
}

export function CustomBlock({ blockType, blockConfig, customContent }: Props) {
  const merged = { ...blockConfig, ...customContent };

  switch (blockType) {
    case 'text':
      return (
        <section className="px-[18px] py-6">
          {merged.heading && (
            <h3 className="font-display text-lg text-cc-text-dk mb-2">{merged.heading}</h3>
          )}
          {merged.body && (
            <p className="font-sans-consumer text-[13px] text-cc-text-md leading-relaxed whitespace-pre-line">
              {merged.body}
            </p>
          )}
        </section>
      );

    case 'image_text':
      return (
        <section className="py-6">
          {merged.image_url && (
            <img
              src={merged.image_url}
              alt={merged.heading || ''}
              className="w-full object-cover"
              style={{ maxHeight: '280px' }}
              loading="lazy"
            />
          )}
          <div className="px-[18px] mt-4">
            {merged.heading && (
              <h3 className="font-display text-lg text-cc-text-dk mb-2">{merged.heading}</h3>
            )}
            {merged.body && (
              <p className="font-sans-consumer text-[13px] text-cc-text-md leading-relaxed whitespace-pre-line">
                {merged.body}
              </p>
            )}
          </div>
        </section>
      );

    case 'image_carousel':
      return <ImageCarousel merged={merged} />;

    case 'cta': {
      const style = merged.style || 'dark';
      const bgClass = style === 'gold' ? 'bg-cc-gold text-white' : style === 'outline' ? 'border border-cc-text-dk text-cc-text-dk' : 'bg-[#0a0a0a] text-white';
      return (
        <section className="px-[18px] py-4">
          <a
            href={merged.button_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full text-center font-sans-consumer text-[13px] font-medium tracking-[0.08em] rounded py-[17px] ${bgClass}`}
          >
            {merged.button_text || 'Click Here'}
          </a>
        </section>
      );
    }

    case 'video': {
      const url = merged.video_url || '';
      let embedUrl = url;
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      const vmMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vmMatch) embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}`;

      return (
        <section className="py-4">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Video"
            />
          </div>
        </section>
      );
    }

    case 'spacer':
      return <div style={{ height: `${merged.height || 32}px` }} />;

    case 'custom_html':
      return (
        <section
          className="px-[18px] py-4"
          dangerouslySetInnerHTML={{ __html: merged.html || '' }}
        />
      );

    default:
      return null;
  }
}

/* ── Image Carousel sub-component ── */
function ImageCarousel({ merged }: { merged: Record<string, any> }) {
  const images: string[] = merged.images || [];
  const autoplaySeconds = parseInt(merged.autoplay || '0', 10);
  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (autoplaySeconds > 0 && images.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % images.length);
      }, autoplaySeconds * 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [autoplaySeconds, images.length]);

  if (!images.length) return null;

  return (
    <section className="py-4">
      {merged.heading && (
        <h3 className="font-display text-lg text-cc-text-dk mb-3 px-[18px]">{merged.heading}</h3>
      )}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Slide ${i + 1}`}
              className="w-full shrink-0 object-cover"
              style={{ maxHeight: '320px' }}
              loading="lazy"
            />
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo((current - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={() => goTo((current + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
              aria-label="Next"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === current ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
