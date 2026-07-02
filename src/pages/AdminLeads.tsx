import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useAllActivationLeads, useActivations } from '@/hooks/useActivations';

function toCsv(rows: any[], name: (id: string) => string): string {
  const headers = ['Date', 'Activation', 'Product', 'Name', 'Email', 'Phone', 'Rating'];
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((l) => [
    l.created_at ? new Date(l.created_at).toISOString() : '',
    name(l.activation_id),
    l.product_slug ?? '',
    l.name ?? '',
    l.email ?? '',
    l.phone ?? '',
    l.rating ?? '',
  ].map(esc).join(','));
  return [headers.join(','), ...lines].join('\n');
}

export default function AdminLeads() {
  const { data: leads, isLoading } = useAllActivationLeads();
  const { data: activations } = useActivations();
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (activations ?? []).forEach((a: any) => m.set(a.id, a.name));
    return m;
  }, [activations]);
  const actName = (id: string) => nameById.get(id) ?? '—';

  const csv = useMemo(() => (leads ? toCsv(leads, actName) : ''), [leads, nameById]);
  const download = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-admin font-semibold text-foreground">Leads</h1>
          <p className="text-xs text-muted-foreground">Everyone who submitted a lead-capture activation</p>
        </div>
        <Button size="sm" onClick={download} disabled={!leads || leads.length === 0} className="bg-primary text-primary-foreground">
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </header>

      <main className="p-6">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !leads || leads.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No leads captured yet.</p>
            <p className="text-xs text-muted-foreground mt-1">They'll appear here as soon as someone submits a lead-capture activation.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">{leads.length} lead{leads.length === 1 ? '' : 's'}</p>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                    <th className="px-3 py-2 font-medium">Activation</th>
                    <th className="px-3 py-2 font-medium">Product</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t border-border/60 text-foreground">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2">{l.name || '—'}</td>
                      <td className="px-3 py-2">{l.email || '—'}</td>
                      <td className="px-3 py-2">{l.phone || '—'}</td>
                      <td className="px-3 py-2">{l.rating != null ? `${l.rating}★` : '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{actName(l.activation_id)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.product_slug || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
