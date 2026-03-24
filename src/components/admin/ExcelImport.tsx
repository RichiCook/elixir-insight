import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { parseExcelFile, type ParsedProduct } from '@/lib/excelParser';
import { Link } from 'react-router-dom';

type ProductStatus = 'pending' | 'parsing' | 'writing' | 'done' | 'error';

interface ProductProgress {
  name: string;
  slug: string;
  status: ProductStatus;
  fieldsUpdated: number;
  languagesPopulated: number;
  eanCodesAdded: number;
  error?: string;
}

export default function ExcelImport() {
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProductProgress[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setCompleted(false);
      setProgress([]);
    } else {
      toast.error('Please select an Excel file (.xlsx or .xls)');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setCompleted(false);
      setProgress([]);
    } else {
      toast.error('Please drop an Excel file (.xlsx or .xls)');
    }
  }, []);

  const updateProductStatus = (slug: string, update: Partial<ProductProgress>) => {
    setProgress(prev => prev.map(p => p.slug === slug ? { ...p, ...update } : p));
  };

  const handleImport = async () => {
    if (!file || !products) return;
    setProcessing(true);
    setCompleted(false);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);

      if (parsed.length === 0) {
        toast.error('No recognized product sheets found in the file');
        setProcessing(false);
        return;
      }

      // Initialize progress
      setProgress(parsed.map(p => ({
        name: p.sheetName,
        slug: p.slug,
        status: 'pending',
        fieldsUpdated: 0,
        languagesPopulated: 0,
        eanCodesAdded: 0,
      })));

      for (const parsedProduct of parsed) {
        updateProductStatus(parsedProduct.slug, { status: 'parsing' });
        await new Promise(r => setTimeout(r, 100)); // Let UI update

        const dbProduct = products.find(p => p.slug === parsedProduct.slug);
        if (!dbProduct) {
          updateProductStatus(parsedProduct.slug, {
            status: 'error',
            error: `Product slug "${parsedProduct.slug}" not found in database`,
          });
          continue;
        }

        updateProductStatus(parsedProduct.slug, { status: 'writing' });

        try {
          let fieldsUpdated = 0;
          let languagesPopulated = 0;
          let eanCodesAdded = 0;

          // 1. Update products table
          const productUpdate: Record<string, any> = {};
          const pf = parsedProduct.productFields;
          const nf = parsedProduct.nutriFields;

          for (const [key, val] of Object.entries(pf)) {
            if (val !== null && key !== 'shelf_life') {
              productUpdate[key] = val;
              fieldsUpdated++;
            }
          }

          if (Object.keys(productUpdate).length > 0) {
            const { error } = await supabase.from('products').update(productUpdate).eq('id', dbProduct.id);
            if (error) throw error;
          }

          // 2. Update technical data with nutri fields + shelf_life
          const techUpdate: Record<string, any> = {};
          for (const [key, val] of Object.entries(nf)) {
            if (val) { techUpdate[key] = val; fieldsUpdated++; }
          }
          if (pf.shelf_life) {
            techUpdate.shelf_life = pf.shelf_life;
            fieldsUpdated++;
          }

          if (Object.keys(techUpdate).length > 0) {
            techUpdate.product_id = dbProduct.id;
            const { error } = await supabase.from('product_technical_data')
              .upsert(techUpdate, { onConflict: 'product_id' });
            if (error) throw error;
          }

          // 3. Upsert translations
          for (const [lang, fields] of Object.entries(parsedProduct.translations)) {
            const nonNullFields = Object.fromEntries(
              Object.entries(fields).filter(([, v]) => v !== null)
            );
            if (Object.keys(nonNullFields).length === 0) continue;

            const { data: existing } = await supabase.from('product_translations')
              .select('id').eq('product_id', dbProduct.id).eq('language', lang).maybeSingle();

            if (existing) {
              await supabase.from('product_translations')
                .update(nonNullFields).eq('id', existing.id);
            } else {
              await supabase.from('product_translations')
                .insert({ product_id: dbProduct.id, language: lang, ...nonNullFields });
            }
            languagesPopulated++;
            fieldsUpdated += Object.keys(nonNullFields).length;
          }

          // 4. Upsert EAN codes
          for (const [market, eans] of Object.entries(parsedProduct.eanCodes)) {
            const nonNullEans = Object.fromEntries(
              Object.entries(eans).filter(([, v]) => v !== undefined && v !== null)
            );
            if (Object.keys(nonNullEans).length === 0) continue;

            const { data: existing } = await supabase.from('product_ean_codes')
              .select('id').eq('product_id', dbProduct.id).eq('market', market).maybeSingle();

            if (existing) {
              await supabase.from('product_ean_codes')
                .update(nonNullEans).eq('id', existing.id);
            } else {
              await supabase.from('product_ean_codes')
                .insert({ product_id: dbProduct.id, market, ...nonNullEans });
            }
            eanCodesAdded++;
          }

          updateProductStatus(parsedProduct.slug, {
            status: 'done',
            fieldsUpdated,
            languagesPopulated,
            eanCodesAdded,
          });
        } catch (err: any) {
          updateProductStatus(parsedProduct.slug, {
            status: 'error',
            error: err.message || 'Write failed',
          });
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

  const doneCount = progress.filter(p => p.status === 'done' || p.status === 'error').length;
  const totalCount = progress.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground mb-3">Upload Excel Spreadsheet</p>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
          style={{ backgroundColor: 'rgba(184,151,90,0.05)' }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div>
              <p className="text-sm text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Drop the product Excel spreadsheet here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls files</p>
            </div>
          )}
        </div>
      </div>

      {/* Import button */}
      {!completed && (
        <Button
          onClick={handleImport}
          disabled={!file || processing}
          className="w-full py-5 text-sm font-medium"
          style={{ background: processing ? '#333' : 'linear-gradient(135deg, #4a7cc0, #4a8c5c)', color: 'white' }}
        >
          {processing ? 'Importing…' : '⬡ Import from Excel'}
        </Button>
      )}

      {/* Progress */}
      {progress.length > 0 && !completed && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-admin uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="text-xs text-muted-foreground">{doneCount} / {totalCount} products</p>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="space-y-2 mt-3">
            {progress.map((p) => (
              <div key={p.slug} className="flex items-center justify-between text-sm py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <span className="text-foreground">{p.name}</span>
                <span className={
                  p.status === 'done' ? 'text-green-400' :
                  p.status === 'error' ? 'text-red-400' :
                  p.status === 'writing' ? 'text-blue-400' :
                  p.status === 'parsing' ? 'text-amber-400' :
                  'text-muted-foreground'
                }>
                  {p.status === 'done' && '✓ Done'}
                  {p.status === 'error' && `✗ ${p.error || 'Error'}`}
                  {p.status === 'writing' && 'Writing…'}
                  {p.status === 'parsing' && 'Parsing…'}
                  {p.status === 'pending' && '—'}
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
                  <th className="text-left px-4 py-2 text-xs font-admin uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="text-center px-4 py-2 text-xs font-admin uppercase tracking-wider text-muted-foreground">Fields</th>
                  <th className="text-center px-4 py-2 text-xs font-admin uppercase tracking-wider text-muted-foreground">Languages</th>
                  <th className="text-center px-4 py-2 text-xs font-admin uppercase tracking-wider text-muted-foreground">EAN Codes</th>
                  <th className="text-center px-4 py-2 text-xs font-admin uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <tr key={p.slug} className="border-b border-border/50">
                    <td className="px-4 py-2 text-foreground">{p.name}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{p.fieldsUpdated}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{p.languagesPopulated}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{p.eanCodesAdded}</td>
                    <td className="px-4 py-2 text-center">
                      {p.status === 'done' ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400" title={p.error}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Link to="/admin" className="flex-1">
              <Button variant="outline" className="w-full">View Products</Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setFile(null); setProgress([]); setCompleted(false); }}
            >
              Import Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
