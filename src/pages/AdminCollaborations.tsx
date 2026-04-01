import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function useCollaborations() {
  return useQuery({
    queryKey: ['collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCollabProductCounts() {
  return useQuery({
    queryKey: ['collab-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('collaboration_id')
        .eq('is_collaboration', true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p) => {
        if (p.collaboration_id) {
          counts[p.collaboration_id] = (counts[p.collaboration_id] || 0) + 1;
        }
      });
      return counts;
    },
  });
}

export default function AdminCollaborations() {
  const { data: collabs, isLoading } = useCollaborations();
  const { data: counts } = useCollabProductCounts();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ brand_name: '', brand_slug: '', brand_color: '#000000', event_name: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.brand_name || !form.brand_slug) {
      toast.error('Brand name and slug are required');
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('collaborations').insert({
      brand_name: form.brand_name,
      brand_slug: form.brand_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      brand_color: form.brand_color,
      event_name: form.event_name || null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Slug already exists' : 'Failed to create');
      return;
    }
    toast.success('Collaboration created');
    queryClient.invalidateQueries({ queryKey: ['collaborations'] });
    setShowNew(false);
    setForm({ brand_name: '', brand_slug: '', brand_color: '#000000', event_name: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Brand Platform</h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · Collaborations</p>
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
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setShowNew(true)}>+ New Collaboration</Button>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/admin/login'); }}>Sign Out</Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Mode pills */}
        <div className="flex gap-1 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Brand</Button>
          </Link>
          <Button size="sm" className="bg-primary/15 text-primary border border-primary/30">Collabs</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !collabs || collabs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-4">No collaborations yet</p>
            <Button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground">Create your first collaboration</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collabs.map((c) => (
              <Link
                key={c.id}
                to={`/admin/collaborations/${c.brand_slug}`}
                className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {c.brand_logo_url ? (
                      <img src={c.brand_logo_url} alt="" className="w-10 h-10 rounded object-contain bg-muted" />
                    ) : (
                      <div className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold" style={{ backgroundColor: c.brand_color || '#333', color: '#fff' }}>
                        {c.brand_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-display text-base text-card-foreground">{c.brand_name}</p>
                      {c.event_name && <p className="text-[10px] text-muted-foreground">{c.event_name}</p>}
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                    c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">{counts?.[c.id] || 0} products</p>
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Collaboration Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setShowNew(false)}>
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-foreground">New Collaboration</h2>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Name *</Label>
              <Input value={form.brand_name} onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, brand_name: name, brand_slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
              }} placeholder="e.g. Adidas" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Slug *</Label>
              <Input value={form.brand_slug} onChange={(e) => setForm((f) => ({ ...f, brand_slug: e.target.value }))} placeholder="e.g. adidas" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Event Name</Label>
              <Input value={form.event_name} onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))} placeholder="e.g. Summer Run 2026" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.brand_color} onChange={(e) => setForm((f) => ({ ...f, brand_color: e.target.value }))} className="w-10 h-10 rounded border border-border cursor-pointer" />
                <Input value={form.brand_color} onChange={(e) => setForm((f) => ({ ...f, brand_color: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1 bg-primary text-primary-foreground">
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
