import { useState } from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

interface TechData {
  [key: string]: any;
}

interface Props {
  data: TechData | null;
  allergensSummary?: string | null;
  onExpand?: () => void;
}

function cleanValue(raw: any): string {
  if (!raw || raw === 'null') return '—';
  return String(raw)
    .replace(/\s*\/\s*100\s*m?l/gi, '')
    .replace(/\s*\/\s*100\s*g/gi, '')
    .replace(/Kcal/gi, 'kcal')
    .replace(/KJ/gi, 'kJ')
    .replace(/(\d),(\d)/g, '$1.$2')
    .trim();
}

function isValidPH(ph: any): boolean {
  if (!ph) return false;
  const n = parseFloat(String(ph).replace(',', '.'));
  return !isNaN(n) && n >= 0 && n <= 14;
}

function DataRow({ label, value, indented }: { label: string; value: string | null | undefined; indented?: boolean }) {
  const cleaned = cleanValue(value);
  if (cleaned === '—') return null;
  return (
    <div className="flex justify-between items-baseline" style={{ padding: '9px 0', paddingLeft: indented ? 16 : 0, borderBottom: '1px solid rgba(229,224,216,0.6)' }}>
      <span className="font-sans-consumer font-light" style={{ fontSize: indented ? 11 : 12, color: indented ? '#7a7a7a' : '#5a5a5a' }}>{label}</span>
      <span className="font-sans-consumer text-[11px] font-medium" style={{ color: '#2a2a2a' }}>{cleaned}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center mt-5 mb-[10px]">
      <span className="font-sans-consumer uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: '0.16em', color: '#b8975a' }}>{children}</span>
      <span className="flex-1 ml-2" style={{ height: 1, background: 'rgba(184,151,90,0.2)' }} />
    </div>
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-sans-consumer uppercase" style={{ fontSize: 8, letterSpacing: '0.12em', color: '#9a9a9a' }}>{label}</p>
      <p className="font-sans-consumer" style={{ fontSize: 10, color: '#b8975a', fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function DeclarationRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-[10px]" style={{ padding: '9px 0', borderBottom: '1px solid rgba(229,224,216,0.6)' }}>
      <span className="flex-shrink-0 flex items-center justify-center rounded" style={{ width: 18, height: 18, background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.2)', fontSize: 9 }}>{icon}</span>
      <div className="flex-1">
        <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.1em', color: '#9a9a9a', fontWeight: 500, marginBottom: 2 }}>{label}</p>
        <p className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 300, color: '#5a5a5a', lineHeight: 1.5 }}>{value}</p>
      </div>
    </div>
  );
}

function NutritionalTable({ td }: { td: TechData }) {
  const energyDisplay = (td.energy_kcal || td.energy_kj)
    ? `${cleanValue(td.energy_kcal)} kcal / ${cleanValue(td.energy_kj)} kJ`
    : null;

  return (
    <>
      <SectionLabel>Nutritional Values per 100ml</SectionLabel>
      {energyDisplay && (
        <div className="flex justify-between items-baseline" style={{ padding: '9px 0', borderBottom: '1px solid rgba(229,224,216,0.6)' }}>
          <span className="font-sans-consumer font-light" style={{ fontSize: 12, color: '#5a5a5a' }}>Energy</span>
          <span className="font-sans-consumer text-[11px] font-medium" style={{ color: '#2a2a2a' }}>{energyDisplay}</span>
        </div>
      )}
      <DataRow label="Fats" value={td.fats} />
      <DataRow label="of which saturated" value={td.saturated_fats} indented />
      <DataRow label="of which trans fats" value={td.trans_fats} indented />
      <DataRow label="Carbohydrates" value={td.carbohydrates} />
      <DataRow label="of which sugars" value={td.sugars} indented />
      <DataRow label="Dietary Fibre" value={td.fibre} />
      <DataRow label="Proteins" value={td.proteins} />
      <DataRow label="Salt" value={td.salt} />
      <DataRow label="Sodium" value={td.sodium_mg ? `${cleanValue(td.sodium_mg)} mg` : null} />
    </>
  );
}

// ── SUPPLIER TECH SHEET LAYOUT ─────────────────────────────
function TechSheetView({ td, allergensSummary }: { td: TechData; allergensSummary?: string | null }) {
  const hasNutrition = td.energy_kcal || td.energy_kj || td.carbohydrates || td.proteins || td.fats || td.salt;
  const hasOrganoleptic = td.odor || td.appearance || td.taste_profile;
  const hasChemical = isValidPH(td.ph) || td.brix;
  const hasStorage = td.shelf_life;
  const hasDeclarations = td.gmo_declaration || td.ionising_radiation || td.compliance_references;
  const hasSupplier = td.supplier_name;

  return (
    <>
      {/* Doc metadata */}
      <div className="flex justify-between items-start" style={{ background: 'rgba(184,151,90,0.06)', borderBottom: '1px solid var(--border)', padding: '10px 18px' }}>
        <MetaItem label="Document" value={td.document_revision ? `Rev ${td.document_revision} · ${td.document_date || ''}` : 'Label Data'} />
        <MetaItem label="Application" value={td.application || 'Cocktail RTD'} />
        <MetaItem label="Dosage" value={td.recommended_dosage || '100 ml/serve'} />
      </div>

      <div style={{ padding: '0 18px' }}>
        {hasNutrition && <NutritionalTable td={td} />}

        {hasOrganoleptic && (
          <>
            <SectionLabel>Organoleptic Profile</SectionLabel>
            <DataRow label="Odor" value={td.odor} />
            <DataRow label="Appearance" value={td.appearance} />
            <DataRow label="Colour" value={td.colour} />
            <DataRow label="Taste" value={td.taste_profile} />
          </>
        )}

        {hasChemical && (
          <>
            <SectionLabel>Chemical Parameters</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {isValidPH(td.ph) && (
                <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
                  <p className="font-serif-consumer" style={{ fontSize: 26, fontWeight: 300, color: '#b8975a', lineHeight: 1, marginBottom: 4 }}>{cleanValue(td.ph)}</p>
                  <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#9a9a9a', fontWeight: 500 }}>pH</p>
                </div>
              )}
              {td.brix && (
                <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
                  <p className="font-serif-consumer" style={{ fontSize: 26, fontWeight: 300, color: '#b8975a', lineHeight: 1, marginBottom: 4 }}>{cleanValue(td.brix)}</p>
                  <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#9a9a9a', fontWeight: 500 }}>°Brix</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Allergen grid */}
        <SectionLabel>Allergen Declaration — EU Reg. 1169/2011</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          {ALLERGEN_LABELS.map(({ key, label }) => {
            const present = !!td[key];
            return (
              <div key={key} className="flex items-center" style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 4, padding: '7px 6px', gap: 5 }}>
                <span className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, backgroundColor: present ? '#a04040' : '#4a8c5c' }} />
                <span className="font-sans-consumer" style={{ fontSize: 9, fontWeight: 300, color: '#5a5a5a' }}>{label}</span>
              </div>
            );
          })}
        </div>

        {hasStorage && (
          <>
            <SectionLabel>Storage</SectionLabel>
            <DataRow label="🕐 Best Before" value={td.shelf_life} />
            <DataRow label="🌡 Storage" value={td.storage_conditions} />
            <DataRow label="ℹ After Opening" value={td.storage_after_opening} />
          </>
        )}

        {hasDeclarations && (
          <>
            <SectionLabel>Declarations</SectionLabel>
            {td.gmo_declaration && <DeclarationRow icon="✓" label="GMO Declaration" value={td.gmo_declaration} />}
            {td.ionising_radiation && <DeclarationRow icon="✓" label="Ionising Radiation" value={td.ionising_radiation} />}
            {td.compliance_references && <DeclarationRow icon="⚖" label="Compliance" value={td.compliance_references} />}
          </>
        )}

        {hasSupplier && (
          <>
            <SectionLabel>Supplied By</SectionLabel>
            <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px' }}>
              <p className="font-serif-consumer" style={{ fontSize: 15, fontWeight: 500, color: '#2a2a2a', marginBottom: 5 }}>{td.supplier_name}</p>
              {td.supplier_address && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>📍 {td.supplier_address}</p>}
              {td.supplier_vat && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>🆔 {td.supplier_vat}</p>}
              {td.supplier_phone && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>📞 {td.supplier_phone}</p>}
              {td.supplier_email && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>✉ {td.supplier_email}</p>}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center" style={{ background: '#f5f0ea', borderTop: '1px solid #e5e0d8', padding: '12px 18px', marginTop: 16 }}>
        <div className="flex items-center gap-[6px]">
          <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: '#4a8c5c' }} />
          <span className="font-sans-consumer" style={{ fontSize: 9, fontWeight: 300, color: '#9a9a9a' }}>
            Verified · {td.supplier_name || 'Label Data'} · EU Compliant
          </span>
        </div>
        <span className="font-sans-consumer uppercase" style={{ fontSize: 8, letterSpacing: '0.1em', color: 'rgba(184,151,90,0.6)' }}>EU Reg. 1169/2011</span>
      </div>
    </>
  );
}

// ── LABORATORY TEST REPORT LAYOUT ──────────────────────────
function LabReportView({ td }: { td: TechData }) {
  const hasNutrition = td.energy_kcal || td.energy_kj || td.carbohydrates || td.proteins || td.fats || td.salt;
  const hasChemical = td.total_acidity || td.alcoholic_strength;

  return (
    <>
      {/* Doc metadata */}
      <div className="flex justify-between items-start flex-wrap gap-2" style={{ background: 'rgba(184,151,90,0.06)', borderBottom: '1px solid var(--border)', padding: '10px 18px' }}>
        <MetaItem label="Test Report" value={td.test_report_number || '—'} />
        <MetaItem label="Date" value={td.document_date || '—'} />
        <MetaItem label="Batch" value={td.batch_number || '—'} />
        <MetaItem label="Accreditation" value={td.accreditation_number || '—'} />
      </div>

      <div style={{ padding: '0 18px' }}>
        {hasNutrition && <NutritionalTable td={td} />}

        {hasChemical && (
          <>
            <SectionLabel>Chemical Analysis</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {td.total_acidity && (
                <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
                  <p className="font-serif-consumer" style={{ fontSize: 22, fontWeight: 300, color: '#b8975a', lineHeight: 1, marginBottom: 4 }}>{cleanValue(td.total_acidity)}</p>
                  <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#9a9a9a', fontWeight: 500 }}>Total Acidity</p>
                </div>
              )}
              {td.alcoholic_strength && (
                <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
                  <p className="font-serif-consumer" style={{ fontSize: 22, fontWeight: 300, color: '#b8975a', lineHeight: 1, marginBottom: 4 }}>{cleanValue(td.alcoholic_strength)}%</p>
                  <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#9a9a9a', fontWeight: 500 }}>Alcoholic Strength % vol</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Allergen declaration */}
        <SectionLabel>Allergen Declaration</SectionLabel>
        {td.allergen_sulphites ? (
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(196,160,80,0.15)', border: '1px solid rgba(196,160,80,0.3)' }}>
            <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: '#a04040' }} />
            <span className="font-sans-consumer text-[10px] font-medium" style={{ color: '#a08040' }}>Contains Sulphites</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.2)' }}>
            <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: '#4a8c5c' }} />
            <span className="font-sans-consumer text-[10px] font-medium" style={{ color: '#4a8c5c' }}>No allergens declared above detection limits</span>
          </div>
        )}

        {td.compliance_references && (
          <>
            <SectionLabel>Compliance References</SectionLabel>
            <p className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 300, color: '#5a5a5a', lineHeight: 1.6 }}>{td.compliance_references}</p>
          </>
        )}

        {/* Issuing laboratory */}
        {td.laboratory_name && (
          <>
            <SectionLabel>Issued By</SectionLabel>
            <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px' }}>
              <p className="font-serif-consumer" style={{ fontSize: 15, fontWeight: 500, color: '#2a2a2a', marginBottom: 5 }}>{td.laboratory_name}</p>
              {td.laboratory_address && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>📍 {td.laboratory_address}</p>}
              {td.accreditation_number && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a' }}>🏅 Accreditation #{td.accreditation_number}</p>}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center" style={{ background: '#f5f0ea', borderTop: '1px solid #e5e0d8', padding: '12px 18px', marginTop: 16 }}>
        <div className="flex items-center gap-[6px]">
          <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: '#4a8c5c' }} />
          <span className="font-sans-consumer" style={{ fontSize: 9, fontWeight: 300, color: '#9a9a9a' }}>
            Analytical data · {td.laboratory_name || 'Laboratory'} · {td.compliance_references || 'EU Compliant'}
          </span>
        </div>
        <span className="font-sans-consumer uppercase" style={{ fontSize: 8, letterSpacing: '0.1em', color: 'rgba(184,151,90,0.6)' }}>EU Reg. 1169/2011</span>
      </div>
    </>
  );
}

// ── LABEL-ONLY VIEW (Excel data, no PDF uploaded) ──────────
function LabelOnlyView({ td, allergensSummary }: { td: TechData | null; allergensSummary?: string | null }) {
  const hasNutrition = td && (td.energy_kcal || td.energy_kj || td.carbohydrates || td.proteins || td.fats || td.salt);

  return (
    <div style={{ padding: '0 18px' }}>
      {hasNutrition && <NutritionalTable td={td!} />}

      {allergensSummary && allergensSummary !== 'None' && (
        <>
          <SectionLabel>Allergens</SectionLabel>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(196,160,80,0.15)', border: '1px solid rgba(196,160,80,0.3)' }}>
            <span className="font-sans-consumer text-[10px] font-medium" style={{ color: '#a08040' }}>{allergensSummary}</span>
          </div>
        </>
      )}

      <p className="font-sans-consumer italic text-center mt-6 mb-2" style={{ fontSize: 10, color: '#9a9a9a' }}>
        Data from label declaration · Full technical sheet pending
      </p>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export function BottleNutrition({ data, allergensSummary, onExpand }: Props) {
  const [open, setOpen] = useState(false);
  const td = data as TechData | null;

  const hasNutrition = td && (td.energy_kcal || td.energy_kj || td.carbohydrates || td.proteins || td.fats || td.salt);
  const hasAnyTechData = td && (hasNutrition || td.odor || td.ph || td.shelf_life || td.supplier_name || td.laboratory_name);
  const docType = td?.document_type || null;
  const isLabReport = docType === 'LABORATORY_TEST_REPORT';
  const isTechSheet = docType === 'SUPPLIER_TECH_SHEET';
  const isLabelOnly = hasNutrition && !isTechSheet && !isLabReport;
  const hasNoData = !hasAnyTechData && !allergensSummary;

  // Build sub-label
  const subParts: string[] = [];
  if (hasNutrition) subParts.push('Nutritional');
  if (td || allergensSummary) subParts.push('Allergens');
  if (td?.shelf_life) subParts.push('Storage');
  if (td?.gmo_declaration || td?.ionising_radiation || td?.compliance_references || td?.supplier_name || td?.laboratory_name) subParts.push('Declarations');
  const subLabel = subParts.length > 0 ? subParts.join(' · ') : 'Nutritional · Allergens';

  return (
    <section>
      <button
        onClick={() => { setOpen(v => { if (!v && onExpand) onExpand(); return !v; }); }}
        className="flex items-center justify-between border-t border-b border-cc-border w-full text-left cursor-pointer"
        style={{ backgroundColor: '#f5f0ea', padding: '10px 18px' }}
      >
        <ShieldCheck size={16} style={{ color: '#b8975a' }} />
        <div className="flex flex-col items-center">
          <span className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#2a2a2a' }}>Digital Nutritional Passport</span>
          <span className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#9a9a9a', marginTop: 2 }}>{subLabel}</span>
        </div>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#4a8c5c' }} />
            <span className="font-sans-consumer" style={{ fontSize: 9, color: '#4a8c5c' }}>Verified</span>
          </span>
          <ChevronDown size={14} style={{ color: '#9a9a9a', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
        </span>
      </button>

      <div style={{ maxHeight: open ? 4000 : 0, overflow: 'hidden', transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
        {hasNoData ? (
          <p className="font-sans-consumer italic text-center" style={{ fontSize: 12, color: '#9a9a9a', padding: 20 }}>
            Technical analysis not yet available. Upload a supplier data sheet or lab report in the admin panel.
          </p>
        ) : isLabReport ? (
          <LabReportView td={td!} />
        ) : isTechSheet ? (
          <TechSheetView td={td!} allergensSummary={allergensSummary} />
        ) : (
          <LabelOnlyView td={td} allergensSummary={allergensSummary} />
        )}
      </div>
    </section>
  );
}
