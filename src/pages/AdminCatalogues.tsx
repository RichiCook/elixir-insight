import { Link } from 'react-router-dom';
import { useCatalogues, useDeleteCatalogue, useUpdateCatalogue, type Catalogue } from '@/hooks/useCatalogues';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-[#4a8c5c]/15 text-[#5aac6c] border-[#4a8c5c]/20',
};

export default function AdminCatalogues() {
  const { data: catalogues, isLoading } = useCatalogues();
  const deleteMutation = useDeleteCatalogue();
  const updateMutation = useUpdateCatalogue();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? The landing page will stop working.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Catalogue deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (c: Catalogue) => {
    const status = c.status === 'active' ? 'draft' : 'active';
    try {
      await updateMutation.mutateAsync({ id: c.id, status });
      toast.success(status === 'active' ? 'Catalogue published' : 'Catalogue unpublished');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Catalogues</h1>
          <p className="text-xs text-muted-foreground">Co-branded collection landing pages</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
          <Link to="/admin/catalogues/new"><Button size="sm" className="bg-primary text-primary-foreground">+ New Catalogue</Button></Link>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !catalogues?.length ? (
          <div className="text-center py-20 rounded-lg border border-border bg-card">
            <p className="font-display text-xl text-foreground mb-2">No catalogues yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create a co-branded landing page for a collection or collaboration.</p>
            <Link to="/admin/catalogues/new"><Button className="bg-primary text-primary-foreground">Create Catalogue</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {catalogues.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/admin/catalogues/${c.id}`} className="font-display text-base text-foreground hover:text-primary transition-colors truncate">
                        {c.title || c.slug}
                      </Link>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="font-mono">/collab/{c.slug}</span>
                      <span>·</span>
                      <span>{c.product_ids?.length || 0} products</span>
                      <span>·</span>
                      <span>{c.activation_id ? 'activation attached' : 'no activation'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.status === 'active' && (
                      <a href={`/collab/${c.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">View live ↗</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(c)}>{c.status === 'active' ? 'Unpublish' : 'Publish'}</Button>
                    <Link to={`/admin/catalogues/${c.id}`}><Button variant="ghost" size="sm">Edit</Button></Link>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id, c.title || c.slug)}>✕</Button>
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
