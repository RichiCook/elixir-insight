import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LineEditorial {
  id?: string;
  line: string;
  language: string;
  line_label: string | null;
  heading: string | null;
  heading_accent: string | null;
  body: string | null;
}

/** All per-line editorial rows (public-readable). Small + cached. */
export function useLineEditorials() {
  return useQuery({
    queryKey: ['line-editorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_editorials' as any)
        .select('*');
      if (error) throw error;
      return (data ?? []) as unknown as LineEditorial[];
    },
    staleTime: 60_000,
  });
}

/**
 * Pick the editorial for a given line + language, falling back to the EN row
 * for that line. Returns null if the line has no row at all.
 */
export function pickLineEditorial(
  rows: LineEditorial[] | undefined,
  line: string,
  lang: string,
): LineEditorial | null {
  if (!rows?.length) return null;
  const L = lang.toUpperCase();
  return (
    rows.find((r) => r.line === line && r.language?.toUpperCase() === L) ||
    rows.find((r) => r.line === line && r.language?.toUpperCase() === 'EN') ||
    null
  );
}

export function useUpsertLineEditorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: LineEditorial) => {
      const { error } = await supabase
        .from('line_editorials' as any)
        .upsert(
          {
            line: row.line,
            language: row.language,
            line_label: row.line_label || null,
            heading: row.heading || null,
            heading_accent: row.heading_accent || null,
            body: row.body || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'line,language' },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['line-editorials'] }),
  });
}
