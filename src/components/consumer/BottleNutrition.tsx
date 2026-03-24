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

function DataRow({ label, value, indented, unit }: { label: string; value: string | null | undefined; indented?: boolean; unit?: string }) {
  const cleaned = cleanValue(value);
  if (cleaned === '—') return null;
  return (
    <div className="flex justify-between items-baseline" style={{ padding: '9px 0', paddingLeft: indented ? 16 : 0, borderBottom: '1px solid rgba(229,224,216,0.6)' }}>
      <span className="font-sans-consumer font-light" style={{ fontSize: indented ? 11 : 12, color: indented ? '#7a7a7a' : '#5a5a5a' }}>{label}</span>
      <span className="font-sans-consumer text-[11px] font-medium" style={{ color: '#2a2a2a' }}>{cleaned}{unit ? ` ${unit}` : ''}</span>
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
      <p className="font-display" style={{ fontSize: 22, fontWeight: 300, color: '#b8975a', lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p className="font-sans-consumer uppercase" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#9a9a9a', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function NutritionalTable({ td, title }: { td: Record<string, any>; title: string }) {
  const energyDisplay = (td.energy_kcal || td.energy_kj)
    ? `${cleanValue(td.energy_kcal)} kcal / ${cleanValue(td.energy_kj)} kJ`
    : null;

  return (
    <>
      <SectionLabel>{title}</SectionLabel>
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

// ── MINERALS TABLE ─────────────────────────────────────────
function MineralsSection({ minerals }: { minerals: Record<string, any> }) {
  const entries = Object.entries(minerals).filter(([_, v]) => v && String(v) !== '—');
  if (entries.length === 0) return null;
  return (
    <>
      <SectionLabel>Mineral Analysis</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {entries.map(([key, val]) => {
          const display = typeof val === 'object'
            ? `${val.result || '—'}${val.unit ? ` ${val.unit}` : ''}`
            : String(val);
          return (
            <div key={key} style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '8px 10px' }}>
              <p className="font-sans-consumer uppercase" style={{ fontSize: 8, letterSpacing: '0.12em', color: '#9a9a9a', marginBottom: 2 }}>
                {key.replace(/_/g, ' ')}
              </p>
              <p className="font-sans-consumer" style={{ fontSize: 12, fontWeight: 500, color: '#2a2a2a' }}>{display}</p>
              {typeof val === 'object' && val.loq && (
                <p className="font-sans-consumer" style={{ fontSize: 8, color: '#9a9a9a', marginTop: 1 }}>LOQ: {val.loq}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── CHEMICAL CONGENERS TABLE ───────────────────────────────
function CongenersSection({ congeners }: { congeners: Record<string, any> }) {
  const entries = Object.entries(congeners).filter(([_, v]) => v && String(v) !== '—');
  if (entries.length === 0) return null;
  return (
    <>
      <SectionLabel>Chemical Congeners</SectionLabel>
      {entries.map(([key, val]) => {
        const display = typeof val === 'object'
          ? `${val.result || '—'}${val.unit ? ` ${val.unit}` : ''}`
          : String(val);
        return (
          <DataRow key={key} label={key.replace(/_/g, ' ')} value={display} />
        );
      })}
    </>
  );
}

// ── SAMPLE INFO ────────────────────────────────────────────
function SampleInfoSection({ info }: { info: Record<string, any> }) {
  const entries = Object.entries(info).filter(([_, v]) => v && String(v) !== '—' && String(v).trim());
  if (entries.length === 0) return null;
  return (
    <>
      <SectionLabel>Sample Information</SectionLabel>
      <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px' }}>
        {entries.map(([key, val]) => (
          <div key={key} className="flex justify-between items-baseline" style={{ padding: '5px 0', borderBottom: '1px solid rgba(229,224,216,0.4)' }}>
            <span className="font-sans-consumer capitalize" style={{ fontSize: 10, color: '#9a9a9a' }}>{key.replace(/_/g, ' ')}</span>
            <span className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 500, color: '#2a2a2a' }}>{String(val)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── RAW DATA RENDERER (generic for any raw_analytical_data) ─
function RawAnalyticalData({ raw }: { raw: Record<string, any> | null }) {
  if (!raw || typeof raw !== 'object') return null;

  const { minerals, chemical_congeners, congeners, sample_info, per_serving_usa, per_100g_anses, analytical_results, ...rest } = raw;

  return (
    <>
      {sample_info && <SampleInfoSection info={sample_info} />}
      {per_100g_anses && Object.keys(per_100g_anses).length > 0 && (
        <NutritionalTable td={per_100g_anses} title="Nutritional Values per 100g (Anses)" />
      )}
      {per_serving_usa && Object.keys(per_serving_usa).length > 0 && (
        <NutritionalTable td={per_serving_usa} title="Nutritional Values per Serving (USA)" />
      )}
      {analytical_results && typeof analytical_results === 'object' && Object.keys(analytical_results).length > 0 && (
        <>
          <SectionLabel>Analytical Results</SectionLabel>
          {Object.entries(analytical_results).map(([key, val]) => (
            <DataRow key={key} label={key.replace(/_/g, ' ')} value={typeof val === 'object' ? JSON.stringify(val) : String(val)} />
          ))}
        </>
      )}
      {minerals && <MineralsSection minerals={minerals} />}
      {(chemical_congeners || congeners) && <CongenersSection congeners={chemical_congeners || congeners} />}
      {/* Render any other unknown sections */}
      {Object.entries(rest).filter(([_, v]) => v && typeof v === 'object' && Object.keys(v).length > 0).map(([sectionKey, sectionData]) => (
        <div key={sectionKey}>
          <SectionLabel>{sectionKey.replace(/_/g, ' ')}</SectionLabel>
          {Object.entries(sectionData as Record<string, any>).map(([k, v]) => (
            <DataRow key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
          ))}
        </div>
      ))}
    </>
  );
}

// ── SUPPLIER TECH SHEET LAYOUT ─────────────────────────────
function TechSheetView({ td, allergensSummary }: { td: TechData; allergensSummary?: string | null }) {
  const hasNutrition = td.energy_kcal || td.energy_kj || td.carbohydrates || td.proteins || td.fats || td.salt;
  const hasOrganoleptic = td.odor || td.appearance || td.taste_profile;
  const hasChemical = isValidPH(td.ph) || td.brix;
  const hasStorage = td.shelf_life;
  const hasDeclarations = td.gmo_declaration || td.ionising_radiation || td.compliance_references || td.compliance_regulation_1;
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
        {hasNutrition && <NutritionalTable td={td} title="Nutritional Values per 100ml" />}

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
              {isValidPH(td.ph) && <StatCard value={cleanValue(td.ph)} label="pH" />}
              {td.brix && <StatCard value={cleanValue(td.brix)} label="°Brix" />}
              {td.total_acidity && <StatCard value={cleanValue(td.total_acidity)} label="Total Acidity" />}
              {td.alcoholic_strength && <StatCard value={`${cleanValue(td.alcoholic_strength)}%`} label="ABV" />}
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
            {td.compliance_regulation_1 && <DeclarationRow icon="⚖" label="Regulation" value={td.compliance_regulation_1} />}
            {td.compliance_regulation_2 && <DeclarationRow icon="⚖" label="Regulation" value={td.compliance_regulation_2} />}
            {td.compliance_regulation_3 && <DeclarationRow icon="⚖" label="Regulation" value={td.compliance_regulation_3} />}
          </>
        )}

        {td.additional_information && (
          <>
            <SectionLabel>Additional Information</SectionLabel>
            <p className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 300, color: '#5a5a5a', lineHeight: 1.6 }}>{td.additional_information}</p>
          </>
        )}

        {/* Raw analytical data (minerals, congeners, extra tables) */}
        <RawAnalyticalData raw={td.raw_analytical_data} />

        {hasSupplier && (
          <>
            <SectionLabel>Supplied By</SectionLabel>
            <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px' }}>
              <p className="font-display" style={{ fontSize: 15, fontWeight: 500, color: '#2a2a2a', marginBottom: 5 }}>{td.supplier_name}</p>
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
  const hasChemical = td.total_acidity || td.alcoholic_strength || isValidPH(td.ph) || td.brix;

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
        {hasNutrition && <NutritionalTable td={td} title="Nutritional Values per 100ml (EU)" />}

        {/* Raw analytical data — extra nutrition tables, minerals, congeners */}
        <RawAnalyticalData raw={td.raw_analytical_data} />

        {hasChemical && (
          <>
            <SectionLabel>Chemical Analysis</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {td.total_acidity && <StatCard value={cleanValue(td.total_acidity)} label="Total Acidity" />}
              {td.alcoholic_strength && <StatCard value={`${cleanValue(td.alcoholic_strength)}%`} label="Alcoholic Strength % vol" />}
              {isValidPH(td.ph) && <StatCard value={cleanValue(td.ph)} label="pH" />}
              {td.brix && <StatCard value={cleanValue(td.brix)} label="°Brix" />}
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

        {(td.compliance_references || td.compliance_regulation_1) && (
          <>
            <SectionLabel>Compliance References</SectionLabel>
            {td.compliance_references && <p className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 300, color: '#5a5a5a', lineHeight: 1.6 }}>{td.compliance_references}</p>}
            {td.compliance_regulation_1 && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#7a7a7a', lineHeight: 1.5, marginTop: 4 }}>{td.compliance_regulation_1}</p>}
            {td.compliance_regulation_2 && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#7a7a7a', lineHeight: 1.5 }}>{td.compliance_regulation_2}</p>}
            {td.compliance_regulation_3 && <p className="font-sans-consumer" style={{ fontSize: 10, fontWeight: 300, color: '#7a7a7a', lineHeight: 1.5 }}>{td.compliance_regulation_3}</p>}
          </>
        )}

        {td.additional_information && (
          <>
            <SectionLabel>Additional Information</SectionLabel>
            <p className="font-sans-consumer" style={{ fontSize: 11, fontWeight: 300, color: '#5a5a5a', lineHeight: 1.6 }}>{td.additional_information}</p>
          </>
        )}

        {/* Issuing laboratory */}
        {td.laboratory_name && (
          <>
            <SectionLabel>Issued By</SectionLabel>
            <div style={{ background: '#f5f0ea', border: '1px solid #e5e0d8', borderRadius: 6, padding: '12px 14px' }}>
              <p className="font-display" style={{ fontSize: 15, fontWeight: 500, color: '#2a2a2a', marginBottom: 5 }}>{td.laboratory_name}</p>
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
      {hasNutrition && <NutritionalTable td={td!} title="Nutritional Values per 100ml" />}

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
  const hasRawData = td?.raw_analytical_data && typeof td.raw_analytical_data === 'object' && Object.keys(td.raw_analytical_data).length > 0;
  const hasAnyTechData = td && (hasNutrition || td.odor || td.ph || td.shelf_life || td.supplier_name || td.laboratory_name || hasRawData);
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
  if (hasRawData) subParts.push('Minerals');
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

      <div style={{ maxHeight: open ? 8000 : 0, overflow: 'hidden', transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
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
