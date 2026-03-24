
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  language text DEFAULT 'en',
  referrer text,
  user_agent text,
  country text,
  city text,
  session_id text,
  viewed_at timestamptz DEFAULT now()
);

CREATE TABLE public.scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  ean_code text,
  market text,
  language text,
  session_id text,
  scanned_at timestamptz DEFAULT now()
);

CREATE TABLE public.section_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  session_id text,
  section_name text NOT NULL,
  interaction_type text DEFAULT 'view',
  metadata jsonb,
  interacted_at timestamptz DEFAULT now()
);

CREATE TABLE public.image_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES public.brand_images(id),
  product_slug text,
  section text,
  session_id text,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_views ENABLE ROW LEVEL SECURITY;

-- Public insert for tracking from consumer page
CREATE POLICY "Public insert page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert scan_events" ON public.scan_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert section_interactions" ON public.section_interactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert image_views" ON public.image_views FOR INSERT TO anon WITH CHECK (true);

-- Authenticated read for admin dashboard
CREATE POLICY "Auth read page_views" ON public.page_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read scan_events" ON public.scan_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read section_interactions" ON public.section_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read image_views" ON public.image_views FOR SELECT TO authenticated USING (true);

-- Authenticated write
CREATE POLICY "Auth write page_views" ON public.page_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth write scan_events" ON public.scan_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth write section_interactions" ON public.section_interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth write image_views" ON public.image_views FOR INSERT TO authenticated WITH CHECK (true);
