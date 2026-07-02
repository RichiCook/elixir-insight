import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAllActivationLeads } from '@/hooks/useActivations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function exportCsv(rows: any[]) {
  const headers = ['Name', 'Email', 'Phone', 'Activation', 'Rating', 'Date'];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((l) =>
    [l.name, l.email, l.phone, l.activations?.name, l.rating, l.created_at].map(esc).join(',')
  );
  const csv = [headers.join(','), ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminLeads() {
  const { data: leads, isLoading } = useAllActivationLeads();
  const [search, setSearch] = useState('');
  const [activationFilter, setActivationFilter] = useState('all');

  const activationOptions = useMemo(() => {
    const m = new Map<string, string>();
    (leads ?? []).forEach((l) => { if (l.activation_id) m.set(l.activation_id, l.activations?.name || 'Untitled'); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [leads]);

  const filtered = useMemo(() => {
    return (leads ?? []).filter((l) => {
      if (activationFilter !== 'all' && l.activation_id !== activationFilter) return false;
      if (!search) return true;
      const hay = `${l.name || ''} ${l.email || ''} ${l.phone || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [leads, search, activationFilter]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">Leads</h1>
          <p className="text-xs text-muted-foreground">Every name &amp; email captured across all activations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>
          <Button size="sm" className="bg-primary text-primary-foreground" disabled={!filtered.length} onClick={() => exportCsv(filtered)}>Export CSV</Button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Total Leads', value: leads?.length || 0 },
            { label: 'Showing', value: filtered.length },
            { label: 'Activations', value: activationOptions.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-5" style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-display text-4xl font-light text-primary leading-none">{s.value}</p>
              <p className="font-admin text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={activationFilter} onValueChange={setActivationFilter}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activations</SelectItem>
              {activationOptions.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : !filtered.length ? (
          <div className="text-center py-16 rounded-lg border border-border bg-card">
            <p className="font-display text-lg text-foreground mb-1">No leads {leads?.length ? 'match your filters' : 'yet'}</p>
            <p className="text-sm text-muted-foreground">Submissions from your live activations appear here automatically.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Activation</th>
                  <th className="text-left px-4 py-3">Rating</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-foreground">{l.name || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.email || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.activations?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-primary">{l.rating ? `${'★'.repeat(l.rating)}${'☆'.repeat(5 - l.rating)}` : '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.created_at ? format(new Date(l.created_at), 'PP p') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
