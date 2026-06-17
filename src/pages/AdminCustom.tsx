import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useCustomBrands, useCustomBrandCocktailCounts } from '@/hooks/useCustom';
import { useBrands } from '@/hooks/useBrands';
import { useBrandStore } from '@/stores/brandStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { ColorInput } from '@/components/admin/ColorInput';

export default function AdminCustom() {
  const { data: brands, isLoading } = useCustomBrands();
  const { data: counts } = useCustomBrandCocktailCounts();
  const { data: platformBrands } = useBrands();
  const activeBrand = useBrandStore((s) => s.activeBrand);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    brand_name: '',
    brand_slug: '',
    brand_color: '#000000',
    event_name: '',
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.brand_name || !form.brand_slug) {
      toast.error('Brand name and slug are required');
      return;
    }
    // collaborations.brand_id is NOT NULL and RLS-gated to a brand the admin can
    // access — set it to the active (platform) brand.
    const brandId = activeBrand?.id ?? platformBrands?.[0]?.id;
    if (!brandId) {
      toast.error('No brand context — reload and try again');
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('collaborations').insert({
      brand_id: brandId,
      brand_name: form.brand_name,
      brand_slug: form.brand_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      brand_color: form.brand_color,
      event_name: form.event_name || null,
    } as any);
    setCreating(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Slug already exists' : 'Failed to create');
      return;
    }
    toast.success('Custom brand created');
    qc.invalidateQueries({ queryKey: ['custom-brands'] });
    setShowNew(false);
    setForm({ brand_name: '', brand_slug: '', brand_color: '#000000', event_name: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Brand Platform</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · Custom</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="outline" size="sm">Brand Products</Button>
          </Link>
          <Link to="/admin/images">
            <Button variant="outline" size="sm">Image Library</Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm">Analytics</Button>
          </Link>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={() => setShowNew(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Custom Brand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await signOut(); navigate('/admin/login'); }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Mode pills */}
        <div className="flex gap-1 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Brand</Button>
          </Link>
          <Button size="sm" className="bg-primary/15 text-primary border border-primary/30">Custom</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !brands || brands.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-4">No custom brands yet</p>
            <Button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground">
              Create your first custom brand
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.map((b) => {
              const c = counts?.[b.id];
              return (
                <Link
                  key={b.id}
                  to={`/admin/custom/${b.brand_slug}`}
                  className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {b.brand_logo_url ? (
                        <img
                          src={b.brand_logo_url}
                          alt=""
                          className="w-10 h-10 rounded object-contain bg-muted"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: b.brand_color || '#333', color: '#fff' }}
                        >
                          {b.brand_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-display text-base text-card-foreground">{b.brand_name}</p>
                        {b.event_name && (
                          <p className="text-[10px] text-muted-foreground">{b.event_name}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                      b.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {c ? (
                        <>
                          <span>{c.core} Core</span>
                          <span className="text-border">·</span>
                          <span>{c.signature} Signature</span>
                        </>
                      ) : (
                        <span>No cocktails yet</span>
                      )}
                    </div>
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* New Brand Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-foreground">New Custom Brand</h2>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Name *</Label>
              <Input
                value={form.brand_name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    brand_name: name,
                    brand_slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                  }));
                }}
                placeholder="e.g. Adidas"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Slug *</Label>
              <Input
                value={form.brand_slug}
                onChange={(e) => setForm((f) => ({ ...f, brand_slug: e.target.value }))}
                placeholder="e.g. adidas"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used in QR code URLs: /b/{form.brand_slug || '…'}/product-name
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event / Campaign Name</Label>
              <Input
                value={form.event_name}
                onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))}
                placeholder="e.g. Summer Run 2026"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</Label>
              <ColorInput
                value={form.brand_color}
                onChange={(hex) => setForm((f) => ({ ...f, brand_color: hex }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
