CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title text NOT NULL DEFAULT 'Classy Cocktails',
  favicon_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (needed for consumer pages)
CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert one default row
INSERT INTO public.site_settings (site_title) VALUES ('Classy Cocktails');