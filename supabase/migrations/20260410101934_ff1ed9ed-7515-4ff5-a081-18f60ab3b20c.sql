
-- 1. Create a public view for collaborations that excludes contact PII
CREATE VIEW public.collaborations_public
WITH (security_invoker = on) AS
  SELECT id, brand_name, brand_slug, brand_logo_url, brand_color,
         event_name, event_date, status, created_at, updated_at
  FROM public.collaborations;

-- 2. Drop the overly permissive public SELECT policy on collaborations
DROP POLICY IF EXISTS "Public read collaborations" ON public.collaborations;

-- 3. Add admin-only SELECT on the base table
CREATE POLICY "Admin read collaborations"
  ON public.collaborations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Grant anon/authenticated SELECT on the public view (for consumer pages)
GRANT SELECT ON public.collaborations_public TO anon, authenticated;

-- 5. Fix repair_settings: drop permissive auth read, add admin-only read
DROP POLICY IF EXISTS "Auth read repair_settings" ON public.repair_settings;

CREATE POLICY "Admin read repair_settings"
  ON public.repair_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
