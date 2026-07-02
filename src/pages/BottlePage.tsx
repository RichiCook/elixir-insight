import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { useBottlePageData } from '@/hooks/useBottlePageData';
import { useLineEditorials, pickLineEditorial } from '@/hooks/useLineContent';
import { usePageViewTracking, useSectionTracking, trackInteraction, hasTrackingConsent, getSessionId } from '@/hooks/useTracking';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultLayoutSections, getMergedSections } from '@/hooks/useSectionConfig';
import { useProductTechnicalData } from '@/hooks/useProduct';
import { CookieBanner } from '@/components/consumer/CookieBanner';
import { BottleHero } from '@/components/consumer/BottleHero';
import { GenuineCard } from '@/components/consumer/GenuineCard';
import { AbvDisplay } from '@/components/consumer/AbvDisplay';
import { ClassyLogo } from '@/components/consumer/ClassyLogo';
import { BottleQuickFacts } from '@/components/consumer/BottleQuickFacts';
import { BottleSensory } from '@/components/consumer/BottleSensory';
import { BottleComposition } from '@/components/consumer/BottleComposition';
import { BottleServeMoments } from '@/components/consumer/BottleServeMoments';
import { BottlePairings } from '@/components/consumer/BottlePairings';
import { BottleIngredients } from '@/components/consumer/BottleIngredients';
import { BottleNutrition } from '@/components/consumer/BottleNutrition';
import { BottleFooter } from '@/components/consumer/BottleFooter';
import { CraftedWith } from '@/components/consumer/CraftedWith';
import { EditorialBlock } from '@/components/consumer/EditorialBlock';
import { BrandHeritage } from '@/components/consumer/BrandHeritage';
import { StoreCTA } from '@/components/consumer/StoreCTA';
import { CustomBlock } from '@/components/consumer/CustomBlock';
import { AgeGate } from '@/components/consumer/AgeGate';
import { ActivationSlot } from '@/components/consumer/ActivationRenderer';
import { useApplySiteSettings } from '@/hooks/useSiteSettings';
import { useSlugRedirect } from '@/hooks/useSlugRedirect';
import { useCocktailType } from '@/hooks/useCocktailType';

// Map section keys to activation placement names
const ACTIVATION_AFTER: Record<string, string> = {
  hero: 'after_hero',
  quick_facts: 'after_serve',
  sensory: 'after_sensory',
  composition: 'after_composition',
  serve_moments: 'after_moments',
  pairings: 'after_pairings',
  ingredients: 'after_ingredients',
  nutrition: 'after_nutrition',
  editorial: 'after_editorial',
};

export default function BottlePage() {
  const { brandSlug, productSlug } = useParams<{ brandSlug: string; productSlug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const initialLang = searchParams.get('lang') || 'EN';
  const [lang, setLang] = useState<string>(initialLang);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; alt: string } | null>(null);

  // Single RPC — replaces 10 sequential hooks
  const { data: pageData, isLoading } = useBottlePageData(brandSlug, productSlug, lang);
  const product       = pageData?.product ?? null;
  const brand         = pageData?.brand ?? null;
  const translation   = pageData?.translation ?? null;
  const composition   = pageData?.composition ?? [];
  const serveMoments  = pageData?.serve_moments ?? [];
  const pairings      = pageData?.pairings ?? [];
  const productImages = pageData?.images ?? [];
  const activeActivations = pageData?.activations ?? [];
  const savedSections = pageData?.sections ?? [];
  const collab        = pageData?.collaboration ?? null;
  const availableLangs = pageData?.available_languages ?? ['EN'];

  // If the slug 404s, it may be a retired slug from a rename — resolve it so old
  // QR codes / links redirect to the product's current slug.
  const productMissing = !isLoading && !product;
  const { data: redirectSlug, isLoading: resolvingRedirect } = useSlugRedirect(productSlug, productMissing);

  // Signature collab cocktails get a "Explore Classy Cocktails" CTA instead of a per-product store link.
  const { data: cocktailType } = useCocktailType(collab?.id, product?.id, !!collab && !!product);
  const isSignatureCocktail = cocktailType === 'signature';

  // Technical/nutritional data still fetched separately (admin-only columns
  // are gated by a dedicated RPC — get_product_nutrition — already called
  // inside get_bottle_page_data; useProductTechnicalData is kept for the
  // nutrition component which expects its specific shape from the RPC).
  const { data: technicalData } = useProductTechnicalData(product?.id);

  const { data: defaultSections } = useDefaultLayoutSections();
  const { data: lineEditorials } = useLineEditorials();

  // Apply global site settings (favicon + tab title)
  useApplySiteSettings();

  // Tracking (use productSlug as the tracking key)
  usePageViewTracking(productSlug);
  const { observeSection } = useSectionTracking(productSlug);

  // Record scan in scan_events.
  // QR scans recorded under legitimate interest (core product function, no consent needed).
  // Direct web visits only recorded after marketing consent.
  const isQrScan = searchParams.get('source') === 'qr';
  useEffect(() => {
    if (!product?.id || !product?.slug) return;
    if (isPreview) return; // admin live-preview must never count as a scan

    const consented = isQrScan || hasTrackingConsent();

    // Always record the visit for aggregate counts (legitimate interest).
    // Personal identifiers (session_id, user_agent) are only stored with consent.
    const payload = {
      product_slug: product.slug,
      brand_slug:   brandSlug ?? null,
      source:       isQrScan ? 'qr' : 'direct',
      language:     lang,
      ...(consented && {
        session_id: getSessionId(),
        user_agent: navigator.userAgent.slice(0, 255),
      }),
    };

    supabase
      .from('scan_events')
      .insert(payload as any)
      .then(({ error }) => {
        if (error) console.error('[scan_events] insert failed:', error.message, error.details, payload);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const heroRef = useCallback((el: HTMLElement | null) => observeSection(el, 'hero'), [observeSection]);
  const serveRef = useCallback((el: HTMLElement | null) => observeSection(el, 'how_to_serve'), [observeSection]);
  const sensoryRef = useCallback((el: HTMLElement | null) => observeSection(el, 'sensory'), [observeSection]);
  const compositionRef = useCallback((el: HTMLElement | null) => observeSection(el, 'composition'), [observeSection]);
  const momentsRef = useCallback((el: HTMLElement | null) => observeSection(el, 'moments'), [observeSection]);
  const pairingsRef = useCallback((el: HTMLElement | null) => observeSection(el, 'pairings'), [observeSection]);
  const ingredientsRef = useCallback((el: HTMLElement | null) => observeSection(el, 'ingredients'), [observeSection]);
  const nutritionRef = useCallback((el: HTMLElement | null) => observeSection(el, 'nutritional_passport'), [observeSection]);
  const editorialRef = useCallback((el: HTMLElement | null) => observeSection(el, 'editorial'), [observeSection]);
  const heritageRef = useCallback((el: HTMLElement | null) => observeSection(el, 'heritage'), [observeSection]);

  // Image helpers
  const getApprovedBySection = (section: string) => {
    if (!productImages) return [];
    return productImages.filter((pi: any) => {
      if (pi.section !== section) return false;
      const attrs = pi.brand_images?.image_attributes;
      if (Array.isArray(attrs)) return attrs.some((a: any) => a.is_approved);
      return attrs?.is_approved;
    });
  };

  const heroImages = getApprovedBySection('hero');
  const editorialImages = getApprovedBySection('editorial');
  const serveMomentImagesRaw = getApprovedBySection('serve_moment');
  const galleryImages = getApprovedBySection('gallery');

  const heroImageUrl = heroImages[0]?.brand_images?.public_url || null;
  const editorialImageUrl = editorialImages[0]?.brand_images?.public_url || null;
  // Fallback "product picture" for image-backed blocks that have no image of
  // their own — prefer the hero shot, else any available product image.
  const productImageUrl =
    heroImageUrl ||
    (productImages as any[]).find((pi) => pi?.brand_images?.public_url)?.brand_images?.public_url ||
    null;

  const serveMomentImageMap: Record<number, string> = {};
  serveMomentImagesRaw.forEach((pi: any, idx: number) => {
    serveMomentImageMap[idx] = pi.brand_images?.public_url;
  });

  // Interaction handlers
  const handleLangSwitch = (newLang: string) => {
    if (productSlug && newLang !== lang) trackInteraction(productSlug, 'language_switch', 'click', { from: lang, to: newLang });
    setLang(newLang);
  };
  const handleCtaClick = () => { if (productSlug) trackInteraction(productSlug, 'cta_click', 'click'); };
  const handleIngredientExpand = () => { if (productSlug) trackInteraction(productSlug, 'ingredients', 'expand'); };
  const handleNutritionExpand = () => { if (productSlug) trackInteraction(productSlug, 'nutritional_passport', 'expand'); };

  if (isLoading) {
    return (
      <div className="consumer-theme min-h-screen bg-cc-cream flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    // Still checking whether this is a retired slug.
    if (resolvingRedirect) {
      return (
        <div className="consumer-theme min-h-screen bg-cc-cream flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    // Retired slug → redirect to the current one, preserving query params (e.g. ?source=qr).
    if (redirectSlug && redirectSlug !== productSlug) {
      const qs = searchParams.toString();
      return <Navigate to={`/b/${brandSlug}/${redirectSlug}${qs ? `?${qs}` : ''}`} replace />;
    }
    return (
      <div className="consumer-theme min-h-screen bg-cc-white flex items-center justify-center">
        <p className="font-sans-consumer text-cc-text-md">Product not found</p>
      </div>
    );
  }

  const showAgeGate = parseFloat(product.abv ?? '0') > 0 && !isPreview;
  const sections = getMergedSections(savedSections, defaultSections);

  // Built-in blocks inherit the Default Layout's content for any field a product
  // hasn't overridden. Products with their own saved layout (e.g. Cosmopolitan)
  // otherwise keep empty content and miss default-layout edits like the heritage
  // image/heading/body. Editor stays unaffected (this is render-only).
  const defaultContentByKey = new Map(
    (defaultSections ?? []).map((d: any) => [d.section_key, (d.custom_content || {}) as Record<string, any>]),
  );
  const effectiveContent = (sec: { section_key: string; block_type: string; custom_content: Record<string, any> }) =>
    sec.block_type === 'built_in'
      ? { ...(defaultContentByKey.get(sec.section_key) || {}), ...(sec.custom_content || {}) }
      : sec.custom_content;

  // Render a section by key, using custom_content overrides
  const renderSection = (key: string, content: Record<string, any>, blockType?: string, blockConfig?: Record<string, any>) => {
    // Custom blocks
    if (blockType && blockType !== 'built_in') {
      return <CustomBlock blockType={blockType} blockConfig={blockConfig || {}} customContent={content} />;
    }

    switch (key) {
      case 'hero':
        return (
          <div ref={heroRef}>
            <BottleHero product={product} heroImageUrl={heroImageUrl} collab={collab} />
          </div>
        );
      case 'genuine_card':
        return <GenuineCard product={product} />;
      case 'abv_display':
        // ABV/EAN/Serving now rendered inside GenuineCard for a tighter layout
        return null;
      case 'quick_facts':
        return (
          <div ref={serveRef}>
            <BottleQuickFacts product={product} lang={lang} />
          </div>
        );
      case 'crafted_with':
        return product.spirit ? <CraftedWith spirit={product.spirit} /> : null;
      case 'sensory':
        return translation?.sensory_description ? (
          <div ref={sensoryRef}>
            <BottleSensory description={translation.sensory_description} />
          </div>
        ) : null;
      case 'composition':
        return composition && composition.length > 0 ? (
          <div ref={compositionRef}>
            <BottleComposition composition={composition} lang={lang} />
          </div>
        ) : null;
      case 'serve_moments':
        return serveMoments && serveMoments.length > 0 ? (
          <div ref={momentsRef}>
            <BottleServeMoments moments={serveMoments} line={product.line} lang={lang} serveMomentImages={serveMomentImageMap} />
          </div>
        ) : null;
      case 'pairings':
        return pairings && pairings.length > 0 ? (
          <div ref={pairingsRef}>
            <BottlePairings pairings={pairings} lang={lang} />
          </div>
        ) : null;
      case 'ingredients':
        return translation ? (
          <div ref={ingredientsRef}>
            <BottleIngredients translation={translation} allergensSummary={product.allergens_summary} onExpand={handleIngredientExpand} lang={lang} />
          </div>
        ) : null;
      case 'nutrition':
        return (
          <div ref={nutritionRef}>
            <BottleNutrition data={technicalData ?? null} allergensSummary={product.allergens_summary} onExpand={handleNutritionExpand} />
          </div>
        );
      case 'store_cta':
        return (
          <StoreCTA
            slug={product.slug}
            productLink={product.product_link}
            brandWebsiteUrl={brand?.website_url}
            onCtaClick={handleCtaClick}
            customContent={content}
            lang={lang}
            isSignature={isSignatureCocktail}
          />
        );
      case 'editorial':
        return (
          <div ref={editorialRef}>
            <EditorialBlock
              line={product.line}
              bottleColor={product.bottle_color}
              editorialImageUrl={editorialImageUrl || productImageUrl}
              customContent={content}
              lineContent={pickLineEditorial(lineEditorials, product.line, lang)}
              lang={lang}
            />
          </div>
        );
      case 'gallery':
        return galleryImages.length >= 3 ? (
          <section className="py-6">
            <div
              className="flex gap-2 overflow-x-auto px-0 pb-2 gallery-scroll"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            >
              <style>{`.gallery-scroll::-webkit-scrollbar { display: none; }`}</style>
              {galleryImages.map((pi: any) => {
                const attrs = pi.brand_images?.image_attributes;
                const altText = Array.isArray(attrs) ? (lang === 'IT' ? attrs[0]?.alt_text_it : attrs[0]?.alt_text_en) : (lang === 'IT' ? attrs?.alt_text_it : attrs?.alt_text_en);
                return (
                  <button
                    key={pi.id}
                    className="flex-shrink-0 overflow-hidden"
                    style={{ width: '75%', scrollSnapAlign: 'start' }}
                    onClick={() => setFullscreenImage({ url: pi.brand_images?.public_url, alt: altText || '' })}
                  >
                    <img src={pi.brand_images?.public_url} alt={altText || ''} className="w-full object-cover" style={{ aspectRatio: '4/3' }} loading="lazy" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null;
      case 'brand_heritage':
        return (
          <div ref={heritageRef}>
            <BrandHeritage lang={lang} customContent={content} fallbackImageUrl={productImageUrl} />
          </div>
        );
      case 'footer':
        return (
          <BottleFooter
            product={product}
            customContent={content}
            collab={collab}
            brandName={brand?.name}
            brandWebsiteUrl={brand?.website_url ?? undefined}
            lang={lang}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="consumer-theme min-h-screen" style={{ backgroundColor: '#e8e4dc' }}>
      {showAgeGate && (
        <AgeGate
          brandName={brand?.name}
          brandWebsiteUrl={brand?.website_url ?? undefined}
        />
      )}

      <div className="mx-auto max-w-bottle min-h-screen bg-cc-white shadow-xl">
        {/* Top nav — hidden in preview mode */}
        {!isPreview && (
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              {brand?.logo_url ? (
                <img src={brand.logo_url} alt={brand.name ?? 'Classy Cocktails'} className="h-7 w-auto object-contain" />
              ) : (
                <>
                  <ClassyLogo size={24} />
                  <span className="font-sans-consumer text-[10px] tracking-[0.3em] uppercase text-cc-text-lt">
                    {brand?.name ?? 'Classy Cocktails'}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {availableLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLangSwitch(l)}
                  className={`font-sans-consumer text-xs tracking-widest px-2 py-1 transition-colors ${
                    lang === l ? 'text-cc-gold font-medium' : 'text-cc-text-lt hover:text-cc-text-md'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          {sections.map((sec) => {
            if (!sec.is_visible) return null;
            const rendered = renderSection(sec.section_key, effectiveContent(sec), sec.block_type, sec.block_config);
            if (!rendered) return null;

            const activationPlacement = ACTIVATION_AFTER[sec.section_key];

            return (
              <div key={sec.section_key}>
                {/* before_cta slot */}
                {sec.section_key === 'store_cta' && activeActivations && (
                  <ActivationSlot activations={activeActivations} placement="before_cta" productSlug={product.slug} brandName={brand?.name} />
                )}
                {rendered}
                {activationPlacement && activeActivations && (
                  <ActivationSlot activations={activeActivations} placement={activationPlacement} productSlug={product.slug} brandName={brand?.name} />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* GDPR cookie consent — only shown on first visit when consent is unset */}
      {!isPreview && <CookieBanner />}

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage.url} alt={fullscreenImage.alt} className="max-w-full max-h-[85vh] object-contain" />
          {fullscreenImage.alt && (
            <p className="font-sans-consumer text-xs text-white/70 mt-3 px-6 text-center">{fullscreenImage.alt}</p>
          )}
          <button className="absolute top-5 right-5 text-white/60 hover:text-white text-2xl">✕</button>
        </div>
      )}
    </div>
  );
}
