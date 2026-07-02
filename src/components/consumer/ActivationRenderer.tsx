import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { type Activation, useSubmitActivationLead } from '@/hooks/useActivations';
import { ClassyWordmark } from '@/components/consumer/ClassyWordmark';

interface Props {
  activations: Activation[];
  placement: string;
  productSlug: string;
  brandName?: string;
}

export function ActivationSlot({ activations, placement, productSlug, brandName = 'Classy Cocktails' }: Props) {
  const filtered = activations
    .filter((a) => a.placement === placement)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (!filtered.length) return null;

  return (
    <div className="space-y-0">
      {filtered.map((a) => (
        <ActivationCard key={a.id} activation={a} productSlug={productSlug} brandName={brandName} />
      ))}
    </div>
  );
}

function safeUrl(url: unknown): string | undefined {
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : undefined;
}

/** Render a single activation outside the product-page slot system (e.g. a catalogue page). */
export function ActivationEmbed({ activation, productSlug, brandName }: { activation: Activation; productSlug: string; brandName?: string }) {
  return <ActivationCard activation={activation} productSlug={productSlug} brandName={brandName} />;
}

function ActivationCard({ activation, productSlug, brandName }: { activation: Activation; productSlug: string; brandName?: string }) {
  const { activation_type, content } = activation;

  switch (activation_type) {
    case 'text_image':
      return <TextImageActivation content={content} />;
    case 'video':
      return <VideoActivation content={content} />;
    case 'banner_cta':
      return <BannerCtaActivation content={content} />;
    case 'custom_html':
      return <CustomHtmlActivation content={content} />;
    case 'lead_capture':
      return <LeadCaptureActivation activation={activation} productSlug={productSlug} brandName={brandName} />;
    case 'lead_capture_rating':
      return <LeadCaptureRatingActivation activation={activation} productSlug={productSlug} brandName={brandName} />;
    default:
      return null;
  }
}

// -- Text/Image --
function TextImageActivation({ content }: { content: Record<string, any> }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-5 py-6"
    >
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: content.bg_color || '#1a1a1a' }}>
        {content.image_url && (
          <img src={content.image_url} alt={content.headline || ''} className="w-full object-cover" style={{ maxHeight: 240 }} loading="lazy" />
        )}
        <div className="p-5">
          {content.headline && (
            <h3 className="font-display text-xl text-white mb-2">{content.headline}</h3>
          )}
          {content.body && (
            <p className="font-sans-consumer text-sm text-white/70 leading-relaxed">{content.body}</p>
          )}
          {content.cta_text && safeUrl(content.cta_url) && (
            <a
              href={safeUrl(content.cta_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase"
              style={{ backgroundColor: '#b8975a', color: '#fff' }}
            >
              {content.cta_text}
            </a>
          )}
        </div>
      </div>
    </motion.section>
  );
}

// -- Video --
function VideoActivation({ content }: { content: Record<string, any> }) {
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = typeof content.video_url === 'string' ? content.video_url.trim() : '';
  const autoplay = !!content.autoplay;

  // React's `muted` attribute is unreliable on <video>, so the browser sees an
  // unmuted element and blocks muted-autoplay (esp. iOS). Force the muted
  // *property* on the DOM node and kick off playback once it can start.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !autoplay) return;
    v.muted = true;
    const tryPlay = () => v.play().then(() => setStarted(true)).catch(() => {});
    tryPlay();
    v.addEventListener('canplay', tryPlay, { once: true });
    return () => v.removeEventListener('canplay', tryPlay);
  }, [autoplay, url]);

  if (!/^https?:\/\//i.test(url)) return null;

  // Play-button label: undefined = never configured → legacy default;
  // empty string = explicitly cleared → icon-only button; otherwise the text.
  const playLabel =
    content.play_label === undefined || content.play_label === null
      ? 'Ascolta la storia del drink'
      : String(content.play_label).trim();
  const hasLabel = playLabel.length > 0;

  // YouTube / Vimeo → iframe embed. Anything else (e.g. an uploaded .mp4 in the
  // brand-videos bucket) → native <video> player.
  let embedUrl: string | null = null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}${content.autoplay ? '?autoplay=1&mute=1' : ''}`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}${content.autoplay ? '?autoplay=1&muted=1' : ''}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-6"
    >
      {embedUrl ? (
        // YouTube / Vimeo embed — iframes have no intrinsic size, so use a 16:9 box.
        <div className="overflow-hidden bg-black">
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={content.caption || 'Video'}
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
        </div>
      ) : (
        // Uploaded file — let the player take the clip's own orientation so there
        // are no letterbox bands: landscape fills the width, portrait hugs the video.
        <div className="w-full overflow-hidden bg-black">
          <div className="relative">
            <video
              ref={videoRef}
              src={url}
              onPlay={() => setStarted(true)}
              className="block w-full h-auto"
              controls={started}
              playsInline
              preload={autoplay ? 'auto' : 'metadata'}
              poster={typeof content.poster_url === 'string' ? content.poster_url : undefined}
              autoPlay={autoplay}
              muted={autoplay}
              loop={!!content.loop}
            />
            {!started && (
              <button
                type="button"
                aria-label={hasLabel ? playLabel : 'Play'}
                onClick={() => {
                  const v = videoRef.current;
                  if (v) { v.muted = false; void v.play(); }
                }}
                className="group absolute inset-0 flex items-center justify-center"
              >
                {/* subtle darkening so the button reads on any frame */}
                <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/20" />
                <span className={`relative flex items-center rounded-full border border-white/40 bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 group-hover:scale-[1.03] group-hover:bg-white/20 ${hasLabel ? 'gap-3 px-6 py-3.5' : 'p-4'}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 translate-x-[1px] fill-white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  {hasLabel && (
                    <span className="font-sans-consumer text-[13px] font-medium tracking-[0.06em]">{playLabel}</span>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

// -- Banner CTA --
function BannerCtaActivation({ content }: { content: Record<string, any> }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-5 py-4"
    >
      <a
        href={safeUrl(content.cta_url) || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl p-5 text-center transition-transform hover:scale-[1.01]"
        style={{ backgroundColor: content.bg_color || '#b8975a', color: content.text_color || '#fff' }}
      >
        <p className="font-display text-lg mb-2">{content.text}</p>
        {content.cta_text && (
          <span className="inline-block px-5 py-2 rounded-full border text-xs font-medium tracking-wider uppercase" style={{ borderColor: content.text_color || '#fff' }}>
            {content.cta_text}
          </span>
        )}
      </a>
    </motion.section>
  );
}

// -- Custom HTML --
function CustomHtmlActivation({ content }: { content: Record<string, any> }) {
  if (!content.html) return null;
  // Admin-authored HTML — sanitize before rendering (no script-capable iframe).
  return (
    <section
      className="px-5 py-4"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.html) }}
    />
  );
}

// -- Co-brand lockup: Classy mark + an optional partner (logo image or wordmark) --
function CoBrandLockup({ content, accent, text }: { content: Record<string, any>; accent: string; text: string }) {
  const partnerLogo = safeUrl(content.partner_logo_url);
  const partnerName = typeof content.partner_name === 'string' ? content.partner_name.trim() : '';
  const showClassy = content.show_classy !== false;
  if (!partnerLogo && !partnerName && !showClassy) return null;

  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      {showClassy && <ClassyWordmark color={text} height={26} />}
      {(partnerLogo || partnerName) && showClassy && (
        <span className="text-xs leading-none" style={{ color: accent }}>✕</span>
      )}
      {partnerLogo ? (
        <img src={partnerLogo} alt={partnerName || 'Partner'} className="h-6 w-auto max-w-[160px] object-contain" />
      ) : partnerName ? (
        <span className="font-display tracking-[0.14em] text-base leading-none text-center" style={{ color: text }}>
          {partnerName}
        </span>
      ) : null}
    </div>
  );
}

// -- Lead Capture (optionally co-branded, with reward reveal) --
function LeadCaptureActivation({ activation, productSlug, brandName = 'Classy Cocktails' }: { activation: Activation; productSlug: string; brandName?: string }) {
  const { content } = activation;
  const submitLead = useSubmitActivationLead();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [consented, setConsented] = useState(false);
  const [copied, setCopied] = useState(false);
  const fields = content.fields || ['name', 'email'];

  // Theme — defaults preserve the original cream look for existing activations.
  const bg = typeof content.bg_color === 'string' ? content.bg_color : '#f5f0ea';
  const accent = typeof content.accent_color === 'string' ? content.accent_color : '#b8975a';
  const text = typeof content.text_color === 'string' ? content.text_color : '#2a2a2a';
  const textMuted = typeof content.text_muted === 'string' ? content.text_muted : '#9a9a9a';
  const cardBorder = typeof content.border_color === 'string' ? content.border_color : 'rgba(0,0,0,0.08)';

  const rewardUrl = safeUrl(content.reward_url);
  const redirectOnSubmit = content.redirect_to_link === true && !!rewardUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consented) return;
    const sessionId = sessionStorage.getItem('cc_session') || '';
    const payload = {
      activation_id: activation.id,
      product_slug: productSlug,
      session_id: sessionId,
      name: form.name,
      email: form.email,
      phone: form.phone,
    };
    // "Go straight to the link": capture the lead, then send them to the offer.
    if (redirectOnSubmit) {
      try { await submitLead.mutateAsync(payload); } catch { /* still send them through */ }
      window.location.href = rewardUrl!;
      return;
    }
    submitLead.mutate(payload);
    setSubmitted(true);
  };

  const inputStyle = { borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' } as const;

  // Tap the revealed code to copy the full discount link.
  const copyTarget = rewardUrl || activation.reward_code || '';
  const handleCopy = async () => {
    if (!copyTarget) return;
    try {
      await navigator.clipboard.writeText(copyTarget);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = copyTarget;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-5 py-6"
    >
      <div className="rounded-xl p-6" style={{ backgroundColor: bg, border: `1px solid ${cardBorder}` }}>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
              <CoBrandLockup content={content} accent={accent} text={text} />
              <p className="font-display text-2xl" style={{ color: accent }}>✓</p>
              <p className="font-sans-consumer text-sm mt-2" style={{ color: text }}>
                {content.success_message || 'Thank you!'}
              </p>

              {/* Reward reveal — code in a ticket, optional claim link */}
              {activation.reward_code && (
                <div className="mt-5">
                  <p className="font-sans-consumer text-[10px] uppercase tracking-[0.2em]" style={{ color: textMuted }}>
                    {content.reward_label || 'Your code'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={`Copy discount link for code ${activation.reward_code}`}
                    className="mt-2 mx-auto inline-flex items-center gap-2.5 rounded-lg px-6 py-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
                    style={{ border: `2px dashed ${accent}`, background: 'transparent' }}
                  >
                    <span className="font-mono text-2xl font-bold tracking-[0.18em]" style={{ color: accent }}>
                      {activation.reward_code}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  {copyTarget && (
                    <p className="font-sans-consumer text-[10px] mt-2 transition-colors" style={{ color: copied ? accent : textMuted }}>
                      {copied ? '✓ Link copied' : 'Tap the code to copy the link'}
                    </p>
                  )}
                  {rewardUrl && (
                    <a
                      href={rewardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-4 w-full py-3 rounded-full text-xs font-medium tracking-wider uppercase"
                      style={{ backgroundColor: accent, color: '#fff' }}
                    >
                      {content.reward_cta || 'Claim your discount'}
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-3">
              <CoBrandLockup content={content} accent={accent} text={text} />
              {content.kicker && (
                <p className="font-sans-consumer text-[10px] uppercase tracking-[0.24em] text-center" style={{ color: accent }}>
                  {content.kicker}
                </p>
              )}
              {content.title && (
                <h3 className="font-display text-xl text-center leading-tight" style={{ color: text }}>{content.title}</h3>
              )}
              {content.description && (
                <p className="font-sans-consumer text-xs text-center leading-relaxed" style={{ color: textMuted }}>{content.description}</p>
              )}
              {fields.includes('name') && (
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-base border"
                  style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }}
                />
              )}
              {fields.includes('email') && (
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email || ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-base border"
                  style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }}
                />
              )}
              {fields.includes('phone') && (
                <input
                  type="tel"
                  placeholder="Phone"
                  value={form.phone || ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-base border"
                  style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }}
                />
              )}
              {/* GDPR consent — required before submit */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  required
                  className="mt-0.5 shrink-0"
                />
                <span className="font-sans-consumer text-[10px] leading-relaxed" style={{ color: textMuted }}>
                  I agree to {brandName} processing my data for this promotion.{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: accent }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              <button
                type="submit"
                disabled={!consented}
                className="w-full py-2.5 rounded-full text-xs font-medium tracking-wider uppercase disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#fff' }}
              >
                {content.submit_text || 'Submit'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

// -- Lead Capture with Rating --
function LeadCaptureRatingActivation({ activation, productSlug, brandName = 'Classy Cocktails' }: { activation: Activation; productSlug: string; brandName?: string }) {
  const { content } = activation;
  const submitLead = useSubmitActivationLead();
  const [step, setStep] = useState<'rating' | 'form' | 'done'>('rating');
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [consented, setConsented] = useState(false);
  const maxRating = content.max_rating || 5;
  const fields = content.fields || ['name', 'email'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consented) return; // M-5: guard against programmatic bypass of required checkbox
    const sessionId = sessionStorage.getItem('cc_session') || '';
    submitLead.mutate({
      activation_id: activation.id,
      product_slug: productSlug,
      session_id: sessionId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      rating,
    });
    setStep('done');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-5 py-6"
    >
      <div className="rounded-xl p-6" style={{ backgroundColor: '#f5f0ea', border: '1px solid #e5e0d8' }}>
        <AnimatePresence mode="wait">
          {step === 'rating' && (
            <motion.div key="rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
              <p className="font-display text-lg" style={{ color: '#2a2a2a' }}>
                {content.rating_question || 'How would you rate this product?'}
              </p>
              <div className="flex justify-center gap-2">
                {Array.from({ length: maxRating }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className="text-2xl transition-transform hover:scale-125"
                    style={{ color: i < rating ? '#b8975a' : '#e5e0d8' }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <button
                onClick={() => rating > 0 && setStep('form')}
                disabled={rating === 0}
                className="px-6 py-2 rounded-full text-xs font-medium tracking-wider uppercase disabled:opacity-40"
                style={{ backgroundColor: '#b8975a', color: '#fff' }}
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-3">
              {content.form_title && <h3 className="font-display text-lg" style={{ color: '#2a2a2a' }}>{content.form_title}</h3>}
              {fields.includes('name') && (
                <input type="text" placeholder="Name" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-2.5 rounded-lg text-base border" style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }} />
              )}
              {fields.includes('email') && (
                <input type="email" placeholder="Email" value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="w-full px-4 py-2.5 rounded-lg text-base border" style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }} />
              )}
              {fields.includes('phone') && (
                <input type="tel" placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg text-base border" style={{ borderColor: '#e5e0d8', backgroundColor: '#fff', color: '#2a2a2a' }} />
              )}
              {/* GDPR consent — required before submit */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  required
                  className="mt-0.5 shrink-0"
                />
                <span className="font-sans-consumer text-[10px] leading-relaxed" style={{ color: '#9a9a9a' }}>
                  I agree to {brandName} processing my data for this promotion.{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#b8975a' }}>Privacy Policy</a>
                </span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('rating')} className="flex-1 py-2.5 rounded-full text-xs border" style={{ borderColor: '#e5e0d8', color: '#9a9a9a' }}>Back</button>
                <button type="submit" disabled={!consented} className="flex-1 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase disabled:opacity-40" style={{ backgroundColor: '#b8975a', color: '#fff' }}>
                  {content.submit_text || 'Submit'}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
              <p className="font-display text-xl" style={{ color: '#4a8c5c' }}>✓</p>
              <p className="font-sans-consumer text-sm mt-2" style={{ color: '#5a5a5a' }}>
                {content.success_message || 'Thank you!'}
              </p>
              <RewardReveal code={activation.reward_code} url={content.reward_url} codeLabel={content.reward_label} buttonText={content.reward_button_text} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
