import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Product;
}

export function BottleQuickFacts({ product }: Props) {
  const facts = [
    { label: 'Spirit', value: product.spirit },
    { label: 'Serving', value: product.serving },
    { label: 'Glass', value: product.glass },
    { label: 'Ice', value: product.ice },
    { label: 'Garnish', value: product.garnish },
    { label: 'Flavour', value: product.flavour },
  ].filter((f) => f.value && f.value !== 'None');

  return (
    <section className="px-6 py-8 border-t border-cc-border">
      <h2 className="font-display text-lg font-light tracking-wide text-cc-black mb-5">
        How to Serve
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <p className="font-sans-consumer text-[10px] tracking-[0.2em] uppercase text-cc-text-lt mb-1">
              {fact.label}
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
