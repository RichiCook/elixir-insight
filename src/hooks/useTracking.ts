import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function hasTrackingConsent(): boolean {
  return localStorage.getItem('cc_tracking_consent') === 'accepted';
}

export function setTrackingConsent(accepted: boolean) {
  localStorage.setItem('cc_tracking_consent', accepted ? 'accepted' : 'declined');
}

function getSessionId(): string {
  let id = sessionStorage.getItem('cc_session');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('cc_session', id);
  }
  return id;
}

/** Fire-and-forget insert — never blocks UI. Skipped without consent. */
function track(table: 'page_views' | 'scan_events' | 'section_interactions' | 'image_views', data: Record<string, any>) {
  if (!hasTrackingConsent()) return;
  (supabase.from(table) as any).insert(data).then(() => {});
}

export function usePageViewTracking(slug: string | undefined) {
  const tracked = useRef(false);
  useEffect(() => {
    if (!slug || tracked.current) return;
    tracked.current = true;
    track('page_views', {
      product_slug: slug,
      language: navigator.language?.substring(0, 2)?.toLowerCase() || 'en',
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    });
  }, [slug]);
}

export function useSectionTracking(slug: string | undefined) {
  const trackedSections = useRef<Set<string>>(new Set());

  const observeSection = useCallback(
    (el: HTMLElement | null, sectionName: string) => {
      if (!el || !slug || trackedSections.current.has(sectionName)) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !trackedSections.current.has(sectionName)) {
              trackedSections.current.add(sectionName);
              track('section_interactions', {
                product_slug: slug,
                session_id: getSessionId(),
                section_name: sectionName,
                interaction_type: 'view',
              });
              observer.disconnect();
            }
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    },
    [slug]
  );

  return { observeSection };
}

export function trackInteraction(
  slug: string,
  sectionName: string,
  interactionType: string,
  metadata?: Record<string, any>
) {
  track('section_interactions', {
    product_slug: slug,
    session_id: getSessionId(),
    section_name: sectionName,
    interaction_type: interactionType,
    metadata: metadata || null,
  });
}
