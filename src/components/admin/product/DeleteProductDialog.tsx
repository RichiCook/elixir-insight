import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface Props {
  product: { id: string; name: string; slug: string };
  /** How many collaboration brands also use this drink (shown as a warning). */
  usedByBrands?: number;
  onDeleted: () => void;
}

/**
 * Deleting a drink is permanent and breaks its printed QR codes, so it takes
 * two explicit confirmations: (1) acknowledge the consequences, (2) type the
 * drink's exact name.
 */
export function DeleteProductDialog({ product, usedByBrands = 0, onDeleted }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reset = () => { setStep(1); setTyped(''); setDeleting(false); };
  const close = (v: boolean) => { setOpen(v); if (!v) reset(); };
  const nameMatches = typed.trim() === product.name.trim();

  const doDelete = async () => {
    if (!nameMatches) return;
    setDeleting(true);
    const { data, error } = await supabase.from('products').delete().eq('id', product.id).select('id');
    setDeleting(false);

    if (error) {
      if ((error as any).code === '23503') {
        toast.error('This drink has scan history that blocks deletion — run the scan_events_product_fk_set_null migration first.');
      } else {
        toast.error(`Delete failed: ${error.message}`);
      }
      return;
    }
    if (!data || data.length === 0) {
      toast.error('Nothing was deleted — your account may not have permission for this brand.');
      return;
    }

    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['scan-stats'] });
    toast.success(`“${product.name}” deleted`);
    close(false);
    onDeleted();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
      </Button>

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          {step === 1 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{product.name}”?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    <p>This permanently removes the drink and everything attached to it:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>translations, images, composition, pairings and serve moments</li>
                      <li>EAN codes and technical data</li>
                      {usedByBrands > 0 && (
                        <li><strong>its links to {usedByBrands} collaboration brand{usedByBrands === 1 ? '' : 's'}</strong></li>
                      )}
                    </ul>
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                      <strong>Printed QR codes</strong> for this drink (<code>/{product.slug}</code>) will stop working and show “Product not found”.
                    </p>
                    <p className="text-muted-foreground">Scan history is kept for analytics. This cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={() => setStep(2)}>Yes, continue</Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    <p>Type the drink name <strong className="text-foreground">{product.name}</strong> to confirm.</p>
                    <Input
                      autoFocus
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && nameMatches) void doDelete(); }}
                      placeholder={product.name}
                      aria-label="Type the drink name to confirm deletion"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="ghost" onClick={() => { setStep(1); setTyped(''); }} disabled={deleting}>Back</Button>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={doDelete} disabled={!nameMatches || deleting}>
                  {deleting ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
