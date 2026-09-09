import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrandQrLogo {
  qrLogoUrl: string | null;
  logoUrl: string | null;
  /** qr_logo_url if set, else logo_url — what the QR should actually render. */
  resolved: string | null;
}

/** Logo for the centre of QR codes. Reads select('*') so it keeps working
 *  (falling back to the brand logo) before the qr_logo_url column exists. */
export function useBrandQrLogo(slug: string | undefined) {
  return useQuery<BrandQrLogo>({
    queryKey: ['brand-qr-logo', slug],
    enabled: !!slug,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.from('brands') as any).select('*').eq('slug', slug!).maybeSingle();
      if (error) throw error;
      const qr = ((data?.qr_logo_url as string | undefined) || null);
      const logo = ((data?.logo_url as string | undefined) || null);
      return { qrLogoUrl: qr, logoUrl: logo, resolved: qr || logo };
    },
  });
}
