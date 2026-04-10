import { useState } from 'react';
import { useProducts, useAdminStats } from '@/hooks/useProduct';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/useUserRole';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function getCompletenessColor(val: number) {
  if (val < 40) return '#a04040';
  if (val < 70) return '#c09040';
  if (val < 85) return '#b8975a';
  return '#4a8c5c';
}

function getLineBadge(line: string) {
  const styles: Record<string, string> = {
    Classic: 'bg-[#b8975a]/15 text-[#b8975a] border-[#b8975a]/20',
    Sparkling: 'bg-[#4a7cc0]/15 text-[#6a9ce0] border-[#4a7cc0]/20',
    'No Regrets': 'bg-[#4a8c5c]/15 text-[#5aac6c] border-[#4a8c5c]/20',
  };
  return styles[line] || styles.Classic;
}

export default function AdminDashboard() {
  const { data: products, isLoading } = useProducts();
  const { data: stats } = useAdminStats();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', slug: '', line: 'Classic', abv: '' });
  const [creating, setCreating] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.slug || !newProduct.abv) {
      toast.error('Name, slug and ABV are required');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.from('products').insert({
      name: newProduct.name,
      slug: newProduct.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      line: newProduct.line,
      abv: newProduct.abv,
    }).select('slug').single();
    setCreating(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'A product with that slug already exists' : 'Failed to create product');
      return;
    }
    toast.success('Product created');
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    setShowNewProduct(false);
    setNewProduct({ name: '', slug: '', line: 'Classic', abv: '' });
    navigate(`/admin/product/${data.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Brand Platform</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · PIM</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/default-layout">
            <Button variant="outline" size="sm">Default Layout</Button>
          </Link>
          <Link to="/admin/images">
            <Button variant="outline" size="sm">Image Library</Button>
          </Link>
          <Link to="/admin/ai-upload">
            <Button variant="outline" size="sm">Data Import</Button>
          </Link>
          <Link to="/admin/activations">
            <Button variant="outline" size="sm">Activations</Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm">Analytics</Button>
          </Link>
          <Link to="/admin/site-settings">
            <Button variant="outline" size="sm">Site Settings</Button>
          </Link>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowNewProduct(true)}>+ New Product</Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Mode pills */}
        <div className="flex gap-1">
          <Button size="sm" className="bg-primary/15 text-primary border border-primary/30">Brand</Button>
          <Link to="/admin/collaborations">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Collabs</Button>
          </Link>
        </div>
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Products', value: stats.totalProducts },
              { label: 'Languages', value: stats.languages },
              { label: 'Complete Profiles', value: stats.completeProfiles },
              { label: 'Tech Sheets', value: stats.techSheetsProcessed },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-5"
                style={{
                  backgroundColor: '#161616',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p className="font-display text-4xl font-light text-primary leading-none">
                  {s.value}
                </p>
                <p className="font-admin text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products?.map((product) => (
              <Link
                key={product.id}
                to={`/admin/product/${product.slug}`}
                className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display text-base text-card-foreground">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${getLineBadge(product.line)}`}>
                        {product.line}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{product.abv}% ABV</span>
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: product.bottle_color || '#333' }}
                  />
                </div>

                {product.spirit && (
                  <p className="text-[10px] text-muted-foreground mb-3 truncate">{product.spirit}</p>
                )}

                {/* Completeness bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Completeness</span>
                    <span>{product.completeness}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${product.completeness}%`,
                        backgroundColor: getCompletenessColor(product.completeness || 0),
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Product Modal */}
      {showNewProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setShowNewProduct(false)}>
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-foreground">New Product</h2>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name *</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewProduct((p) => ({
                    ...p,
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                  }));
                }}
                placeholder="e.g. Paloma"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Slug *</Label>
              <Input
                value={newProduct.slug}
                onChange={(e) => setNewProduct((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. paloma"
              />
              <p className="text-[10px] text-muted-foreground mt-1">URL path: /bottle/{newProduct.slug || '...'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Line</Label>
              <Select value={newProduct.line} onValueChange={(v) => setNewProduct((p) => ({ ...p, line: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Classic">Classic</SelectItem>
                  <SelectItem value="Sparkling">Sparkling</SelectItem>
                  <SelectItem value="No Regrets">No Regrets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">ABV (%) *</Label>
              <Input
                value={newProduct.abv}
                onChange={(e) => setNewProduct((p) => ({ ...p, abv: e.target.value }))}
                placeholder="e.g. 14.9"
              />
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
    </div>
  );
}
