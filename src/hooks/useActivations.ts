import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ActivationType = 'text_image' | 'video' | 'banner_cta' | 'custom_html' | 'lead_capture' | 'lead_capture_rating';
export type ActivationStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type TargetingMode = 'products' | 'collections';

export interface Activation {
  id: string;
  name: string;
  brand_id: string;
  activation_type: ActivationType;
  content: Record<string, any>;
  targeting_mode: TargetingMode;
  target_product_ids: string[];
  target_collection_ids: string[];
  placement: string;
  start_date: string | null;
  end_date: string | null;
  status: ActivationStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (brand: { name: string; slug: string; logo_url?: string }) => {
      const { data, error } = await supabase.from('brands').insert(brand).select().single();
      if (error) throw error;
      return data as Brand;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useActivations() {
  return useQuery({
    queryKey: ['activations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activations')
        .select('*, brands(name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Activation & { brands: { name: string; slug: string } })[];
    },
  });
}

export function useActivation(id: string | undefined) {
  return useQuery({
    queryKey: ['activation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activations')
        .select('*, brands(name, slug)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Activation & { brands: { name: string; slug: string } };
    },
    enabled: !!id,
  });
}

export function useCreateActivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activation: Partial<Activation>) => {
      const { data, error } = await supabase.from('activations').insert(activation as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activations'] }),
  });
}

export function useUpdateActivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Activation> & { id: string }) => {
      const { data, error } = await supabase.from('activations').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['activations'] });
      qc.invalidateQueries({ queryKey: ['activation', vars.id] });
    },
  });
}

export function useDeleteActivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activations'] }),
  });
}

// Consumer-facing: fetch active activations for a specific product
export function useActiveActivationsForProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['active-activations', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activations')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
      if (error) throw error;
      // Filter by product ID in target_product_ids (client-side since it's an array column)
      return (data as Activation[]).filter(
        (a) => a.target_product_ids?.includes(productId!)
      );
    },
    enabled: !!productId,
  });
}

// Activation leads
export function useActivationLeads(activationId: string | undefined) {
  return useQuery({
    queryKey: ['activation-leads', activationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activation_leads')
        .select('*')
        .eq('activation_id', activationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activationId,
  });
}

export function useSubmitActivationLead() {
  return useMutation({
    mutationFn: async (lead: {
      activation_id: string;
      product_slug?: string;
      session_id?: string;
      name?: string;
      email?: string;
      phone?: string;
      rating?: number;
      custom_data?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.from('activation_leads').insert(lead as any).select().single();
      if (error) throw error;
      return data;
    },
  });
}
