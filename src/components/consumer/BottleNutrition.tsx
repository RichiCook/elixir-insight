import { ShieldCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type TechData = Database['public']['Tables']['product_technical_data']['Row'];

interface Props {
  data: TechData | null;
  allergensSummary?: string | null;
}

function DataRow({ label, value, indented }: { label: string; value: string | null | undefined; indented?: boolean }) {
  if (!value) return null;
  return (
    <div
      className="flex justify-between items-baseline border-b border-cc-border"
      style={{ padding: '9px 0', paddingLeft: indented ? 14 : 0 }}
    >
      <span
        className="font-sans-consumer font-light"
        style={{ fontSize: indented ? 11 : 12, color: indented ? '#7a7a7a' : '#5a5a5a' }}
      >
        {label}
      </span>
      <span className="font-sans-consumer text-[11px] font-medium" style={{ color: '#2a2a2a' }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans-consumer uppercase mb-[10px] mt-5"
      style={{ fontSize: 9, letterSpacing: '0.16em', color: '#b8975a' }}
    >
      {children}
    </p>
  );
}

const ALLERGEN_LABELS = [
  { key: 'allergen_gluten', label: 'Gluten' },
  { key: 'allergen_crustaceans', label: 'Crustaceans' },
  { key: 'allergen_eggs', label: 'Eggs' },
  { key: 'allergen_fish', label: 'Fish' },
  { key: 'allergen_peanuts', label: 'Peanuts' },
  { key: 'allergen_soybeans', label: 'Soybeans' },
  { key: 'allergen_milk', label: 'Milk' },
  { key: 'allergen_nuts', label: 'Nuts' },
  { key: 'allergen_celery', label: 'Celery' },
  { key: 'allergen_mustard', label: 'Mustard' },
  { key: 'allergen_sesame', label: 'Sesame' },
  { key: 'allergen_sulphites', label: 'Sulphites' },
  { key: 'allergen_lupin', label: 'Lupin' },
  { key: 'allergen_molluscs', label: 'Molluscs' },
] as const;

export function BottleNutrition({ data, allergensSummary }: Props) {
  const hasNutrition = data && (data.energy_kcal || data.energy_kj || data.carbohydrates || data.proteins || data.fats || data.salt);
  const hasOrganoleptic = data && (data.odor || data.appearance || data.taste_profile);
  const hasChemical = data && (data.ph || data.brix);
  const hasStorage = data && data.shelf_life;
  const hasDeclarations = data && data.gmo_declaration;
  const hasTechInfo = data && ((data as any).recommended_dosage || (data as any).document_revision || (data as any).supplier_name);
  const hasAnyData = hasNutrition || allergensSummary;

  return (
    <section>
      {/* Header banner */}
      <div
        className="flex items-center justify-between border-t border-b border-cc-border"
        style={{ backgroundColor: '#f5f0ea', padding: '10px 18px' }}
      >
        <ShieldCheck size={16} style={{ color: '#b8975a' }} />
        <span
          className="font-sans-consumer uppercase"
          style={{ fontSize: 9, letterSpacing: '0.2em', color: '#2a2a2a' }}
        >
          Digital Nutritional Passport
        </span>
        <span className="flex items-center gap-1">
          <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#4a8c5c' }} />
          <span className="font-sans-consumer" style={{ fontSize: 9, color: '#4a8c5c' }}>Verified</span>
        </span>
      </div>

      <div style={{ padding: '0 18px 16px' }}>
        {!hasAnyData ? (
          <p className="font-sans-consumer italic text-center" style={{ fontSize: 12, color: '#9a9a9a', padding: 20 }}>
            Technical data not yet available for this product.
          </p>
        ) : (
          <>
            {/* A — Nutritional Values */}
            {hasNutrition && (
              <>
                <SectionLabel>Nutritional Values per 100ml</SectionLabel>
                {(data.energy_kcal || data.energy_kj) && (
                  <DataRow label="Energy" value={`${data.energy_kcal || '–'} kcal / ${data.energy_kj || '–'} kJ`} />
                )}
                <DataRow label="Fats" value={data.fats} />
                <DataRow label="of which saturated" value={data.saturated_fats} indented />
                <DataRow label="Carbohydrates" value={data.carbohydrates} />
                <DataRow label="of which sugars" value={data.sugars} indented />
                <DataRow label="Dietary Fibre" value={data.fibre} />
                <DataRow label="Proteins" value={data.proteins} />
                <DataRow label="Salt" value={data.salt} />
              </>
            )}

            {/* B — Organoleptic */}
            {hasOrganoleptic && (
              <>
                <SectionLabel>Organoleptic Profile</SectionLabel>
                <DataRow label="Odor" value={data.odor} />
                <DataRow label="Appearance" value={data.appearance} />
                <DataRow label="Taste" value={data.taste_profile} />
              </>
            )}

            {/* C — Chemical */}
            {hasChemical && (
              <>
                <SectionLabel>Chemical Parameters</SectionLabel>
                <DataRow label="pH" value={data.ph} />
                <DataRow label="°Brix" value={data.brix} />
              </>
            )}

            {/* D — Allergen Declaration */}
            {data && (
              <>
                <SectionLabel>Allergen Declaration — EU Reg. 1169/2011</SectionLabel>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2">
                  {ALLERGEN_LABELS.map(({ key, label }) => {
                    const present = !!(data as any)[key];
                    return (
                      <div key={key} className="flex items-center gap-[5px]">
                        <span
                          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: present ? '#a04040' : '#4a8c5c' }}
                        />
                        <span className="font-sans-consumer font-light" style={{ fontSize: 10, color: '#5a5a5a' }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Allergen summary chip fallback */}
            {!data && allergensSummary && allergensSummary !== 'None' && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#fef3cd' }}>
                <span className="text-sm">⚠️</span>
                <p className="font-sans-consumer text-xs font-medium" style={{ color: '#856404' }}>
                  {allergensSummary}
                </p>
              </div>
            )}

            {/* E — Storage */}
            {hasStorage && (
              <>
                <SectionLabel>Storage</SectionLabel>
                <DataRow label="🕐 Best Before" value={data.shelf_life} />
                <DataRow label="🌡 Storage" value={data.storage_conditions} />
                <DataRow label="ℹ After Opening" value={data.storage_after_opening} />
              </>
            )}

            {/* F — Declarations */}
            {hasDeclarations && (
              <>
                <SectionLabel>Declarations</SectionLabel>
                <div className="space-y-0">
                  {data.gmo_declaration && (
                    <DataRow label="GMO" value={data.gmo_declaration} />
                  )}
                  {data.ionising_radiation && (
                    <DataRow label="Ionising Radiation" value={data.ionising_radiation} />
                  )}
                  {data.compliance_references && (
                    <DataRow label="Compliance" value={data.compliance_references} />
                  )}
                </div>
              </>
            )}

            {/* G — Technical Information */}
            {hasTechInfo && (
              <>
                <SectionLabel>Technical Information</SectionLabel>
                <DataRow label="Recommended Dosage" value={(data as any).recommended_dosage} />
                {((data as any).document_revision || (data as any).document_date) && (
                  <DataRow
                    label="Document Reference"
                    value={[
                      (data as any).document_revision && `Rev ${(data as any).document_revision}`,
                      (data as any).document_date,
                    ].filter(Boolean).join(' · ')}
                  />
                )}
                <DataRow label="Supplied by" value={(data as any).supplier_name} />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
