import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { parseExcelFile, type ParsedProduct } from '@/lib/excelParser';

// ── Types ──────────────────────────────────────────────────

type ExtractedData = Record<string, any>;

type ExcelProductStatus = 'waiting' | 'processing' | 'done' | 'warning' | 'error';

interface ExcelProgress {
  name: string;
  slug: string;
  status: ExcelProductStatus;
  fieldsCount: number;
  languages: string[];
  eanCount: number;
  hasNutrition: boolean;
  warnings: string[];
  error?: string;
}

// ── Constants ──────────────────────────────────────────────

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

const TECH_SHEET_SECTIONS = [
  { title: 'PRODUCT INFO', fields: ['product_name', 'product_version', 'application', 'recommended_dosage', 'main_flavour_components'] },
  { title: 'INGREDIENT DECLARATION', fields: ['ingredient_list_full_en', 'ingredient_list_full_it'], textareas: ['ingredient_list_full_en', 'ingredient_list_full_it'] },
  { title: 'NUTRITIONAL VALUES PER 100ML', fields: ['energy_kcal', 'energy_kj', 'fats', 'saturated_fats', 'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt'], isNutriTable: true },
  { title: 'ORGANOLEPTIC & CHEMICAL', fields: ['odor', 'appearance', 'colour', 'taste_profile', 'ph', 'brix', 'microbiological_count'] },
  { title: 'ALLERGEN MATRIX', fields: [], isAllergenSection: true },
  { title: 'STORAGE', fields: ['shelf_life', 'storage_conditions', 'storage_after_opening'] },
  { title: 'DECLARATIONS', fields: ['gmo_declaration', 'ionising_radiation', 'additional_information', 'compliance_references'] },
  { title: 'SUPPLIER', fields: ['supplier_name', 'supplier_address', 'supplier_vat', 'supplier_phone', 'supplier_email'] },
  { title: 'DOCUMENT', fields: ['document_revision', 'document_date'] },
];

const LAB_REPORT_SECTIONS = [
  { title: 'TEST REPORT', fields: ['test_report_number', 'document_date', 'document_revision', 'batch_number', 'label_date', 'accreditation_number'] },
  { title: 'PRODUCT', fields: ['product_name', 'alcoholic_strength'] },
  { title: 'NUTRITIONAL VALUES PER 100ML (EU REG 1169/2011)', fields: ['energy_kcal', 'energy_kj', 'fats', 'saturated_fats', 'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'sodium_mg'], isNutriTable: true },
  { title: 'CHEMICAL ANALYSIS', fields: ['total_acidity', 'alcoholic_strength'] },
  { title: 'ALLERGEN INFO', fields: [], isLabAllergenSection: true },
  { title: 'COMPLIANCE REFERENCES', fields: ['compliance_regulation_1', 'compliance_regulation_2', 'compliance_regulation_3', 'compliance_references'] },
  { title: 'ISSUING LABORATORY', fields: ['laboratory_name', 'laboratory_address', 'accreditation_number'] },
  { title: 'CLIENT / SUPPLIER', fields: ['supplier_name', 'supplier_address', 'supplier_vat', 'supplier_phone', 'supplier_email'] },
  { title: 'DOCUMENT', fields: ['document_revision', 'document_date', 'batch_number', 'label_date'] },
];

const THINKING_TECH_SHEET = [
  'Reading document structure…',
  'Detecting document type…',
  'Locating ingredient declarations…',
  'Processing allergen matrix…',
  'Extracting organoleptic profile…',
  'Mapping storage and compliance…',
  'Analysis complete ✓',
];

const THINKING_LAB_REPORT = [
  'Reading document structure…',
  'Detecting document type…',
  'Reading analytical results table…',
  'Extracting nutritional values per 100ml…',
  'Checking sulphite levels…',
  'Mapping compliance references…',
  'Analysis complete ✓',
];

const HIDE_IF_NULL_BY_DOC_TYPE: Record<string, string[]> = {
  LABORATORY_TEST_REPORT: ['supplier_vat', 'supplier_phone', 'supplier_email'],
  SUPPLIER_TECH_SHEET: ['laboratory_name', 'laboratory_address', 'test_report_number'],
};

const isEmptyValue = (value: unknown) => value === null || value === '' || value === undefined;

const shouldHideNullField = (field: string, value: unknown, documentType: string | null) => {
  if (!documentType || !isEmptyValue(value)) return false;
  return HIDE_IF_NULL_BY_DOC_TYPE[documentType]?.includes(field) ?? false;
};

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
      {isTextarea ? (
        <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className="text-sm min-h-[100px]" placeholder={isEmpty ? 'Not found in document' : ''} />
      ) : (
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" placeholder={isEmpty ? 'Not found in document' : ''} />
      )}
    </div>
  );
}

// ── Excel Tab ──────────────────────────────────────────────

function ExcelTab() {
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ExcelProgress[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f); setCompleted(false); setProgress([]);
    } else toast.error('Please select an Excel file (.xlsx or .xls)');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f); setCompleted(false); setProgress([]);
    } else toast.error('Please drop an Excel file (.xlsx or .xls)');
  }, []);

  const updateStatus = (slug: string, update: Partial<ExcelProgress>) => {
    setProgress(prev => prev.map(p => p.slug === slug ? { ...p, ...update } : p));
  };

  const handleImport = async () => {
    if (!file || !products) return;
    setProcessing(true); setCompleted(false);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);
      if (parsed.length === 0) { toast.error('No recognized product sheets found'); setProcessing(false); return; }

      setProgress(parsed.map(p => ({
        name: p.sheetName, slug: p.slug, status: 'waiting' as const,
        fieldsCount: 0, languages: [], eanCount: 0, hasNutrition: false, warnings: p.warnings,
      })));

      for (const pp of parsed) {
        updateStatus(pp.slug, { status: 'processing' });
        await new Promise(r => setTimeout(r, 50));

        try {
          // Find or create product
          let dbProduct = products.find(p => p.slug === pp.slug);
          if (!dbProduct) {
            const insertData: any = {
              slug: pp.slug,
              name: pp.sheetName,
              line: pp.productFields.line || 'Classy Cocktails',
              abv: pp.productFields.abv || '0',
              completeness: 0,
            };
            ['spirit', 'garnish', 'liquid_color', 'serving', 'flavour', 'glass', 'ice', 'food_pairing', 'occasion', 'uk_units', 'allergens_summary', 'product_link'].forEach(k => {
              if (pp.productFields[k]) insertData[k] = pp.productFields[k];
            });
            const { data: newP, error } = await supabase.from('products').insert(insertData).select().single();
            if (error) throw error;
            dbProduct = newP;
          }

          let fieldsCount = 0;
          const langs: string[] = [];
          let eanCount = 0;

          // Update products table (only non-null)
          const prodUpdate: Record<string, any> = {};
          for (const [key, val] of Object.entries(pp.productFields)) {
            if (val !== null && key !== 'shelf_life_note') { prodUpdate[key] = val; fieldsCount++; }
          }
          if (Object.keys(prodUpdate).length > 0) {
            await supabase.from('products').update(prodUpdate).eq('id', dbProduct!.id);
          }

          // Upsert technical data (nutritional only)
          if (pp.nutriFields) {
            const techPayload: Record<string, any> = { product_id: dbProduct!.id, ...pp.nutriFields };
            if (pp.allergenSulphites) techPayload.allergen_sulphites = true;
            await supabase.from('product_technical_data').upsert(techPayload, { onConflict: 'product_id' });
            fieldsCount += Object.keys(pp.nutriFields).length;
          } else if (pp.allergenSulphites) {
            await supabase.from('product_technical_data').upsert(
              { product_id: dbProduct!.id, allergen_sulphites: true },
              { onConflict: 'product_id' }
            );
          }

          // Upsert translations
          for (const [lang, fields] of Object.entries(pp.translations)) {
            const nonNull = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
            if (Object.keys(nonNull).length === 0) continue;
            await supabase.from('product_translations').upsert(
              { product_id: dbProduct!.id, language: lang, ...nonNull },
              { onConflict: 'product_id,language' }
            );
            langs.push(lang);
            fieldsCount += Object.keys(nonNull).length;
          }

          // Upsert EAN codes
          for (const [market, eans] of Object.entries(pp.eanCodes)) {
            const nonNull = Object.fromEntries(Object.entries(eans).filter(([, v]) => v));
            if (Object.keys(nonNull).length === 0) continue;
            await supabase.from('product_ean_codes').upsert(
              { product_id: dbProduct!.id, market, ...nonNull },
              { onConflict: 'product_id,market' }
            );
            eanCount++;
          }

          // Recalculate completeness
          let score = 0;
          ['line', 'spirit', 'abv', 'garnish', 'glass', 'flavour', 'food_pairing'].forEach(f => {
            if (pp.productFields[f]) score++;
          });
          if (pp.translations['EN']?.claim) score++;
          if (pp.translations['EN']?.ingredient_list_full) score++;
          if (pp.eanCodes['INT']?.ean_cocktail) score++;
          const completeness = Math.round((score / 10) * 100);
          await supabase.from('products').update({ completeness }).eq('id', dbProduct!.id);

          updateStatus(pp.slug, {
            status: pp.warnings.length > 0 ? 'warning' : 'done',
            fieldsCount, languages: langs, eanCount,
            hasNutrition: pp.hasNutrition, warnings: pp.warnings,
          });
        } catch (err: any) {
          updateStatus(pp.slug, { status: 'error', error: err.message });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setCompleted(true);
      toast.success('Excel import complete');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse Excel file');
    } finally {
      setProcessing(false);
    }
  };

  const doneCount = progress.filter(p => ['done', 'warning', 'error'].includes(p.status)).length;
  const totalCount = progress.length;

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
          style={{ backgroundColor: 'rgba(184,151,90,0.05)' }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Drop the Classy Cocktails product spreadsheet here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">One file imports all 14 products simultaneously</p>
            </div>
          )}
        </div>
      </div>

      {file && !completed && (
        <Button
          onClick={handleImport} disabled={processing}
          className="w-full h-[50px] text-sm font-medium"
          style={{ background: processing ? '#333' : '#b8975a', color: 'white' }}
        >
          {processing ? `Importing… ${doneCount}/${totalCount}` : '⬡ Import from Excel'}
        </Button>
      )}

      {/* Processing progress */}
      {progress.length > 0 && !completed && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{doneCount} / {totalCount} products complete</span>
          </div>
          <Progress value={totalCount > 0 ? (doneCount / totalCount) * 100 : 0} className="h-2" />
          <div className="space-y-1 mt-3 max-h-[400px] overflow-y-auto">
            {progress.map(p => (
              <div key={p.slug} className="flex items-center justify-between text-sm py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <span className="flex items-center gap-2">
                  <span>{p.status === 'done' ? '✓' : p.status === 'warning' ? '⚠' : p.status === 'error' ? '✗' : p.status === 'processing' ? '⟳' : '○'}</span>
                  <span className="text-foreground">{p.name}</span>
                </span>
                <span className={`text-xs ${p.status === 'done' ? 'text-green-400' : p.status === 'warning' ? 'text-amber-400' : p.status === 'error' ? 'text-red-400' : p.status === 'processing' ? 'text-blue-400' : 'text-muted-foreground'}`}>
                  {p.status === 'done' && `${p.fieldsCount} fields · ${p.languages.join('/')} · ${p.eanCount} EAN · nutrition ✓`}
                  {p.status === 'warning' && p.warnings[0]}
                  {p.status === 'error' && p.error}
                  {p.status === 'processing' && 'Processing…'}
                  {p.status === 'waiting' && 'Waiting'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion summary */}
      {completed && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: '#1a3a2a', border: '1px solid #2a5a3a' }}>
            <p className="text-lg font-medium text-green-400 text-center">✓ Import Complete</p>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="text-center px-2 py-2 text-xs font-mono uppercase text-muted-foreground">Fields</th>
                  <th className="text-center px-2 py-2 text-xs font-mono uppercase text-muted-foreground">Languages</th>
                  <th className="text-center px-2 py-2 text-xs font-mono uppercase text-muted-foreground">EAN</th>
                  <th className="text-center px-2 py-2 text-xs font-mono uppercase text-muted-foreground">Nutrition</th>
                  <th className="text-center px-2 py-2 text-xs font-mono uppercase text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map(p => (
                  <tr key={p.slug} className="border-b border-border/50">
                    <td className="px-3 py-2 text-foreground">{p.name}</td>
                    <td className="px-2 py-2 text-center text-muted-foreground">{p.fieldsCount}</td>
                    <td className="px-2 py-2 text-center text-muted-foreground">{p.languages.join('/')}</td>
                    <td className="px-2 py-2 text-center text-muted-foreground">{p.eanCount}</td>
                    <td className="px-2 py-2 text-center">{p.hasNutrition ? <span className="text-green-400">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-2 py-2 text-center">
                      {p.status === 'done' && <span className="text-green-400">✓</span>}
                      {p.status === 'warning' && <span className="text-amber-400" title={p.warnings.join(', ')}>⚠</span>}
                      {p.status === 'error' && <span className="text-red-400" title={p.error}>✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/admin"><Button variant="outline" className="w-full">View All Products</Button></Link>
        </div>
      )}
    </div>
  );
}

// ── PDF Tab ────────────────────────────────────────────────

function PdfTab() {
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [productId, setProductId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [docType, setDocType] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData>({});
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedCompleteness, setAppliedCompleteness] = useState(0);
  const [uploadRecordId, setUploadRecordId] = useState<string | null>(null);

  const selectedProduct = products?.find(p => p.id === productId);
  const thinkingMessages = docType === 'LABORATORY_TEST_REPORT' ? THINKING_LAB_REPORT : THINKING_TECH_SHEET;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === 'application/pdf') { setFile(f); setExtracted(null); setApplied(false); setDocType(null); }
    else toast.error('Please select a PDF file');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type === 'application/pdf') { setFile(f); setExtracted(null); setApplied(false); setDocType(null); }
    else toast.error('Please drop a PDF file');
  }, []);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const Y_TOLERANCE = 3;
    const CELL_GAP_THRESHOLD = 9;
    const COLUMN_ASSIGN_TOLERANCE = 36;
    const TABLE_HEADER_KEYWORDS = ['parameter', 'method', 'u.m', 'result', 'uncertainty', 'loq', 'limiti', 'ref.limit'];

    type PositionedItem = { str: string; x: number; y: number; width: number };

    const normalizeCellText = (value: string) =>
      value
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:)\]])/g, '$1')
        .replace(/([([])\s+/g, '$1')
        .trim();

    const mergeRowIntoCells = (items: PositionedItem[]) => {
      const sorted = [...items].sort((a, b) => a.x - b.x);
      const cells: Array<{ text: string; x: number; center: number }> = [];
      let current: { tokens: string[]; x: number; endX: number } | null = null;

      for (const item of sorted) {
        const token = item.str.trim();
        if (!token) continue;

        if (!current) {
          current = { tokens: [token], x: item.x, endX: item.x + item.width };
          continue;
        }

        const gap = item.x - current.endX;
        if (gap > CELL_GAP_THRESHOLD) {
          const text = normalizeCellText(current.tokens.join(' '));
          if (text) {
            cells.push({ text, x: current.x, center: current.x + (current.endX - current.x) / 2 });
          }
          current = { tokens: [token], x: item.x, endX: item.x + item.width };
        } else {
          current.tokens.push(token);
          current.endX = Math.max(current.endX, item.x + item.width);
        }
      }

      if (current) {
        const text = normalizeCellText(current.tokens.join(' '));
        if (text) {
          cells.push({ text, x: current.x, center: current.x + (current.endX - current.x) / 2 });
        }
      }

      return cells;
    };

    const isTableHeader = (cells: Array<{ text: string }>) => {
      const rowText = cells.map((c) => c.text.toLowerCase()).join(' ');
      const matches = TABLE_HEADER_KEYWORDS.filter((keyword) => rowText.includes(keyword)).length;
      return matches >= 2;
    };

    const alignCellsToAnchors = (cells: Array<{ text: string; center: number }>, anchors: number[]) => {
      const buckets: string[][] = Array.from({ length: anchors.length }, () => []);

      for (const cell of cells) {
        let bestIndex = 0;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let i = 0; i < anchors.length; i++) {
          const distance = Math.abs(cell.center - anchors[i]);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i;
          }
        }

        if (bestDistance <= COLUMN_ASSIGN_TOLERANCE || anchors.length <= 3) {
          buckets[bestIndex].push(cell.text);
        }
      }

      const aligned = buckets.map((bucket) => normalizeCellText(bucket.join(' '))).filter(Boolean);
      return aligned;
    };

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const positionedItems: PositionedItem[] = [];

      for (const item of content.items as any[]) {
        const token = item.str?.trim();
        if (!token) continue;

        const x = Number(item.transform?.[4] ?? 0);
        const y = Number(item.transform?.[5] ?? 0);
        const width = Number(item.width ?? token.length * 4.8);
        positionedItems.push({ str: token, x, y, width });
      }

      const rows: Array<{ y: number; items: PositionedItem[] }> = [];
      for (const item of positionedItems) {
        const existing = rows.find((row) => Math.abs(row.y - item.y) <= Y_TOLERANCE);
        if (existing) {
          existing.items.push(item);
        } else {
          rows.push({ y: item.y, items: [item] });
        }
      }

      const sortedRows = rows
        .sort((a, b) => b.y - a.y)
        .map((row) => ({ ...row, items: row.items.sort((a, b) => a.x - b.x) }));

      let tableAnchors: number[] | null = null;
      let sparseTableRows = 0;

      for (const row of sortedRows) {
        const cells = mergeRowIntoCells(row.items);
        if (cells.length === 0) continue;

        if (isTableHeader(cells)) {
          tableAnchors = cells.map((cell) => cell.center);
          sparseTableRows = 0;
          fullText += cells.map((cell) => cell.text).join('\t') + '\n';
          continue;
        }

        if (tableAnchors && cells.length >= 2) {
          const aligned = alignCellsToAnchors(cells, tableAnchors);
          if (aligned.length >= 2) {
            fullText += aligned.join('\t') + '\n';
            sparseTableRows = 0;
            continue;
          }
        }

        if (cells.length >= 3) {
          fullText += cells.map((cell) => cell.text).join('\t') + '\n';
          sparseTableRows = 0;
        } else {
          fullText += cells.map((cell) => cell.text).join(' ') + '\n';
          if (tableAnchors) {
            sparseTableRows += 1;
            if (sparseTableRows >= 4) tableAnchors = null;
          }
        }
      }

      fullText += '\n--- PAGE BREAK ---\n';
    }

    return fullText;
  };

  const handleAnalyze = async () => {
    if (!productId || !file) { toast.error('Select a product and upload a PDF first'); return; }
    setProcessing(true); setThinkingIdx(0); setApplied(false); setDocType(null);

    const interval = setInterval(() => {
      setThinkingIdx(prev => {
        if (prev >= thinkingMessages.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 600);

    try {
      const text = await extractTextFromPdf(file);
      const storagePath = `${productId}/${Date.now()}-${file.name}`;
      await supabase.storage.from('tech-sheets').upload(storagePath, file, { upsert: true });

      const { data: uploadRecord } = await supabase.from('tech_sheet_uploads').insert({
        product_id: productId, filename: file.name, storage_path: storagePath, status: 'processing',
      }).select().single();
      setUploadRecordId(uploadRecord?.id || null);

      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-tech-sheet', {
        body: { text, product_name: selectedProduct?.name, filename: file.name, product_id: productId },
      });
      if (aiError) throw aiError;

      const extractedData = aiResult.data;
      setExtracted(extractedData);
      setEditedData({ ...extractedData });
      setDocType(extractedData.document_type || 'SUPPLIER_TECH_SHEET');

      if (uploadRecord) {
        await supabase.from('tech_sheet_uploads').update({ status: 'analyzed', extracted_json: extractedData }).eq('id', uploadRecord.id);
      }

      clearInterval(interval);
      setThinkingIdx(thinkingMessages.length - 1);
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.message || 'Analysis failed');
    } finally {
      setProcessing(false);
    }
  };

  const updateField = (key: string, value: any) => setEditedData(d => ({ ...d, [key]: value }));

  const handleApply = async () => {
    if (!productId || !editedData) return;
    setApplying(true);
    try {
      // Build tech payload
      const techPayload: Record<string, any> = { product_id: productId };
      const allTechFields = [
        'document_type', 'document_date', 'document_revision', 'batch_number', 'label_date',
        'application', 'recommended_dosage', 'energy_kcal', 'energy_kj', 'fats', 'saturated_fats',
        'trans_fats', 'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'sodium_mg',
        'ph', 'brix', 'total_acidity', 'alcoholic_strength', 'microbiological_count',
        'odor', 'appearance', 'colour', 'taste_profile',
        'gmo_declaration', 'ionising_radiation', 'additional_information',
        'shelf_life', 'storage_conditions', 'storage_after_opening',
        'compliance_references', 'compliance_regulation_1', 'compliance_regulation_2', 'compliance_regulation_3',
        'supplier_name', 'supplier_address', 'supplier_vat', 'supplier_phone', 'supplier_email',
        'laboratory_name', 'laboratory_address', 'test_report_number', 'accreditation_number',
      ];
      allTechFields.forEach(k => { if (editedData[k] !== undefined) techPayload[k] = editedData[k] || null; });
      ALLERGEN_KEYS.forEach(({ key }) => { techPayload[key] = !!editedData[key]; });

      const { error: techError } = await supabase.from('product_technical_data').upsert(techPayload, { onConflict: 'product_id' });
      if (techError) throw techError;

      // Write ingredient translations (tech sheet only)
      if (editedData.document_type !== 'LABORATORY_TEST_REPORT') {
        if (editedData.ingredient_list_full_en) {
          await supabase.from('product_translations').upsert(
            { product_id: productId, language: 'EN', ingredient_list_full: editedData.ingredient_list_full_en },
            { onConflict: 'product_id,language' }
          );
        }
        if (editedData.ingredient_list_full_it) {
          await supabase.from('product_translations').upsert(
            { product_id: productId, language: 'IT', ingredient_list_full: editedData.ingredient_list_full_it },
            { onConflict: 'product_id,language' }
          );
        }
      }

      // Update upload record
      if (uploadRecordId) {
        await supabase.from('tech_sheet_uploads').update({
          status: 'complete', applied_at: new Date().toISOString(), extracted_json: editedData,
        }).eq('id', uploadRecordId);
      }

      // Recalculate completeness
      const { data: enTrans } = await supabase.from('product_translations').select('claim, ingredient_list_full').eq('product_id', productId).eq('language', 'EN').maybeSingle();
      const { data: intEan } = await supabase.from('product_ean_codes').select('ean_cocktail').eq('product_id', productId).eq('market', 'INT').maybeSingle();
      const prod = selectedProduct;
      let score = 0;
      if (prod?.line) score++;
      if (prod?.spirit) score++;
      if (prod?.abv) score++;
      if (prod?.garnish) score++;
      if (prod?.glass) score++;
      if (prod?.flavour) score++;
      if (prod?.food_pairing) score++;
      if (enTrans?.claim) score++;
      if (enTrans?.ingredient_list_full || editedData.ingredient_list_full_en) score++;
      if (intEan?.ean_cocktail) score++;
      if (editedData.energy_kcal) score++;
      if (ALLERGEN_KEYS.some(({ key }) => editedData[key] !== undefined)) score++;
      const completeness = Math.round((score / 12) * 100);
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

  const sections = docType === 'LABORATORY_TEST_REPORT' ? LAB_REPORT_SECTIONS : TECH_SHEET_SECTIONS;

  return (
    <div className="space-y-6">
      {/* Step 1: Select product */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Step 1 — Select Product</p>
        <Select value={productId} onValueChange={v => { setProductId(v); setExtracted(null); setApplied(false); setDocType(null); }}>
          <SelectTrigger><SelectValue placeholder="Choose a product…" /></SelectTrigger>
          <SelectContent>
            {products?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.line})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Upload PDF */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Step 2 — Upload PDF</p>
        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
          style={{ backgroundColor: 'rgba(184,151,90,0.05)' }}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Drop a supplier tech sheet or laboratory test report (PDF) here</p>
              <p className="text-xs text-muted-foreground mt-1">Both UICo-style ingredient sheets and Unione Italiana Vini lab reports are supported</p>
            </div>
          )}
        </div>
      </div>

      {/* Analyze button */}
      {!extracted && !applied && (
        <Button
          onClick={handleAnalyze} disabled={!productId || !file || processing}
          className="w-full h-[50px] text-sm font-medium"
          style={{ background: processing ? '#333' : 'linear-gradient(135deg, #4a7cc0, #4a8c5c)', color: 'white' }}
        >
          {processing ? thinkingMessages[thinkingIdx] : '⬡ Analyse with AI'}
        </Button>
      )}

      {/* Review panel */}
      {extracted && !applied && (
        <div className="space-y-4">
          {/* Success banner */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#1a3a2a', border: '1px solid #2a5a3a' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium text-green-400">✓ Analysis Complete — {file?.name}</p>
                <p className="text-xs text-green-400/70 mt-0.5">
                  {editedData.document_revision && `${editedData.test_report_number || editedData.document_revision}`}
                  {editedData.document_date && ` · ${editedData.document_date}`}
                  {editedData.supplier_name && ` · ${editedData.supplier_name}`}
                </p>
              </div>
              {docType === 'LABORATORY_TEST_REPORT' ? (
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">🔬 Laboratory Test Report — Rapporto di Prova</Badge>
              ) : (
                <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">📋 Supplier Technical Data Sheet</Badge>
              )}
            </div>
          </div>

          {/* Section cards */}
          {sections.map(section => (
            <div key={section.title} className="rounded-lg border border-border bg-card p-4">
              <SectionBlock title={section.title}>
                {(section as any).isAllergenSection ? (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {ALLERGEN_KEYS.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <span className="text-sm text-foreground">{label}</span>
                        <Switch checked={!!editedData[key]} onCheckedChange={c => updateField(key, c)} />
                      </div>
                    ))}
                  </div>
                ) : (section as any).isLabAllergenSection ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-sm text-foreground">Sulphites (SO₂)</span>
                      <Switch checked={!!editedData.allergen_sulphites} onCheckedChange={c => updateField('allergen_sulphites', c)} />
                    </div>
                    <p className="text-xs text-muted-foreground italic">Allergen matrix not typically included in lab reports. Sulphites detected from SO₂ measurement above.</p>
                  </div>
                ) : (section as any).isNutriTable ? (
                  <div className="mt-3 space-y-1">
                    {section.fields.map(f => (
                      <div key={f} className="flex items-center justify-between py-1">
                        <span className="text-xs text-muted-foreground uppercase">{f.replace(/_/g, ' ')}</span>
                        <Input
                          value={editedData[f] || ''} onChange={e => updateField(f, e.target.value)}
                          className="w-24 h-7 text-xs text-right"
                          placeholder="—"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="grid gap-3 mt-3"
                    style={{
                      gridTemplateColumns:
                        section.fields.filter((f) => !shouldHideNullField(f, editedData[f], docType)).length <= 2
                          ? '1fr'
                          : 'repeat(auto-fit, minmax(200px, 1fr))',
                    }}
                  >
                    {section.fields
                      .filter((f) => !shouldHideNullField(f, editedData[f], docType))
                      .map(f => (
                      <FieldCard
                        key={f} label={f} value={editedData[f]}
                        onChange={v => updateField(f, v)}
                        isTextarea={(section as any).textareas?.includes(f)}
                      />
                    ))}
                  </div>
                )}
              </SectionBlock>
            </div>
          ))}

          {/* Apply buttons */}
          <div className="flex gap-3">
            <Button onClick={handleApply} disabled={applying} className="flex-1 h-[50px]" style={{ background: '#1a5a2a', color: 'white' }}>
              {applying ? 'Applying…' : '✓ Apply All to Product'}
            </Button>
            <Button variant="outline" onClick={() => { setExtracted(null); setEditedData({}); setDocType(null); }} className="flex-shrink-0">
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Applied success */}
      {applied && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: '#1a3a2a', border: '1px solid #2a5a3a' }}>
            <p className="text-sm font-medium text-green-400 text-center">
              ✓ All data applied to {selectedProduct?.name} · Completeness updated to {appliedCompleteness}%
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`/admin/product/${selectedProduct?.slug}`} className="flex-1">
              <Button variant="outline" className="w-full">View Product</Button>
            </Link>
            <Button variant="outline" className="flex-1" onClick={() => {
              setFile(null); setExtracted(null); setEditedData({}); setApplied(false); setDocType(null);
            }}>
              Upload Another Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function AdminAiUpload() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[28px] font-light text-foreground">Data Import</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload a product Excel spreadsheet or a supplier PDF to extract and import product data</p>
        </div>
        <Link to="/admin"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="excel" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="excel" className="flex-1">⊞ Excel Spreadsheet</TabsTrigger>
            <TabsTrigger value="pdf" className="flex-1">🔬 PDF Tech Sheet / Lab Report</TabsTrigger>
          </TabsList>

          <TabsContent value="excel"><ExcelTab /></TabsContent>
          <TabsContent value="pdf"><PdfTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
