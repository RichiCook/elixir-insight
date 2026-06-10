import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useCustomBrand,
  useCollaborationCocktails,
  useAddCoreCocktails,
  useAddSignatureCocktail,
  useRemoveCocktail,
} from '@/hooks/useCustom';
import { useProducts } from '@/hooks/useProduct';
import { useApiForm } from '@/hooks/useApiForm';
import { useBrandStore } from '@/stores/brandStore';
import { useScanStats } from '@/hooks/useScanStats';
import { ProductInsightCard } from '@/components/admin/ProductInsightCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { toast } from 'sonner';
import { PRODUCT_LINES } from '@/constants/app';
import { ImageIcon, Trash2, Search } from 'lucide-react';
import { ColorInput } from '@/components/admin/ColorInput';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns #000 or #fff — whichever contrasts better against the given hex bg. */
function textColorForBg(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000' : '#fff';
  } catch {
    return '#fff';
  }
}

// ── Core Cocktail Picker ──────────────────────────────────────────────────────

function CorePicker({
  collaborationId,
  existingProductIds,
  brandColor = '#caa850',
  onClose,
}: {
  collaborationId: string;
  existingProductIds: Set<string>;
  brandColor?: string;
  onClose: () => void;
}) {
  const { data: allProducts } = useProducts();
  const addCore = useAddCoreCocktails();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const available = (allProducts || []).filter(
    (p) =>
      !existingProductIds.has(p.id) &&
      !p.is_collaboration &&
      (p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.line || '').toLowerCase().includes(query.toLowerCase()))
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    try {
      await addCore.mutateAsync({ collaborationId, productIds: Array.from(selected) });
      toast.success(`${selected.size} cocktail${selected.size > 1 ? 's' : ''} added`);
      onClose();
    } catch {
      toast.error('Failed to add cocktails');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg border border-border w-full max-w-lg flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg text-foreground">Add Core Cocktails</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select from existing Classy Cocktails products
          </p>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search cocktails…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {available.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No products found</p>
          ) : (
            available.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    checked ? 'border' : 'hover:bg-muted border border-transparent'
                  }`}
                  style={checked ? {
                    backgroundColor: brandColor + '26',
                    borderColor: brandColor + '80',
                  } : {}}
                >
                  <div
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      checked ? '' : 'border-border'
                    }`}
                    style={checked ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.line} · {p.abv}% ABV</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{p.completeness}%</div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={selected.size === 0 || addCore.isPending}
            className="flex-1"
            style={{ backgroundColor: brandColor, color: textColorForBg(brandColor) }}
          >
            {addCore.isPending
              ? 'Adding…'
              : `Add ${selected.size > 0 ? selected.size : ''} Cocktail${selected.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCustomDetail() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const { data: brand, isLoading } = useCustomBrand(brandSlug || '');
  const { data: cocktails } = useCollaborationCocktails(brand?.id);
  const { data: allProducts } = useProducts();
  const { data: scanStats } = useScanStats();
  const removeCocktail = useRemoveCocktail();
  const addSignature = useAddSignatureCocktail();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const activeBrand = useBrandStore((s) => s.activeBrand);

  const [tab, setTab] = useState<'core' | 'signature'>('core');
  const [showCorePicker, setShowCorePicker] = useState(false);
  const [showNewSignature, setShowNewSignature] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // New signature form
  const [newSig, setNewSig] = useState({
    name: '',
    slug: '',
    line: 'Classic',
    abv: '',
    baseProductId: '',
  });
  const [creating, setCreating] = useState(false);

  const { form, set, saving, handleSave } = useApiForm<Record<string, any>>(
    brand ? { ...brand } : undefined,
    async (data) => {
      if (!brand) return;
      const { error } = await supabase
        .from('collaborations')
        .update({
          brand_name: data.brand_name,
          brand_logo_url: data.brand_logo_url || null,
          brand_color: data.brand_color || '#000000',
          contact_name: data.contact_name || null,
          contact_email: data.contact_email || null,
          event_name: data.event_name || null,
          event_date: data.event_date || null,
          status: data.status || 'active',
        })
        .eq('id', brand.id);
      if (error) { toast.error('Failed to save'); return; }
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['custom-brand', brandSlug] });
      qc.invalidateQueries({ queryKey: ['custom-brands'] });
    }
  );

  const coreCocktails = cocktails?.filter((c) => c.cocktail_type === 'core') ?? [];
  const signatureCocktails = cocktails?.filter((c) => c.cocktail_type === 'signature') ?? [];
  const existingProductIds = new Set((cocktails ?? []).map((c) => c.product_id));

  // Live brand color — follows the form while editing, falls back to saved brand color
  const brandColor = (form.brand_color || brand?.brand_color || '#caa850') as string;
  const brandTextColor = textColorForBg(brandColor);

  const handleBaseProductChange = (productId: string) => {
    if (productId === '_none') {
      setNewSig((p) => ({ ...p, baseProductId: '' }));
      return;
    }
    const base = allProducts?.find((p) => p.id === productId);
    setNewSig((p) => ({
      ...p,
      baseProductId: productId,
      line: base?.line || p.line,
      abv: base?.abv || p.abv,
    }));
  };

  const handleCreateSignature = async () => {
    if (!brand || !newSig.name || !newSig.slug || !newSig.abv) {
      toast.error('Name, slug, and ABV are required');
      return;
    }
    setCreating(true);
    try {
      const baseId = newSig.baseProductId;
      const baseProduct = baseId ? allProducts?.find((p) => p.id === baseId) : null;

      const insertPayload: Record<string, any> = {
        name: newSig.name,
        slug: newSig.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        line: newSig.line,
        abv: newSig.abv,
        collaboration_id: brand.id,
        is_collaboration: true,
      };

      if (baseProduct) {
        const copyFields = [
          'serving', 'spirit', 'garnish', 'glass', 'ice', 'flavour',
          'liquid_color', 'food_pairing', 'occasion', 'uk_units',
          'allergens_summary', 'bottle_color', 'label_color', 'hero_bg',
        ] as const;
        for (const f of copyFields) {
          if ((baseProduct as any)[f]) insertPayload[f] = (baseProduct as any)[f];
        }
      }

      const { data, error } = await supabase
        .from('products')
        .insert(insertPayload as any)
        .select('id, slug')
        .single();
      if (error) throw error;

      const newId = data.id;

      if (baseId) {
        const clone = async (table: string, multi = true) => {
          const q = supabase.from(table as any).select('*').eq('product_id', baseId);
          if (multi) {
            const { data: rows } = await q;
            if (rows?.length) {
              await supabase.from(table as any).insert(
                (rows as any[]).map(({ id: _id, product_id: _pid, ...rest }: any) => ({
                  ...rest,
                  product_id: newId,
                }))
              );
            }
          } else {
            const { data: row } = await (q as any).single();
            if (row) {
              const { id: _id, product_id: _pid, ...rest } = row as any;
              await supabase.from(table as any).insert({ ...rest, product_id: newId });
            }
          }
        };
        await Promise.all([
          clone('product_translations'),
          clone('product_technical_data', false),
          clone('product_composition'),
          clone('product_serve_moments'),
          clone('product_ai_pairings'),
          clone('product_ean_codes'),
          clone('product_sections'),
        ]);
      }

      await addSignature.mutateAsync({ collaborationId: brand.id, productId: newId });

      toast.success('Signature cocktail created');
      setShowNewSignature(false);
      setNewSig({ name: '', slug: '', line: 'Classic', abv: '', baseProductId: '' });
      navigate(`/admin/product/${data.slug}`);
    } catch (err: any) {
      toast.error(err.message?.includes('duplicate') ? 'Slug already exists' : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (entryId: string) => {
    const entry = cocktails?.find((c) => c.id === entryId);
    if (!entry || !brand) return;
    try {
      await removeCocktail.mutateAsync({
        entryId,
        productId: entry.product_id,
        cocktailType: entry.cocktail_type,
        collaborationId: brand.id,
      });
      toast.success(
        entry.cocktail_type === 'signature'
          ? 'Signature cocktail removed and archived'
          : 'Core cocktail unlinked'
      );
    } catch {
      toast.error('Failed to remove');
    }
    setConfirmRemove(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Custom brand not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/custom" className="text-muted-foreground hover:text-foreground text-sm">
            ← Custom
          </Link>
          <span className="text-border">/</span>
          <div className="flex items-center gap-2">
            {brand.brand_logo_url ? (
              <img
                src={brand.brand_logo_url}
                alt=""
                className="w-6 h-6 rounded object-contain"
              />
            ) : (
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: brand.brand_color || '#333', color: '#fff' }}
              >
                {brand.brand_name.charAt(0)}
              </div>
            )}
            <h1 className="text-lg font-admin font-semibold text-foreground">{brand.brand_name}</h1>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-8">

        {/* Brand banner */}
        <div
          className="rounded-lg p-4 flex items-center gap-4"
          style={{
            backgroundColor: (brand.brand_color || '#333') + '15',
            borderLeft: `4px solid ${brand.brand_color || '#333'}`,
          }}
        >
          <div>
            <p className="font-display text-lg text-foreground">{brand.brand_name}</p>
            {brand.event_name && (
              <p className="text-xs text-muted-foreground">
                {brand.event_name}{brand.event_date ? ` · ${brand.event_date}` : ''}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{coreCocktails.length} Core</span>
            <span className="text-border">·</span>
            <span>{signatureCocktails.length} Signature</span>
          </div>
        </div>

        {/* Settings */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-admin text-sm font-semibold text-foreground uppercase tracking-wider">
            Brand Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Name</Label>
              <Input value={form.brand_name || ''} onChange={(e) => set('brand_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Logo</Label>
              <div className="flex gap-2 items-center">
                {form.brand_logo_url && (
                  <img
                    src={form.brand_logo_url}
                    alt=""
                    className="w-10 h-10 rounded border border-border object-contain bg-white"
                  />
                )}
                <Input
                  value={form.brand_logo_url || ''}
                  onChange={(e) => set('brand_logo_url', e.target.value)}
                  placeholder="https://…"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoPicker(true)}
                  className="shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1" /> Browse
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</Label>
              <ColorInput
                value={form.brand_color || '#000000'}
                onChange={(hex) => set('brand_color', hex)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={form.status || 'active'} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event / Campaign</Label>
              <Input value={form.event_name || ''} onChange={(e) => set('event_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event Date</Label>
              <Input
                type="date"
                value={form.event_date || ''}
                onChange={(e) => set('event_date', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Contact Name</Label>
              <Input value={form.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Contact Email</Label>
              <Input
                type="email"
                value={form.contact_email || ''}
                onChange={(e) => set('contact_email', e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: brandColor, color: brandTextColor }}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </section>

        {/* Cocktails section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              <button
                onClick={() => setTab('core')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                  tab !== 'core' ? 'border-transparent text-muted-foreground hover:text-foreground' : ''
                }`}
                style={tab === 'core' ? {
                  backgroundColor: brandColor + '26',
                  color: brandColor,
                  borderColor: brandColor + '80',
                } : {}}
              >
                Core ({coreCocktails.length})
              </button>
              <button
                onClick={() => setTab('signature')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                  tab !== 'signature' ? 'border-transparent text-muted-foreground hover:text-foreground' : ''
                }`}
                style={tab === 'signature' ? {
                  backgroundColor: brandColor + '26',
                  color: brandColor,
                  borderColor: brandColor + '80',
                } : {}}
              >
                Signature ({signatureCocktails.length})
              </button>
            </div>
            {tab === 'core' ? (
              <Button
                size="sm"
                onClick={() => setShowCorePicker(true)}
                style={{ backgroundColor: brandColor, color: brandTextColor }}
              >
                + Add Core Cocktail
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowNewSignature(true)}
                style={{ backgroundColor: brandColor, color: brandTextColor }}
              >
                + New Signature Cocktail
              </Button>
            )}
          </div>

          {/* Core tab */}
          {tab === 'core' && (
            coreCocktails.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-3">
                  No core cocktails linked yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Core cocktails are existing Classy products served under this brand's identity
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowCorePicker(true)}
                  style={{ backgroundColor: brandColor, color: brandTextColor }}
                >
                  Add Core Cocktails
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ gridAutoRows: '1fr' }}>
                {coreCocktails.map((entry) => (
                  <div key={entry.id} className="relative">
                    <ProductInsightCard
                      product={{ ...entry.product, completeness: entry.product.completeness ?? 0 }}
                      stats={scanStats?.[entry.product.slug] ?? null}
                      brandSlugOverride={brand?.brand_slug}
                      badge="CORE"
                    />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmRemove(entry.id); }}
                      className="absolute top-3 right-[68px] z-10 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Unlink from this brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Signature tab */}
          {tab === 'signature' && (
            signatureCocktails.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-3">
                  No signature cocktails yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Signature cocktails are new recipes created exclusively for this brand
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowNewSignature(true)}
                  style={{ backgroundColor: brandColor, color: brandTextColor }}
                >
                  Create First Signature Cocktail
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ gridAutoRows: '1fr' }}>
                {signatureCocktails.map((entry) => (
                  <div key={entry.id} className="relative">
                    <ProductInsightCard
                      product={{ ...entry.product, completeness: entry.product.completeness ?? 0 }}
                      stats={scanStats?.[entry.product.slug] ?? null}
                      brandSlugOverride={brand?.brand_slug}
                      badge="SIGNATURE"
                    />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmRemove(entry.id); }}
                      className="absolute top-3 right-[68px] z-10 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Archive this signature cocktail"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </main>

      {/* Core picker modal */}
      {showCorePicker && brand && (
        <CorePicker
          collaborationId={brand.id}
          existingProductIds={existingProductIds}
          brandColor={brandColor}
          onClose={() => setShowCorePicker(false)}
        />
      )}

      {/* New Signature Modal */}
      {showNewSignature && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setShowNewSignature(false)}
        >
          <div
            className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="font-display text-xl text-foreground">New Signature Cocktail</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                For {brand.brand_name}{brand.event_name ? ` · ${brand.event_name}` : ''}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Base on existing cocktail
              </Label>
              <Select
                value={newSig.baseProductId || '_none'}
                onValueChange={handleBaseProductChange}
              >
                <SelectTrigger><SelectValue placeholder="Start from scratch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Start from scratch</SelectItem>
                  {allProducts
                    ?.filter((p) => !p.is_collaboration)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.line})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Copies all data: translations, specs, pairings, layout, etc.
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Name *</Label>
              <Input
                value={newSig.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewSig((p) => ({
                    ...p,
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                  }));
                }}
                placeholder="e.g. Adidas Spritz"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Slug *</Label>
              <Input
                value={newSig.slug}
                onChange={(e) => setNewSig((p) => ({ ...p, slug: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                URL: /b/{activeBrand?.slug ?? 'classy'}/{newSig.slug || '…'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Line</Label>
              <Select
                value={newSig.line}
                onValueChange={(v) => setNewSig((p) => ({ ...p, line: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_LINES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">ABV (%) *</Label>
              <Input
                value={newSig.abv}
                onChange={(e) => setNewSig((p) => ({ ...p, abv: e.target.value }))}
                placeholder="e.g. 8.5"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowNewSignature(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSignature}
                disabled={creating}
                className="flex-1"
                style={{ backgroundColor: brandColor, color: brandTextColor }}
              >
                {creating ? 'Creating…' : 'Create Signature Cocktail'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="bg-card rounded-lg border border-border p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const entry = cocktails?.find((c) => c.id === confirmRemove);
              const isSignature = entry?.cocktail_type === 'signature';
              return (
                <>
                  <h2 className="font-display text-lg text-foreground">
                    {isSignature ? 'Archive Signature Cocktail?' : 'Unlink Core Cocktail?'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isSignature
                      ? `"${entry?.product.name}" will be archived (hidden from QR scans) but not permanently deleted.`
                      : `"${entry?.product.name}" will be unlinked from ${brand.brand_name}. The original product is not affected.`}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmRemove(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleRemove(confirmRemove)}
                      disabled={removeCocktail.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      {removeCocktail.isPending ? 'Removing…' : isSignature ? 'Archive' : 'Unlink'}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Logo picker */}
      {showLogoPicker && (
        <ImagePickerDialog
          onSelect={(url) => { set('brand_logo_url', url); setShowLogoPicker(false); }}
          onClose={() => setShowLogoPicker(false)}
        />
      )}
    </div>
  );
}
