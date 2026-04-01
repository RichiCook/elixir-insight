
-- Default layout sections (global defaults, no product_id)
CREATE TABLE public.default_layout_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  custom_content jsonb DEFAULT '{}'::jsonb,
  block_type text NOT NULL DEFAULT 'built_in',
  block_config jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.default_layout_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read default_layout_sections" ON public.default_layout_sections FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert default_layout_sections" ON public.default_layout_sections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update default_layout_sections" ON public.default_layout_sections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete default_layout_sections" ON public.default_layout_sections FOR DELETE TO authenticated USING (true);

-- Add block_type and block_config to product_sections too
ALTER TABLE public.product_sections ADD COLUMN IF NOT EXISTS block_type text NOT NULL DEFAULT 'built_in';
ALTER TABLE public.product_sections ADD COLUMN IF NOT EXISTS block_config jsonb DEFAULT '{}'::jsonb;
