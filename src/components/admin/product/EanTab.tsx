import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductEanCodes } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const MARKETS = ['INT', 'IT', 'DE', 'FR', 'UK'] as const;

export function EanTab({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const { data: eanCodes } = useProductEanCodes(productId);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<{ market: string; ean_cocktail: string; ean_carton: string; id?: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eanCodes && eanCodes.length > 0) {
      setRows(eanCodes.map((e) => ({
        id: e.id,
        market: e.market,
        ean_cocktail: e.ean_cocktail || '',
        ean_carton: e.ean_carton || '',
      })));
    } else {
      setRows(MARKETS.map((m) => ({ market: m, ean_cocktail: '', ean_carton: '' })));
    }
  }, [eanCodes]);

  const updateRow = (idx: number, key: string, val: string) =>
    setRows((r) => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));

  const addRow = () =>
    setRows((r) => [...r, { market: '', ean_cocktail: '', ean_carton: '' }]);

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows) {
      if (!row.market) continue;
      await supabase.from('product_ean_codes').upsert({
        ...(row.id ? { id: row.id } : {}),
        product_id: productId,
        market: row.market,
        ean_cocktail: row.ean_cocktail || null,
        ean_carton: row.ean_carton || null,
      }, { onConflict: 'product_id,market' });
    }
    setSaving(false);
    toast.success('EAN codes saved');
    queryClient.invalidateQueries({ queryKey: ['product-ean-codes', productId] });
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Market</TableHead>
            <TableHead className="text-xs">EAN Cocktail</TableHead>
            <TableHead className="text-xs">EAN Carton</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input value={row.market} onChange={(e) => updateRow(i, 'market', e.target.value)} className="h-8 text-xs" />
              </TableCell>
              <TableCell>
                <Input value={row.ean_cocktail} onChange={(e) => updateRow(i, 'ean_cocktail', e.target.value)} className="h-8 text-xs" />
              </TableCell>
              <TableCell>
                <Input value={row.ean_carton} onChange={(e) => updateRow(i, 'ean_carton', e.target.value)} className="h-8 text-xs" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={addRow}>+ Add Market</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground" size="sm">
          {saving ? 'Saving…' : 'Save EAN Codes'}
        </Button>
      </div>
    </div>
  );
}
