import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpiritPartner {
  id?: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order?: number;
}

/** All spirit partners (public-readable, small, cached). */
export function useSpiritPartners() {
  return useQuery({
    queryKey: ['spirit-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spirit_partners' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as SpiritPartner[];
    },
    staleTime: 60_000,
  });
}

/** Case-insensitive lookup of a partner by its display name. */
export function findSpiritPartner(
  partners: SpiritPartner[] | undefined,
  name: string,
): SpiritPartner | undefined {
  if (!partners?.length) return undefined;
  const n = name.trim().toLowerCase();
  return partners.find((p) => (p.name || '').trim().toLowerCase() === n);
}

export function useUpsertSpiritPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partner: SpiritPartner) => {
      const db = supabase as any;
      const { data: existing } = await db
        .from('spirit_partners')
        .select('id')
        .ilike('name', partner.name.trim())
        .maybeSingle();
      const payload = {
        name: partner.name.trim(),
        logo_url: partner.logo_url || null,
        website_url: partner.website_url || null,
        updated_at: new Date().toISOString(),
      };
      const res = existing?.id
        ? await db.from('spirit_partners').update(payload).eq('id', existing.id)
        : await db.from('spirit_partners').insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spirit-partners'] }),
  });
}
