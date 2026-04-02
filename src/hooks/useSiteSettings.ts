import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings' as any).select('*').limit(1).single();
      return data as { site_title: string; favicon_url: string | null } | null;
    },
    staleTime: 60_000,
  });
}

/** Call this in consumer pages to apply favicon + title from DB */
export function useApplySiteSettings() {
  const { data } = useSiteSettings();

  useEffect(() => {
    if (!data) return;

    // Set document title
    if (data.site_title) {
      document.title = data.site_title;
    }

    // Set favicon
    if (data.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = data.favicon_url;
      link.type = data.favicon_url.endsWith('.png') ? 'image/png' : 'image/x-icon';
    }
  }, [data]);
}
