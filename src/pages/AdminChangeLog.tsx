import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useChangeLog } from '@/hooks/useChangeLog';
import { ChangeLogTimeline } from '@/components/admin/ChangeLogTimeline';

const ACTION_FILTERS = [
  { value: 'all',     label: 'All changes' },
  { value: 'updated', label: 'Updated' },
  { value: 'created', label: 'Created' },
  { value: 'deleted', label: 'Deleted' },
] as const;

type ActionFilter = typeof ACTION_FILTERS[number]['value'];

export default function AdminChangeLog() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [search, setSearch] = useState('');

  const { data: allEntries, isLoading, error } = useChangeLog({ limit: 500 });

  const filtered = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter((e) => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.entity_label?.toLowerCase().includes(q) ||
          e.changed_by_email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEntries, actionFilter, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Changes</h1>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          A log of every content edit made by your team
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by content name or user email…"
              className="pl-9 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActionFilter(f.value)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                  actionFilter === f.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entry count */}
        {!isLoading && !error && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {search || actionFilter !== 'all' ? ' matching your filter' : ''}
          </p>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Could not load change history.
          </div>
        ) : (
          <ChangeLogTimeline entries={filtered} />
        )}
      </main>
    </div>
  );
}
