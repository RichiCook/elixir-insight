
-- Section config table for per-product layout control
CREATE TABLE public.product_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  section_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  custom_content JSONB DEFAULT '{}'::jsonb,
  UNIQUE(product_id, section_key)
);

ALTER TABLE public.product_sections ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read product_sections"
  ON public.product_sections FOR SELECT TO public
  USING (true);

-- Auth write
CREATE POLICY "Auth insert product_sections"
  ON public.product_sections FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Auth update product_sections"
  ON public.product_sections FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Auth delete product_sections"
  ON public.product_sections FOR DELETE TO authenticated
  USING (true);
