import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import ExcelImport from '@/components/admin/ExcelImport';

// ── Constants ──────────────────────────────────────────────

const THINKING_MESSAGES = [
  'Reading document structure…',
  'Extracting ingredients…',
  'Processing nutritional data…',
  'Mapping allergen matrix…',
  'Analysis complete ✓',
];

type ExtractedData = Record<string, any>;

const ALLERGEN_KEYS = [
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

const SECTIONS = [
  { title: 'PRODUCT INFO', fields: ['product_name', 'product_version', 'application', 'recommended_dosage', 'recommended_dosage_disclaimer', 'main_flavour_components', 'limits_of_application', 'substances_annexes', 'maximum_dosage_note', 'additional_information'] },
  { title: 'INGREDIENT DECLARATION', fields: ['ingredient_list_full_en', 'ingredient_list_full_it'], textareas: ['ingredient_list_full_en', 'ingredient_list_full_it'] },
  { title: 'NUTRITIONAL VALUES', fields: ['energy_kcal', 'energy_kj', 'fats', 'saturated_fats', 'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt'] },
  { title: 'ORGANOLEPTIC & CHEMICAL', fields: ['odor', 'appearance', 'colour', 'taste_profile', 'ph', 'brix', 'microbiological_count', 'microbiological_unit'] },
  { title: 'ALLERGEN MATRIX', fields: [], isAllergenSection: true },
  { title: 'STORAGE', fields: ['shelf_life', 'storage_conditions', 'storage_after_opening'] },
  { title: 'DECLARATIONS', fields: ['gmo_declaration', 'ionising_radiation', 'compliance_regulation_1', 'compliance_regulation_2', 'compliance_regulation_3', 'compliance_references'] },
  { title: 'SUPPLIER', fields: ['supplier_name', 'supplier_address', 'supplier_phone', 'supplier_email', 'supplier_vat'] },
  { title: 'DOCUMENT', fields: ['document_revision', 'document_date'] },
];

// ── Sub-components ─────────────────────────────────────────

function SectionBlock({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: '#b8975a' }}>{title}</span>
        <ChevronDown size={14} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FieldCard({ label, value, onChange, isTextarea }: { label: string; value: any; onChange: (v: string) => void; isTextarea?: boolean }) {
  const isEmpty = value === null || value === '' || value === undefined;
  return (
    <div className={`rounded-lg border p-3 ${isEmpty ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
      <label className="font-mono text-[9px] uppercase tracking-[0.16em] block mb-1" style={{ color: '#b8975a' }}>
        {label.replace(/_/g, ' ')}
      </label>
      {isEmpty && !isTextarea ? (
        <Input value="" onChange={(e) => onChange(e.target.value)} placeholder="Not found in document" className="h-8 text-sm italic text-amber-600" />
      ) : isTextarea ? (
        <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className="text-sm min-h-[100px]" placeholder={isEmpty ? 'Not found in document — you can add manually' : ''} />
      ) : (
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function AdminAiUpload() {
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [productId, setProductId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData>({});
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedCompleteness, setAppliedCompleteness] = useState(0);
  const [uploadRecordId, setUploadRecordId] = useState<string | null>(null);

  const selectedProduct = products?.find((p) => p.id === productId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setExtracted(null);
      setApplied(false);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setExtracted(null);
      setApplied(false);
    } else {
      toast.error('Please drop a PDF file');
    }
  }, []);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  };

  const handleAnalyze = async () => {
    if (!productId || !file) {
      toast.error('Select a product and upload a PDF first');
      return;
    }
    setProcessing(true);
    setThinkingIdx(0);
    setApplied(false);

    const interval = setInterval(() => {
      setThinkingIdx((prev) => {
        if (prev >= THINKING_MESSAGES.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 2000);

    try {
      const text = await extractTextFromPdf(file);
      const storagePath = `${productId}/${file.name}`;
      await supabase.storage.from('tech-sheets').upload(storagePath, file, { upsert: true });

      const { data: uploadRecord } = await supabase.from('tech_sheet_uploads').insert({
        product_id: productId, filename: file.name, storage_path: storagePath, status: 'processing',
      }).select().single();

      setUploadRecordId(uploadRecord?.id || null);

      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-tech-sheet', {
        body: { text, product_name: selectedProduct?.name },
      });
      if (aiError) throw aiError;

      const extractedData = aiResult.data;
      setExtracted(extractedData);
      setEditedData({ ...extractedData });

      if (uploadRecord) {
        await supabase.from('tech_sheet_uploads').update({ status: 'analyzed', extracted_json: extractedData }).eq('id', uploadRecord.id);
      }

      clearInterval(interval);
      setThinkingIdx(THINKING_MESSAGES.length - 1);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      toast.error(err.message || 'Analysis failed');
    } finally {
      setProcessing(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setEditedData((d) => ({ ...d, [key]: value }));
  };

  const handleApply = async () => {
    if (!productId || !editedData) return;
    setApplying(true);
    try {
      const techPayload: Record<string, any> = { product_id: productId };
      const techTextFields = [
        'ph', 'brix', 'energy_kj', 'energy_kcal', 'fats', 'saturated_fats', 'trans_fats',
        'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'odor', 'appearance', 'colour',
        'taste_profile', 'shelf_life', 'storage_conditions', 'storage_after_opening',
        'gmo_declaration', 'ionising_radiation', 'compliance_references',
        'recommended_dosage', 'supplier_name', 'supplier_address', 'supplier_phone',
        'supplier_email', 'supplier_vat', 'document_revision', 'document_date',
      ];
      techTextFields.forEach((k) => { techPayload[k] = editedData[k] || null; });

      if (editedData.microbiological_count || editedData.microbiological_unit) {
        techPayload.microbiological_count = [editedData.microbiological_count, editedData.microbiological_unit].filter(Boolean).join(' ');
      }

      ALLERGEN_KEYS.forEach(({ key }) => { techPayload[key] = !!editedData[key]; });

      const { error: techError } = await supabase.from('product_technical_data').upsert(techPayload, { onConflict: 'product_id' });
      if (techError) throw techError;

      if (editedData.ingredient_list_full_en) {
        const { data: existingEn } = await supabase.from('product_translations').select('id').eq('product_id', productId).eq('language', 'EN').maybeSingle();
        if (existingEn) {
          await supabase.from('product_translations').update({ ingredient_list_full: editedData.ingredient_list_full_en }).eq('id', existingEn.id);
        } else {
          await supabase.from('product_translations').insert({ product_id: productId, language: 'EN', ingredient_list_full: editedData.ingredient_list_full_en });
        }
      }

      if (editedData.ingredient_list_full_it) {
        const { data: existingIt } = await supabase.from('product_translations').select('id').eq('product_id', productId).eq('language', 'IT').maybeSingle();
        if (existingIt) {
          await supabase.from('product_translations').update({ ingredient_list_full: editedData.ingredient_list_full_it }).eq('id', existingIt.id);
        } else {
          await supabase.from('product_translations').insert({ product_id: productId, language: 'IT', ingredient_list_full: editedData.ingredient_list_full_it });
        }
      }

      if (uploadRecordId) {
        await supabase.from('tech_sheet_uploads').update({ status: 'complete', applied_at: new Date().toISOString(), extracted_json: editedData }).eq('id', uploadRecordId);
      }

      const completenessFields = ['ph', 'energy_kcal', 'fats', 'carbohydrates', 'proteins', 'salt', 'odor', 'shelf_life', 'storage_conditions', 'gmo_declaration'];
      let filled = 0;
      const total = completenessFields.length + 2;
      completenessFields.forEach((f) => { if (editedData[f]) filled++; });
      const hasAllergens = ALLERGEN_KEYS.some(({ key }) => editedData[key] !== undefined && editedData[key] !== null);
      if (hasAllergens) filled++;
      if (editedData.ingredient_list_full_en) filled++;
      const completeness = Math.round((filled / total) * 100);

      await supabase.from('products').update({ completeness }).eq('id', productId);
      setAppliedCompleteness(completeness);

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-translations', productId] });

      setApplied(true);
      toast.success('All data applied successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply data');
    } finally {
      setApplying(false);
    }
  };

  const handleDiscard = () => {
    setExtracted(null);
    setEditedData({});
    setApplied(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Data Import</h1>
          <p className="text-xs text-muted-foreground">Import product data from PDFs or Excel spreadsheets</p>
        </div>
        <Link to="/admin"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="pdf" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="pdf" className="flex-1">PDF Tech Sheet</TabsTrigger>
            <TabsTrigger value="excel" className="flex-1">Excel Spreadsheet</TabsTrigger>
          </TabsList>

          {/* ── PDF Tab ── */}
          <TabsContent value="pdf" className="space-y-6">
            {/* Step 1: Product select */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground mb-3">Step 1 — Select Product</p>
              <Select value={productId} onValueChange={(v) => { setProductId(v); setExtracted(null); setApplied(false); }}>
                <SelectTrigger><SelectValue placeholder="Choose a product…" /></SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.line})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Upload PDF */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground mb-3">Step 2 — Upload PDF</p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
                style={{ backgroundColor: 'rgba(184,151,90,0.05)' }}
              >
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div>
                    <p className="text-sm text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Drop a supplier PDF tech sheet here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">.pdf files only</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analyze button */}
            {!extracted && (
              <Button
                onClick={handleAnalyze}
                disabled={!productId || !file || processing}
                className="w-full py-5 text-sm font-medium"
                style={{ background: processing ? '#333' : 'linear-gradient(135deg, #4a7cc0, #4a8c5c)', color: 'white' }}
              >
                {processing ? THINKING_MESSAGES[thinkingIdx] : 'Analyse with AI'}
              </Button>
            )}

            {/* Review Panel */}
            {extracted && !applied && (
              <div className="space-y-4">
                <div className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: '#1a3a2a', border: '1px solid #2a5a3a' }}>
                  <div>
                    <p className="text-sm font-medium text-green-400">✓ Analysis Complete — {file?.name}</p>
                    <p className="text-xs text-green-400/70 mt-0.5">
                      {editedData.document_revision && `Revision ${editedData.document_revision}`}
                      {editedData.document_date && ` · ${editedData.document_date}`}
                      {editedData.supplier_name && ` · ${editedData.supplier_name}`}
                    </p>
                  </div>
                </div>

                {SECTIONS.map((section) => (
                  <div key={section.title} className="rounded-lg border border-border bg-card p-4">
                    <SectionBlock title={section.title}>
                      {section.isAllergenSection ? (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {ALLERGEN_KEYS.map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between rounded-lg border border-border p-2">
                              <div className="flex items-center gap-2">
                                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: editedData[key] ? '#a04040' : '#4a8c5c' }} />
                                <span className="text-xs text-foreground">{label}</span>
                              </div>
                              <Switch checked={!!editedData[key]} onCheckedChange={(v) => updateField(key, v)} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {section.fields.map((key) => (
                            <FieldCard
                              key={key}
                              label={key}
                              value={editedData[key]}
                              onChange={(v) => updateField(key, v)}
                              isTextarea={section.textareas?.includes(key)}
                            />
                          ))}
                        </div>
                      )}
                    </SectionBlock>
                  </div>
                ))}

                <Button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full py-6 text-sm font-medium"
                  style={{ background: 'linear-gradient(135deg, #b8975a, #d4af6e)', color: '#1a1a1a' }}
                >
                  {applying ? 'Saving to database…' : '✓ Apply All to Product'}
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleAnalyze} disabled={processing} className="flex-1">Re-analyse</Button>
                  <Button variant="outline" onClick={handleDiscard} className="flex-1">Discard</Button>
                </div>
              </div>
            )}

            {/* Applied success state */}
            {applied && (
              <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#1a3a2a', border: '1px solid #2a5a3a' }}>
                <p className="text-lg font-medium text-green-400">🎉 All data applied to {selectedProduct?.name}</p>
                <p className="text-sm text-green-400/70 mt-1">Completeness updated to {appliedCompleteness}%</p>
                <Button variant="outline" className="mt-4" onClick={() => { setExtracted(null); setEditedData({}); setFile(null); setApplied(false); }}>
                  Upload another sheet
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Excel Tab ── */}
          <TabsContent value="excel">
            <ExcelImport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
