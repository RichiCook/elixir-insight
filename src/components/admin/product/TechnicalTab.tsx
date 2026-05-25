import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProductTechnicalData } from '@/hooks/useProduct';
import { useApiForm } from '@/hooks/useApiForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const ALLERGENS = [
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
] as const;

const TECH_SECTIONS = [
  { title: 'Document Info', fields: ['document_type', 'document_revision', 'document_date', 'batch_number', 'label_date', 'application', 'recommended_dosage'] },
  { title: 'Nutrition per 100ml', fields: ['energy_kj', 'energy_kcal', 'fats', 'saturated_fats', 'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'sodium_mg'] },
  { title: 'Chemical & Physical', fields: ['ph', 'brix', 'total_acidity', 'alcoholic_strength', 'colour', 'microbiological_count'] },
  { title: 'Organoleptic Profile', fields: ['odor', 'appearance', 'taste_profile'] },
  { title: 'Storage & Shelf Life', fields: ['shelf_life', 'storage_conditions', 'storage_after_opening'] },
  { title: 'Declarations & Compliance', fields: ['gmo_declaration', 'ionising_radiation', 'compliance_references', 'compliance_regulation_1', 'compliance_regulation_2', 'compliance_regulation_3', 'additional_information'] },
  { title: 'Supplier', fields: ['supplier_name', 'supplier_address', 'supplier_phone', 'supplier_email', 'supplier_vat'] },
  { title: 'Laboratory', fields: ['laboratory_name', 'laboratory_address', 'test_report_number', 'accreditation_number'] },
];

const ALL_TEXT_FIELDS = TECH_SECTIONS.flatMap((s) => s.fields);

function RawDataSection({ raw }: { raw: Record<string, any> }) {
  if (!raw || typeof raw !== 'object') return null;
  const sections = Object.entries(raw).filter(([_, v]) => v && typeof v === 'object' && Object.keys(v).length > 0);
  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-admin font-semibold text-foreground">Extended Analytical Data (raw_analytical_data)</h3>
      {sections.map(([sectionKey, sectionData]) => (
        <div key={sectionKey} className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-admin font-semibold text-primary uppercase tracking-wider mb-3">
            {sectionKey.replace(/_/g, ' ')}
          </h4>
          {typeof sectionData === 'object' && !Array.isArray(sectionData) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(sectionData as Record<string, any>).map(([k, v]) => (
                <div key={k} className="rounded bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground capitalize mb-0.5">{k.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-foreground font-medium">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v || '—')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(sectionData, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

export function TechnicalTab({ productId }: { productId: string }) {
  const { data: techData } = useProductTechnicalData(productId);
  const queryClient = useQueryClient();
  const [flushing, setFlushing] = useState(false);

  const { form, setForm, set, saving, handleSave } = useApiForm<Record<string, any>>(
    techData ?? undefined,
    async (data) => {
      const payload: Record<string, any> = { product_id: productId };
      ALL_TEXT_FIELDS.forEach((k) => { payload[k] = data[k] || null; });
      ALLERGENS.forEach((a) => { payload[`allergen_${a}`] = !!data[`allergen_${a}`]; });
      if (data.raw_analytical_data) payload.raw_analytical_data = data.raw_analytical_data;
      if (techData?.id) payload.id = techData.id;

      const { error } = await supabase.from('product_technical_data').upsert(payload as any, { onConflict: 'product_id' });
      if (error) { toast.error('Failed to save'); return; }
      toast.success('Technical data saved');
      queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
    }
  );

  const handleFlush = async () => {
    if (!confirm('This will permanently delete all technical data and tech sheet upload records for this product. Continue?')) return;
    setFlushing(true);
    try {
      await supabase.from('product_technical_data').delete().eq('product_id', productId);
      await supabase.from('tech_sheet_uploads').delete().eq('product_id', productId);
      setForm({});
      toast.success('Technical data flushed');
      queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch {
      toast.error('Failed to flush data');
    }
    setFlushing(false);
  };

  return (
    <div className="space-y-6">
      {techData ? (
        <div className="rounded-lg bg-[#4a8c5c]/10 border border-[#4a8c5c]/20 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#5aac6c]">✓ Populated via AI Tech Sheet</p>
            {techData.document_type && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Type: {techData.document_type.replace(/_/g, ' ')}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-destructive text-[10px] hover:bg-destructive/10" onClick={handleFlush} disabled={flushing}>
            {flushing ? 'Flushing…' : '⟳ Flush Technical Data'}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-[#c09040]/10 border border-[#c09040]/20 p-3 flex items-center justify-between">
          <p className="text-xs text-[#c09040]">No technical data yet</p>
          <Link to="/admin/ai-upload" className="text-xs text-primary hover:underline">Upload Tech Sheet →</Link>
        </div>
      )}

      {TECH_SECTIONS.map((section) => {
        const hasValues = section.fields.some((k) => form[k]);
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-admin font-semibold text-foreground">{section.title}</h3>
              {hasValues && <span className="w-2 h-2 rounded-full bg-[#4a8c5c]" />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {section.fields.map((key) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground capitalize mb-1.5 block">{key.replace(/_/g, ' ')}</Label>
                  <Input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div>
        <h3 className="text-sm font-admin font-semibold text-foreground mb-3">Allergen Matrix</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALLERGENS.map((a) => (
            <div key={a} className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-xs text-foreground capitalize">{a}</Label>
              <Switch checked={!!form[`allergen_${a}`]} onCheckedChange={(v) => set(`allergen_${a}`, v)} />
            </div>
          ))}
        </div>
      </div>

      {form.raw_analytical_data && (
        <RawDataSection raw={form.raw_analytical_data as Record<string, any>} />
      )}

      <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
        {saving ? 'Saving…' : 'Save Technical Data'}
      </Button>
    </div>
  );
}
