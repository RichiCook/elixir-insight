import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  useProduct,
  useProductTranslations,
  useProductComposition,
  useProductTechnicalData,
  useProductServeMoments,
  useProductAiPairings,
} from '@/hooks/useProduct';
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

const LANGUAGES = ['EN', 'IT', 'DE', 'FR'] as const;

export default function BottlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<string>('EN');

  const { data: product, isLoading } = useProduct(slug || '');
  const { data: translation } = useProductTranslations(product?.id, lang);
  const { data: composition } = useProductComposition(product?.id);
  const { data: technicalData } = useProductTechnicalData(product?.id);
  const { data: serveMoments } = useProductServeMoments(product?.id);
  const { data: pairings } = useProductAiPairings(product?.id);

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
                onClick={() => setLang(l)}
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

        <BottleHero product={product} />
        <GenuineCard product={product} />
        <AbvDisplay product={product} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <BottleQuickFacts product={product} />

          {product.spirit && (
            <CraftedWith spirit={product.spirit} />
          )}

          {translation?.sensory_description && (
            <BottleSensory description={translation.sensory_description} />
          )}

          {composition && composition.length > 0 && (
            <BottleComposition composition={composition} />
          )}

          {serveMoments && serveMoments.length > 0 && (
            <BottleServeMoments moments={serveMoments} line={product.line} />
          )}

          {pairings && pairings.length > 0 && (
            <BottlePairings pairings={pairings} />
          )}

          {translation && (
            <BottleIngredients translation={translation} allergensSummary={product.allergens_summary} />
          )}

          <BottleNutrition data={technicalData ?? null} allergensSummary={product.allergens_summary} />

          <StoreCTA slug={product.slug} />

          <EditorialBlock line={product.line} bottleColor={product.bottle_color} />

          <BrandHeritage lang={lang} />

          <BottleFooter product={product} />
        </motion.div>
      </div>
    </div>
  );
}
