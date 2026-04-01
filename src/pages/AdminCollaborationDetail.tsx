import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProduct';
import { ImagePickerDialog } from '@/components/admin/ImagePickerDialog';
import { ImageIcon } from 'lucide-react';

function useCollaboration(brandSlug: string) {
  return useQuery({
    queryKey: ['collaboration', brandSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .eq('brand_slug', brandSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!brandSlug,
  });
}

function useCollabProducts(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['collab-products', collaborationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('collaboration_id', collaborationId!)
        .eq('is_collaboration', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!collaborationId,
  });
}

function getCompletenessColor(val: number) {
  if (val < 40) return '#a04040';
  if (val < 70) return '#c09040';
  if (val < 85) return '#b8975a';
  return '#4a8c5c';
}

export default function AdminCollaborationDetail() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const { data: collab, isLoading } = useCollaboration(brandSlug || '');
  const { data: products } = useCollabProducts(collab?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', slug: '', line: 'Collab', abv: '', baseProductId: '' });
  const [creating, setCreating] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const { data: mainProducts } = useProducts();

  useEffect(() => {
    if (collab) setForm({ ...collab });
  }, [collab]);

  const handleSave = async () => {
    if (!collab) return;
    setSaving(true);
    const { error } = await supabase.from('collaborations').update({
      brand_name: form.brand_name,
      brand_logo_url: form.brand_logo_url || null,
      brand_color: form.brand_color || '#000000',
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      event_name: form.event_name || null,
      event_date: form.event_date || null,
      status: form.status || 'active',
    }).eq('id', collab.id);
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Collaboration updated');
    queryClient.invalidateQueries({ queryKey: ['collaboration', brandSlug] });
  };

  const handleBaseProductChange = (productId: string) => {
    if (productId === '_none') {
      setNewProduct((p) => ({ ...p, baseProductId: '' }));
      return;
    }
    const base = mainProducts?.find((p) => p.id === productId);
    setNewProduct((p) => ({
      ...p,
      baseProductId: productId,
      line: base?.line || p.line,
      abv: base?.abv || p.abv,
    }));
  };

  const handleCreateProduct = async () => {
    if (!collab || !newProduct.name || !newProduct.slug || !newProduct.abv) {
      toast.error('Name, slug, and ABV are required');
      return;
    }
    setCreating(true);
    try {
      const baseId = newProduct.baseProductId;
      const baseProduct = baseId ? mainProducts?.find((p) => p.id === baseId) : null;

      const insertPayload: Record<string, any> = {
        name: newProduct.name,
        slug: newProduct.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        line: newProduct.line,
        abv: newProduct.abv,
        collaboration_id: collab.id,
        is_collaboration: true,
      };
      if (baseProduct) {
        const copyFields = ['serving', 'spirit', 'garnish', 'glass', 'ice', 'flavour', 'liquid_color', 'food_pairing', 'occasion', 'uk_units', 'allergens_summary', 'bottle_color', 'label_color', 'hero_bg'] as const;
        for (const f of copyFields) {
          if (baseProduct[f]) insertPayload[f] = baseProduct[f];
        }
      }

      const { data, error } = await supabase.from('products').insert(insertPayload as any).select('id, slug').single();
      if (error) throw error;
      const newId = data.id;

      if (baseId) {
        const clone = async (table: string, multi = true) => {
          const q = supabase.from(table as any).select('*').eq('product_id', baseId);
          if (multi) {
            const { data: rows } = await q;
            if (rows?.length) {
              await supabase.from(table as any).insert(
                (rows as any[]).map(({ id, product_id, ...rest }: any) => ({ ...rest, product_id: newId }))
              );
            }
          } else {
            const { data: row } = await (q as any).single();
            if (row) {
              const { id, product_id, ...rest } = row as any;
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

      toast.success(baseId ? 'Product created from base template' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['collab-products', collab.id] });
      setShowNewProduct(false);
      setNewProduct({ name: '', slug: '', line: 'Collab', abv: '', baseProductId: '' });
      navigate(`/admin/product/${data.slug}`);
    } catch (err: any) {
      toast.error(err.message?.includes('duplicate') ? 'Slug already exists' : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!collab) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Collaboration not found</p>
      </div>
    );
  }

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/collaborations" className="text-muted-foreground hover:text-foreground text-sm">← Collaborations</Link>
          <span className="text-border">/</span>
          <div className="flex items-center gap-2">
            {collab.brand_logo_url ? (
              <img src={collab.brand_logo_url} alt="" className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: collab.brand_color || '#333', color: '#fff' }}>
                {collab.brand_name.charAt(0)}
              </div>
            )}
            <h1 className="text-lg font-admin font-semibold text-foreground">{collab.brand_name}</h1>
          </div>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowNewProduct(true)}>+ New Collab Product</Button>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Collab banner */}
        <div className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: (collab.brand_color || '#333') + '15', borderLeft: `4px solid ${collab.brand_color || '#333'}` }}>
          <div>
            <p className="font-display text-lg text-foreground">{collab.brand_name}</p>
            {collab.event_name && <p className="text-xs text-muted-foreground">{collab.event_name}{collab.event_date ? ` · ${collab.event_date}` : ''}</p>}
          </div>
        </div>

        {/* Settings */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-admin text-sm font-semibold text-foreground uppercase tracking-wider">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Name</Label>
              <Input value={form.brand_name || ''} onChange={(e) => set('brand_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Logo</Label>
              <div className="flex gap-2 items-center">
                {form.brand_logo_url && (
                  <img src={form.brand_logo_url} alt="" className="w-10 h-10 rounded border border-border object-contain bg-white" />
                )}
                <Input value={form.brand_logo_url || ''} onChange={(e) => set('brand_logo_url', e.target.value)} placeholder="https://..." className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLogoPicker(true)} className="shrink-0">
                  <ImageIcon className="w-3.5 h-3.5 mr-1" /> Browse
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.brand_color || '#000000'} onChange={(e) => set('brand_color', e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                <Input value={form.brand_color || ''} onChange={(e) => set('brand_color', e.target.value)} className="flex-1" />
              </div>
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
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event Name</Label>
              <Input value={form.event_name || ''} onChange={(e) => set('event_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event Date</Label>
              <Input type="date" value={form.event_date || ''} onChange={(e) => set('event_date', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Contact Name</Label>
              <Input value={form.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Contact Email</Label>
              <Input value={form.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </section>

        {/* Product grid */}
        <section>
          <h2 className="font-admin text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Products</h2>
          {!products || products.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground text-sm mb-3">No products for this collaboration yet</p>
              <Button size="sm" onClick={() => setShowNewProduct(true)} className="bg-primary text-primary-foreground">Create first product</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/admin/product/${product.slug}`}
                  className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <p className="font-display text-base text-card-foreground">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{product.abv}% ABV · {product.line}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Completeness</span>
                      <span>{product.completeness}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${product.completeness}%`, backgroundColor: getCompletenessColor(product.completeness || 0) }} />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* New Product Modal */}
      {showNewProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setShowNewProduct(false)}>
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-foreground">New Collab Product</h2>
            <p className="text-xs text-muted-foreground">For {collab.brand_name}{collab.event_name ? ` · ${collab.event_name}` : ''}</p>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Base on existing product</Label>
              <Select value={newProduct.baseProductId || '_none'} onValueChange={handleBaseProductChange}>
                <SelectTrigger><SelectValue placeholder="Start from scratch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Start from scratch</SelectItem>
                  {mainProducts?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.line})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Copies all data: translations, tech specs, pairings, layout, etc.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name *</Label>
              <Input value={newProduct.name} onChange={(e) => {
                const name = e.target.value;
                setNewProduct((p) => ({ ...p, name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
              }} placeholder="e.g. Adidas Spritz" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Slug *</Label>
              <Input value={newProduct.slug} onChange={(e) => setNewProduct((p) => ({ ...p, slug: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground mt-1">URL: /bottle/{newProduct.slug || '...'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Line</Label>
              <Select value={newProduct.line} onValueChange={(v) => setNewProduct((p) => ({ ...p, line: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Collab">Collab</SelectItem>
                  <SelectItem value="Classic">Classic</SelectItem>
                  <SelectItem value="Sparkling">Sparkling</SelectItem>
                  <SelectItem value="No Regrets">No Regrets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">ABV (%) *</Label>
              <Input value={newProduct.abv} onChange={(e) => setNewProduct((p) => ({ ...p, abv: e.target.value }))} placeholder="e.g. 8.5" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowNewProduct(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateProduct} disabled={creating} className="flex-1 bg-primary text-primary-foreground">
                {creating ? 'Creating…' : 'Create Product'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLogoPicker && (
        <ImagePickerDialog
          onSelect={(url) => { set('brand_logo_url', url); setShowLogoPicker(false); }}
          onClose={() => setShowLogoPicker(false)}
        />
      )}
    </div>
  );
}
