import type { Database } from '@/integrations/supabase/types';
import { t } from '@/lib/consumerI18n';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
  lang?: string;
}

export function BottleQuickFacts({ product, lang = 'EN' }: Props) {
  const facts = [
    { labelKey: 'spirit' as const, value: product.spirit },
    { labelKey: 'serving' as const, value: product.serving },
    { labelKey: 'glass' as const, value: product.glass },
    { labelKey: 'ice' as const, value: product.ice },
    { labelKey: 'garnish' as const, value: product.garnish },
    { labelKey: 'flavour' as const, value: product.flavour },
  ].filter((f) => f.value && f.value !== 'None');

  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-5">
        {t(lang, 'how_to_serve')}
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {facts.map((fact) => (
          <div key={fact.labelKey}>
            <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-text-lt mb-1">
              {t(lang, fact.labelKey)}
            </p>
            <p className="font-sans-consumer text-sm text-cc-text">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
