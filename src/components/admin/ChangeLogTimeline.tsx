import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, RotateCcw, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  useChangeLog,
  useRestoreChange,
  useDismissChange,
  type ChangeLogEntry,
} from '@/hooks/useChangeLog';
import { FIELD_LABELS, HIDDEN_FIELDS, formatFieldValue } from '@/lib/changeLogLabels';

interface Props {
  /** If provided, renders these entries directly instead of fetching */
  entries?: ChangeLogEntry[];
  /** Scope to a single product (only used when entries is not provided) */
  productId?: string;
  limit?: number;
}

// ── helpers ────────────────────────────────────────────────────────────────────

export const ACTION_STYLES = {
  created: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    label: 'Created',
  },
  updated: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    label: 'Updated',
  },
  deleted: {
    dot: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    label: 'Deleted',
  },
};

export function diffEntries(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Array<{ key: string; label: string; before: string; after: string }> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: Array<{ key: string; label: string; before: string; after: string }> = [];
  keys.forEach((k) => {
    if (HIDDEN_FIELDS.has(k)) return;
    if (JSON.stringify(before[k]) === JSON.stringify(after[k])) return;
    changed.push({
      key: k,
      label:
        FIELD_LABELS[k] ??
        k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      before: formatFieldValue(k, before[k]),
      after: formatFieldValue(k, after[k]),
    });
  });
  return changed;
}

// ── diff panel ─────────────────────────────────────────────────────────────────

function DiffPanel({ entry }: { entry: ChangeLogEntry }) {
  if (entry.action === 'created') {
    const fields = Object.entries(entry.after_data ?? {}).filter(
      ([k, v]) => !HIDDEN_FIELDS.has(k) && v !== null && v !== '' && v !== undefined,
    );
    if (!fields.length)
      return <p className="text-xs text-muted-foreground">No details available.</p>;
    return (
      <div className="space-y-1.5">
        {fields.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="text-muted-foreground min-w-[120px] shrink-0">
              {FIELD_LABELS[k] ?? k.replace(/_/g, ' ')}
            </span>
            <span className="text-foreground">{formatFieldValue(k, v)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (entry.action === 'deleted') {
    return (
      <p className="text-xs text-muted-foreground">This record was permanently removed.</p>
    );
  }

  const changes = diffEntries(entry.before_data ?? {}, entry.after_data ?? {});
  if (!changes.length)
    return <p className="text-xs text-muted-foreground">No visible field changes.</p>;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
        <span>Field</span>
        <span>Before</span>
        <span>After</span>
      </div>
      {changes.map((c) => (
        <div key={c.key} className="grid grid-cols-[1fr_1fr_1fr] gap-x-3 text-xs items-start">
          <span className="text-muted-foreground">{c.label}</span>
          <span className="text-red-400/80 line-through decoration-red-400/40 break-all">
            {c.before}
          </span>
          <span className="text-emerald-400 break-all">{c.after}</span>
        </div>
      ))}
    </div>
  );
}

// ── restore confirmation modal ─────────────────────────────────────────────────

function RestoreModal({
  entry,
  onConfirm,
  onCancel,
  isPending,
}: {
  entry: ChangeLogEntry;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const changes =
    entry.before_data && entry.after_data
      ? diffEntries(entry.before_data, entry.after_data)
      : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-lg border border-border w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Restore previous version?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              This will overwrite the current content of{' '}
              <strong>{entry.entity_label}</strong> with the version before this
              change.
            </p>
          </div>
        </div>

        {changes.length > 0 && (
          <div className="rounded-md bg-muted/40 p-3 space-y-1.5 border border-border">
            <p className="text-[10px] uppercase font-medium text-muted-foreground tracking-wide mb-2">
              Fields that will be reverted
            </p>
            {changes.map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground min-w-[100px]">{c.label}</span>
                <span className="text-emerald-400 truncate max-w-[140px]">{c.before}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Restoring…' : 'Yes, restore'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── single log entry card ──────────────────────────────────────────────────────

export function LogCard({ entry }: { entry: ChangeLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const restore = useRestoreChange();
  const dismiss = useDismissChange();

  const styles = ACTION_STYLES[entry.action];
  const canRestore = entry.action !== 'deleted' && entry.before_data !== null;
  const hasDiff = entry.before_data !== null || entry.after_data !== null;

  const handleRestore = () => {
    restore.mutate(entry, {
      onSuccess: () => {
        toast.success('Version restored successfully');
        setShowRestore(false);
      },
      onError: (e: any) => {
        toast.error(e.message ?? 'Could not restore');
        setShowRestore(false);
      },
    });
  };

  const handleDismiss = () => {
    dismiss.mutate(entry.id, {
      onError: (e: any) => toast.error(e.message ?? 'Could not dismiss'),
    });
  };

  return (
    <>
      {showRestore && (
        <RestoreModal
          entry={entry}
          onConfirm={handleRestore}
          onCancel={() => setShowRestore(false)}
          isPending={restore.isPending}
        />
      )}

      <div className="rounded-lg border border-border bg-card hover:border-border/60 transition-colors">
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">
                {entry.entity_label ?? entry.table_name}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${styles.badge}`}
              >
                {styles.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.changed_by_email ?? 'Unknown user'}
              {' · '}
              {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasDiff && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/40 transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {expanded ? 'Hide' : 'Details'}
              </button>
            )}
            {canRestore && (
              <button
                onClick={() => setShowRestore(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-400/10 transition-colors"
                title="Restore this version"
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </button>
            )}
            <button
              onClick={handleDismiss}
              disabled={dismiss.isPending}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40 transition-colors"
              title="Dismiss this log entry"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Expanded diff */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20">
            <DiffPanel entry={entry} />
          </div>
        )}
      </div>
    </>
  );
}

// ── public component ───────────────────────────────────────────────────────────

export function ChangeLogTimeline({ entries: propEntries, productId, limit }: Props) {
  const { data: fetchedEntries, isLoading, error } = useChangeLog({
    productId,
    limit,
    enabled: !propEntries,
  });

  // If entries were passed in directly (global page pre-filters them), use those
  const entries = propEntries ?? fetchedEntries;
  const loading = propEntries ? false : isLoading;
  const loadError = propEntries ? null : error;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Could not load change history.
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No changes recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <LogCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
