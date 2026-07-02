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
import { PRODUCT_LINES } from '@/constants/app';
import { BrandSwitcher } from '@/components/admin/BrandSwitcher';
import { useBrandStore } from '@/stores/brandStore';
import { useScanStats } from '@/hooks/useScanStats';
import { ProductInsightCard } from '@/components/admin/ProductInsightCard';

export default function AdminDashboard() {
  const { data: products, isLoading } = useProducts();
  const { data: stats } = useAdminStats();
  const { data: scanStats } = useScanStats();
  const signOut = useAuthStore((s) => s.signOut);
  const perms = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeBrand = useBrandStore((s) => s.activeBrand);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', slug: '', line: 'Classic', abv: '' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'scans' | 'trending' | 'declining' | 'completeness' | 'name'>('scans');

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
    if (!activeBrand?.id) {
      toast.error('No active brand selected');
      setCreating(false);
      return;
    }
    const { data, error } = await supabase.from('products').insert({
      name:     newProduct.name,
      slug:     newProduct.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      line:     newProduct.line,
      abv:      newProduct.abv,
      brand_id: activeBrand.id,
    } as any).select('slug').single();
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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-admin font-semibold text-foreground">Brand Platform</h1>
            <p className="text-xs text-muted-foreground">{activeBrand?.name ?? 'Select a brand'} · PIM</p>
          </div>
          <BrandSwitcher />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {perms.canManageLayout && (
            <Link to="/admin/default-layout"><Button variant="outline" size="sm">Default Layout</Button></Link>
          )}
          {perms.canManageLayout && (
            <Link to="/admin/line-content"><Button variant="outline" size="sm">Line Content</Button></Link>
          )}
          {perms.canManageLayout && (
            <Link to="/admin/spirit-partners"><Button variant="outline" size="sm">Spirit Partners</Button></Link>
          )}
          {perms.canManageImages && (
            <Link to="/admin/images"><Button variant="outline" size="sm">Image Library</Button></Link>
          )}
          {perms.canManageProducts && (
            <Link to="/admin/ai-upload"><Button variant="outline" size="sm">Data Import</Button></Link>
          )}
          {perms.canManageActivations && (
            <Link to="/admin/activations"><Button variant="outline" size="sm">Activations</Button></Link>
          )}
          {perms.canManageActivations && (
            <Link to="/admin/leads"><Button variant="outline" size="sm">Leads</Button></Link>
          )}
          {perms.canViewAnalytics && (
            <Link to="/admin/analytics"><Button variant="outline" size="sm">Analytics</Button></Link>
          )}
          {perms.canViewAnalytics && (
            <Link to="/admin/scans"><Button variant="outline" size="sm">Scan Explorer</Button></Link>
          )}
          {perms.canManageSettings && (
            <Link to="/admin/site-settings"><Button variant="outline" size="sm">Site Settings</Button></Link>
          )}
          {perms.canManageUsers && (
            <Link to="/admin/users"><Button variant="outline" size="sm">Users</Button></Link>
          )}
          {perms.canManageUsers && (
            <Link to="/admin/changes"><Button variant="outline" size="sm">Changes</Button></Link>
          )}
          {perms.canManageProducts && (
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowNewProduct(true)}>+ New Product</Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Mode pills */}
        <div className="flex gap-1">
          <Button size="sm" className="bg-primary/15 text-primary border border-primary/30">Brand</Button>
          <Link to="/admin/custom">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Custom</Button>
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

        {/* Filter / sort bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          {/* Line filter pills */}
          <div className="flex items-center gap-1.5">
            {(['all', ...PRODUCT_LINES] as const).map((line) => (
              <button
                key={line}
                onClick={() => setLineFilter(line)}
                className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: lineFilter === line ? 'rgba(202,168,80,0.5)' : 'rgba(255,255,255,0.08)',
                  background:  lineFilter === line ? 'rgba(202,168,80,0.12)' : 'transparent',
                  color:       lineFilter === line ? '#caa850' : 'var(--muted-foreground)',
                }}
              >
                {line === 'all' ? 'All' : line}
              </button>
            ))}
          </div>

          {/* Sort select */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scans">Most scans</SelectItem>
              <SelectItem value="trending">Trending ↑</SelectItem>
              <SelectItem value="declining">Declining ↓</SelectItem>
              <SelectItem value="completeness">Completeness</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ gridAutoRows: '1fr' }}>
            {(products ?? [])
              .filter((p) => {
                if (lineFilter !== 'all' && p.line !== lineFilter) return false;
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.slug.toLowerCase().includes(q) ||
                  (p.line?.toLowerCase() ?? '').includes(q)
                );
              })
              .sort((a, b) => {
                const sa = scanStats?.[a.slug];
                const sb = scanStats?.[b.slug];
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'completeness') return (b.completeness ?? 0) - (a.completeness ?? 0);
                if (sortBy === 'scans') {
                  const aScans = sa ? sa[sa.aiPeriod].scans : -1;
                  const bScans = sb ? sb[sb.aiPeriod].scans : -1;
                  return bScans - aScans;
                }
                if (sortBy === 'trending' || sortBy === 'declining') {
                  const aPct = sa ? sa[sa.aiPeriod].changePct : 0;
                  const bPct = sb ? sb[sb.aiPeriod].changePct : 0;
                  return sortBy === 'trending' ? bPct - aPct : aPct - bPct;
                }
                return 0;
              })
              .map((product) => (
                <ProductInsightCard
                  key={product.id}
                  product={product}
                  stats={scanStats?.[product.slug] ?? null}
                />
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
              <p className="text-[10px] text-muted-foreground mt-1">URL: /b/{activeBrand?.slug ?? 'classy'}/{newProduct.slug || '...'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Line</Label>
              <Select value={newProduct.line} onValueChange={(v) => setNewProduct((p) => ({ ...p, line: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_LINES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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
