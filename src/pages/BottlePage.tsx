import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  useProduct,
  useProductTranslations,
  useProductComposition,
  useProductTechnicalData,
  useProductServeMoments,
  useProductAiPairings,
} from '@/hooks/useProduct';
import { useProductImages } from '@/hooks/useImages';
import { usePageViewTracking, useSectionTracking, trackInteraction } from '@/hooks/useTracking';
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
import { AgeGate } from '@/components/consumer/AgeGate';
import { RepairButton } from '@/components/consumer/RepairButton';
import { RepairRequestSheet } from '@/components/consumer/RepairRequestSheet';
import { ActivationSlot } from '@/components/consumer/ActivationRenderer';
import { useActiveActivationsForProduct } from '@/hooks/useActivations';
import { useRepairSettings } from '@/hooks/useRepairSettings';

const LANGUAGES = ['EN', 'IT', 'DE', 'FR'] as const;

export default function BottlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<string>('EN');
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; alt: string } | null>(null);
  const [repairSheetOpen, setRepairSheetOpen] = useState(false);

  const { data: product, isLoading } = useProduct(slug || '');
  const { data: translation } = useProductTranslations(product?.id, lang);
  const { data: composition } = useProductComposition(product?.id);
  const { data: technicalData } = useProductTechnicalData(product?.id);
  const { data: serveMoments } = useProductServeMoments(product?.id);
  const { data: pairings } = useProductAiPairings(product?.id);
  const { data: productImages } = useProductImages(product?.id);
  const { data: activeActivations } = useActiveActivationsForProduct(product?.id);

  // Tracking
  usePageViewTracking(slug);
  const { observeSection } = useSectionTracking(slug);

  // Section refs for IntersectionObserver tracking
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

  // Group images by section, only use approved ones
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

  const serveMomentImageMap: Record<number, string> = {};
  serveMomentImagesRaw.forEach((pi: any, idx: number) => {
    serveMomentImageMap[idx] = pi.brand_images?.public_url;
  });

  const handleLangSwitch = (newLang: string) => {
    if (slug && newLang !== lang) {
      trackInteraction(slug, 'language_switch', 'click', { from: lang, to: newLang });
    }
    setLang(newLang);
  };

  const handleCtaClick = () => {
    if (slug) trackInteraction(slug, 'cta_click', 'click');
  };

  const handleIngredientExpand = () => {
    if (slug) trackInteraction(slug, 'ingredients', 'expand');
  };

  const handleNutritionExpand = () => {
    if (slug) trackInteraction(slug, 'nutritional_passport', 'expand');
  };

  if (isLoading) {
    return (
      <div className="consumer-theme min-h-screen bg-cc-cream flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="consumer-theme min-h-screen bg-cc-white flex items-center justify-center">
        <p className="font-sans-consumer text-cc-text-md">Product not found</p>
      </div>
    );
  }

  const showAgeGate = parseFloat(product.abv) > 0;

  return (
    <div className="consumer-theme min-h-screen" style={{ backgroundColor: '#e8e4dc' }}>
      {showAgeGate && <AgeGate />}

      <div className="mx-auto max-w-bottle min-h-screen bg-cc-white shadow-xl">
        {/* Top nav with logo */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <ClassyLogo size={24} />
            <span className="font-sans-consumer text-[10px] tracking-[0.3em] uppercase text-cc-text-lt">
              Classy Cocktails
            </span>
          </div>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => handleLangSwitch(l)}
                className={`font-sans-consumer text-xs tracking-widest px-2 py-1 transition-colors ${
                  lang === l
                    ? 'text-cc-gold font-medium'
                    : 'text-cc-text-lt hover:text-cc-text-md'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div ref={heroRef}>
          <BottleHero product={product} heroImageUrl={heroImageUrl} />
        </div>
        <GenuineCard product={product} />
        <AbvDisplay product={product} />

        {activeActivations && <ActivationSlot activations={activeActivations} placement="after_hero" productSlug={product.slug} />}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div ref={serveRef}>
            <BottleQuickFacts product={product} />
          </div>

          {product.spirit && (
            <CraftedWith spirit={product.spirit} />
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_serve" productSlug={product.slug} />}

          {translation?.sensory_description && (
            <div ref={sensoryRef}>
              <BottleSensory description={translation.sensory_description} />
            </div>
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_sensory" productSlug={product.slug} />}

          {composition && composition.length > 0 && (
            <div ref={compositionRef}>
              <BottleComposition composition={composition} />
            </div>
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_composition" productSlug={product.slug} />}

          {serveMoments && serveMoments.length > 0 && (
            <div ref={momentsRef}>
              <BottleServeMoments
                moments={serveMoments}
                line={product.line}
                serveMomentImages={serveMomentImageMap}
              />
            </div>
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_moments" productSlug={product.slug} />}

          {pairings && pairings.length > 0 && (
            <div ref={pairingsRef}>
              <BottlePairings pairings={pairings} />
            </div>
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_pairings" productSlug={product.slug} />}

          {translation && (
            <div ref={ingredientsRef}>
              <BottleIngredients
                translation={translation}
                allergensSummary={product.allergens_summary}
                onExpand={handleIngredientExpand}
              />
            </div>
          )}

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_ingredients" productSlug={product.slug} />}

          <div ref={nutritionRef}>
            <BottleNutrition
              data={technicalData ?? null}
              allergensSummary={product.allergens_summary}
              onExpand={handleNutritionExpand}
            />
          </div>

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_nutrition" productSlug={product.slug} />}
          {activeActivations && <ActivationSlot activations={activeActivations} placement="before_cta" productSlug={product.slug} />}

          <StoreCTA slug={product.slug} onCtaClick={handleCtaClick} />

          <div ref={editorialRef}>
            <EditorialBlock line={product.line} bottleColor={product.bottle_color} editorialImageUrl={editorialImageUrl} />
          </div>

          {activeActivations && <ActivationSlot activations={activeActivations} placement="after_editorial" productSlug={product.slug} />}

          {/* Gallery section — only if 3+ approved gallery images */}
          {galleryImages.length >= 3 && (
            <section className="py-6">
              <div
                className="flex gap-2 overflow-x-auto px-0 pb-2 gallery-scroll"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}
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
                      <img
                        src={pi.brand_images?.public_url}
                        alt={altText || ''}
                        className="w-full object-cover"
                        style={{ aspectRatio: '4/3' }}
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div ref={heritageRef}>
            <BrandHeritage lang={lang} />
          </div>

          <BottleFooter product={product} />
        </motion.div>
      </div>

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.alt}
            className="max-w-full max-h-[85vh] object-contain"
          />
          {fullscreenImage.alt && (
            <p className="font-sans-consumer text-xs text-white/70 mt-3 px-6 text-center">
              {fullscreenImage.alt}
            </p>
          )}
          <button className="absolute top-5 right-5 text-white/60 hover:text-white text-2xl">✕</button>
        </div>
      )}
    </div>
  );
}
