import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActivations, useDeleteActivation, useUpdateActivation, type ActivationStatus } from '@/hooks/useActivations';
import { useProducts } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-[#4a7cc0]/15 text-[#6a9ce0] border-[#4a7cc0]/20',
  active: 'bg-[#4a8c5c]/15 text-[#5aac6c] border-[#4a8c5c]/20',
  paused: 'bg-[#b8975a]/15 text-[#b8975a] border-[#b8975a]/20',
  completed: 'bg-muted text-muted-foreground',
};

const TYPE_LABELS: Record<string, string> = {
  text_image: 'Text / Image',
  video: 'Video',
  banner_cta: 'Banner CTA',
  custom_html: 'Custom HTML',
  lead_capture: 'Lead Capture',
  lead_capture_rating: 'Lead + Rating',
};

const PLACEMENT_LABELS: Record<string, string> = {
  after_hero: 'After Hero',
  after_serve: 'After How to Serve',
  after_sensory: 'After Sensory',
  after_composition: 'After Composition',
  after_moments: 'After Serve Moments',
  after_pairings: 'After Pairings',
  after_ingredients: 'After Ingredients',
  after_nutrition: 'After Nutrition',
  before_cta: 'Before Store CTA',
  after_editorial: 'After Editorial',
  overlay_modal: 'Overlay / Modal',
};

export default function AdminActivations() {
  const { data: activations, isLoading } = useActivations();
  const { data: products } = useProducts();
  const deleteMutation = useDeleteActivation();
  const updateMutation = useUpdateActivation();
  const navigate = useNavigate();

  const getProductNames = (ids: string[]) => {
    if (!products || !ids?.length) return '—';
    return ids
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Activation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: ActivationStatus) => {
    const newStatus: ActivationStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Activation ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDuplicate = async (activation: any) => {
    navigate(`/admin/activations/new?duplicate=${activation.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Activations</h1>
          <p className="text-xs text-muted-foreground">Content-to-Product Layer · Manage dynamic activations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
          <Link to="/admin/activations/new">
            <Button size="sm" className="bg-primary text-primary-foreground">+ New Activation</Button>
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Activations', value: activations?.length || 0 },
            { label: 'Active', value: activations?.filter((a) => a.status === 'active').length || 0 },
            { label: 'Drafts', value: activations?.filter((a) => a.status === 'draft').length || 0 },
            { label: 'Leads Captured', value: '—' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-5"
              style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="font-display text-4xl font-light text-primary leading-none">{s.value}</p>
              <p className="font-admin text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activations?.length ? (
          <div className="text-center py-20 rounded-lg border border-border bg-card">
            <p className="font-display text-xl text-foreground mb-2">No activations yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create your first activation to push content to products.</p>
            <Link to="/admin/activations/new">
              <Button className="bg-primary text-primary-foreground">Create Activation</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activations.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/admin/activations/${a.id}`} className="font-display text-base text-foreground hover:text-primary transition-colors truncate">
                        {a.name}
                      </Link>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{TYPE_LABELS[a.activation_type] || a.activation_type}</span>
                      <span>·</span>
                      <span>{a.brands?.name || '—'}</span>
                      <span>·</span>
                      <span>{PLACEMENT_LABELS[a.placement] || a.placement}</span>
                      <span>·</span>
                      <span>{a.target_product_ids?.length || 0} products</span>
                    </div>
                    {(a.start_date || a.end_date) && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {a.start_date ? new Date(a.start_date).toLocaleDateString() : '—'} → {a.end_date ? new Date(a.end_date).toLocaleDateString() : 'Ongoing'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(a.id, a.status)}>
                      {a.status === 'active' ? '⏸' : '▶'}
                    </Button>
                    <Link to={`/admin/activations/${a.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(a)}>⧉</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(a.id, a.name)}>✕</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
