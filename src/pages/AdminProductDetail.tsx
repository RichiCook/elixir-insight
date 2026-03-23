import { useParams, Link } from 'react-router-dom';
import {
  useProduct,
  useProductTranslations,
  useProductComposition,
  useProductTechnicalData,
  useProductServeMoments,
  useProductAiPairings,
} from '@/hooks/useProduct';

export default function AdminProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: translationEN } = useProductTranslations(product?.id, 'EN');
  const { data: composition } = useProductComposition(product?.id);
  const { data: technicalData } = useProductTechnicalData(product?.id);
  const { data: serveMoments } = useProductServeMoments(product?.id);
  const { data: pairings } = useProductAiPairings(product?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: product.bottle_color || '#333' }}
            />
            <h1 className="text-lg font-admin font-semibold text-foreground">
              {product.name}
            </h1>
            <span className="text-xs text-muted-foreground">
              {product.line} · {product.abv}% ABV
            </span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Basic info */}
        <Section title="Product Information">
          <InfoGrid items={[
            { label: 'Slug', value: product.slug },
            { label: 'EAN (INT)', value: product.ean_int },
            { label: 'Serving', value: product.serving },
            { label: 'Spirit', value: product.spirit },
            { label: 'Garnish', value: product.garnish },
            { label: 'Glass', value: product.glass },
            { label: 'Ice', value: product.ice },
            { label: 'Flavour', value: product.flavour },
            { label: 'Liquid Color', value: product.liquid_color },
            { label: 'Food Pairing', value: product.food_pairing },
            { label: 'Occasion', value: product.occasion },
            { label: 'UK Units', value: product.uk_units },
            { label: 'Allergens', value: product.allergens_summary },
            { label: 'Completeness', value: `${product.completeness}%` },
          ]} />
        </Section>

        {/* Translation EN */}
        {translationEN && (
          <Section title="Translation (EN)">
            <div className="space-y-3">
              {translationEN.claim && (
                <Field label="Claim" value={translationEN.claim} />
              )}
              {translationEN.sensory_description && (
                <Field label="Sensory Description" value={translationEN.sensory_description} />
              )}
              {translationEN.ingredient_list_short && (
                <Field label="Ingredients (Short)" value={translationEN.ingredient_list_short} />
              )}
            </div>
          </Section>
        )}

        {/* Composition */}
        {composition && composition.length > 0 && (
          <Section title="Composition">
            <div className="space-y-2">
              {composition.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-foreground">{c.ingredient_name}</span>
                  <span className="text-xs text-muted-foreground">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Serve Moments */}
        {serveMoments && serveMoments.length > 0 && (
          <Section title={`Serve Moments (${serveMoments.length})`}>
            <div className="space-y-2">
              {serveMoments.map((m) => (
                <div key={m.id} className="text-sm text-foreground">
                  {m.emoji} <span className="font-medium">{m.title}</span> — {m.description}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* AI Pairings */}
        {pairings && pairings.length > 0 && (
          <Section title={`AI Pairings (${pairings.length})`}>
            <div className="flex flex-wrap gap-2">
              {pairings.map((p) => (
                <span
                  key={p.id}
                  className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full"
                >
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Technical Data */}
        {technicalData && (
          <Section title="Technical Data">
            <InfoGrid items={[
              { label: 'pH', value: technicalData.ph },
              { label: 'Brix', value: technicalData.brix },
              { label: 'Energy', value: `${technicalData.energy_kcal} kcal` },
              { label: 'Shelf Life', value: technicalData.shelf_life },
              { label: 'Storage', value: technicalData.storage_conditions },
            ]} />
          </Section>
        )}

        {/* Consumer preview */}
        <div className="border-t border-border pt-4">
          <Link
            to={`/bottle/${product.slug}`}
            target="_blank"
            className="text-sm text-primary hover:underline font-admin"
          >
            Preview Consumer DPP ↗
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-admin font-semibold text-primary tracking-wide uppercase mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string | null | undefined }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items
        .filter((item) => item.value)
        .map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-admin uppercase tracking-wider text-muted-foreground mb-0.5">
              {item.label}
            </p>
            <p className="text-sm text-foreground">{item.value}</p>
          </div>
        ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-admin uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm text-foreground whitespace-pre-line">{value}</p>
    </div>
  );
}
