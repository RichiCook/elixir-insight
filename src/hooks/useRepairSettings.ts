import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DamageType {
  name: string;
  description: string;
}

export interface PricingRule {
  damage_type: string;
  min_price: number;
  max_price: number;
}

export interface EmailTemplateField {
  key: string;
  label: string;
  enabled: boolean;
  sort_order: number;
  type: string;
  custom: boolean;
}

export interface RepairSettings {
  id: string;
  enabled: boolean;
  repair_email: string | null;
  email_template_fields: EmailTemplateField[];
  repair_centre_address: string | null;
  estimated_turnaround: string | null;
  damage_types: DamageType[];
  pricing_rules: PricingRule[];
  return_shipping_cost: number;
  warranty_covers_repair: boolean;
}

export function useRepairSettings() {
  return useQuery({
    queryKey: ['repair-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repair_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as RepairSettings | null;
    },
  });
}

export function useSaveRepairSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<RepairSettings> & { id?: string }) => {
      if (settings.id) {
        const { error } = await supabase
          .from('repair_settings')
          .update(settings as any)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('repair_settings')
          .insert(settings as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-settings'] });
    },
  });
}
