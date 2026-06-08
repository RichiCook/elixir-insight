import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChangeLogEntry {
  id: string;
  changed_by: string | null;
  changed_by_email: string | null;
  table_name: string;
  row_id: string;
  product_id: string | null;
  action: 'created' | 'updated' | 'deleted';
  entity_label: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_at: string;
}

interface UseChangeLogOptions {
  productId?: string;
  limit?: number;
  enabled?: boolean;
}

export function useChangeLog(options: UseChangeLogOptions = {}) {
  const { productId, limit = 200, enabled = true } = options;
  return useQuery({
    queryKey: ['change-log', productId ?? 'global', limit],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from('change_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(limit);
      if (productId) q = q.eq('product_id', productId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ChangeLogEntry[];
    },
    staleTime: 30_000,
  });
}

export function useRestoreChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: ChangeLogEntry) => {
      if (!entry.before_data) throw new Error('No previous version to restore');
      // Strip metadata fields that shouldn't be written back
      const { id: _id, created_at: _ca, updated_at: _ua, ...restorable } = entry.before_data as any;
      const { error } = await supabase
        .from(entry.table_name as any)
        .update(restorable)
        .eq('id', entry.row_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-log'] });
    },
  });
}

export function useDismissChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      // Soft-delete: set archived_at instead of hard-deleting so audit evidence is preserved.
      // The SELECT RLS policy filters out archived rows so they disappear from the UI.
      const { error } = await supabase
        .from('change_log')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['change-log'] });
    },
  });
}
