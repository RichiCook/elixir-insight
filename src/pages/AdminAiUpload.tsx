import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const THINKING_MESSAGES = [
  'Reading document structure…',
  'Extracting ingredients…',
  'Processing nutritional data…',
  'Mapping allergen matrix…',
  'Analysis complete ✓',
];

type ExtractedData = Record<string, any>;

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

  const selectedProduct = products?.find((p) => p.id === productId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setExtracted(null);
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
    } else {
      toast.error('Please drop a PDF file');
    }
  }, []);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

    // Animate thinking messages
    const interval = setInterval(() => {
      setThinkingIdx((prev) => {
        if (prev >= THINKING_MESSAGES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    try {
      // Step 1: Extract text
      const text = await extractTextFromPdf(file);

      // Step 2: Upload to storage
      const storagePath = `${productId}/${file.name}`;
      await supabase.storage.from('tech-sheets').upload(storagePath, file, { upsert: true });

      // Step 3: Create upload record
      const { data: uploadRecord } = await supabase.from('tech_sheet_uploads').insert({
        product_id: productId,
        filename: file.name,
        storage_path: storagePath,
        status: 'processing',
      }).select().single();

      // Step 4: Call AI edge function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-tech-sheet', {
        body: { text, product_name: selectedProduct?.name },
      });

      if (aiError) throw aiError;

      const extractedData = aiResult.data;
      setExtracted(extractedData);
      setEditedData({ ...extractedData });

      // Update upload record
      if (uploadRecord) {
        await supabase.from('tech_sheet_uploads').update({
          status: 'complete',
          extracted_json: extractedData,
        }).eq('id', uploadRecord.id);
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

  const handleApply = async () => {
    if (!productId || !editedData) return;
    setApplying(true);

    try {
      const payload: Record<string, any> = { product_id: productId };
      const textFields = [
        'ph', 'brix', 'energy_kj', 'energy_kcal', 'fats', 'saturated_fats',
        'carbohydrates', 'sugars', 'fibre', 'proteins', 'salt', 'odor',
        'appearance', 'taste_profile', 'shelf_life', 'storage_conditions',
        'storage_after_opening', 'microbiological_count', 'gmo_declaration',
        'ionising_radiation', 'compliance_references',
      ];
      const allergens = [
        'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
        'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
      ];

      textFields.forEach((k) => { payload[k] = editedData[k] || null; });
      allergens.forEach((a) => { payload[`allergen_${a}`] = !!editedData[`allergen_${a}`]; });

      const { error } = await supabase.from('product_technical_data').upsert(payload, { onConflict: 'product_id' });
      if (error) throw error;

      // Update completeness
      await supabase.from('products').update({ completeness: Math.min(100, (selectedProduct?.completeness || 0) + 15) }).eq('id', productId);

      // Mark upload as applied
      await supabase.from('tech_sheet_uploads').update({ applied_at: new Date().toISOString() })
        .eq('product_id', productId)
        .eq('status', 'complete')
        .is('applied_at', null);

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-technical-data', productId] });
      toast.success('Technical data applied to product');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply data');
    } finally {
      setApplying(false);
    }
  };

  const displayFields = extracted ? Object.entries(editedData).filter(([k]) => k !== 'product_name') : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">AI Tech Sheet Upload</h1>
          <p className="text-xs text-muted-foreground">Extract technical data from supplier PDFs</p>
        </div>
        <Link to="/admin"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Step 1: Product select */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground mb-3">Step 1 — Select Product</p>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Choose a product…" /></SelectTrigger>
            <SelectContent>
              {products?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.line})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Upload */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground mb-3">Step 2 — Upload PDF</p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
            style={{ backgroundColor: 'rgba(184,151,90,0.05)' }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <p className="text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Drop PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">.pdf files only</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Analyze */}
        {!extracted && (
          <Button
            onClick={handleAnalyze}
            disabled={!productId || !file || processing}
            className="w-full py-5 text-sm font-medium"
            style={{
              background: processing ? '#333' : 'linear-gradient(135deg, #4a7cc0, #4a8c5c)',
              color: 'white',
            }}
          >
            {processing ? THINKING_MESSAGES[thinkingIdx] : 'Analyse with AI'}
          </Button>
        )}

        {/* Step 4: Results */}
        {extracted && (
          <div className="space-y-4">
            <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground">Step 4 — Review Extracted Data</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayFields.map(([key, value]) => {
                const isEmpty = value === null || value === '' || value === undefined;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${isEmpty ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}
                  >
                    <label className="text-[10px] font-admin uppercase tracking-wider text-muted-foreground block mb-1">
                      {key.replace(/_/g, ' ')}
                    </label>
                    {typeof value === 'boolean' ? (
                      <select
                        value={editedData[key] ? 'true' : 'false'}
                        onChange={(e) => setEditedData((d) => ({ ...d, [key]: e.target.value === 'true' }))}
                        className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : (
                      <Input
                        value={editedData[key] || ''}
                        onChange={(e) => setEditedData((d) => ({ ...d, [key]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleApply}
              disabled={applying}
              className="w-full bg-primary text-primary-foreground py-5"
            >
              {applying ? 'Applying…' : 'Apply to Product'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
