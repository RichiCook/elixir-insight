-- ============================================================
-- Sprint 3: Multi-brand platform
-- ============================================================

-- 1. Extend brands table with missing columns
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS active         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS website_url    text;

-- 2. Seed Classy Cocktails as brand #1 (fixed UUID for stable backfills)
INSERT INTO public.brands (id, name, slug, primary_color, active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Classy Cocktails',
  'classy',
  '#c9a96e',
  true,
  now(), now()
)
ON CONFLICT (slug) DO UPDATE
  SET primary_color = EXCLUDED.primary_color,
      active        = EXCLUDED.active,
      updated_at    = now();

-- ============================================================
-- 3. products → add brand_id
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id);

UPDATE public.products
  SET brand_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE brand_id IS NULL;

ALTER TABLE public.products ALTER COLUMN brand_id SET NOT NULL;

-- Slug is now unique per brand (not globally)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_brand_slug_idx ON public.products(brand_id, slug);

-- ============================================================
-- 4. brand_images → add brand_id
-- ============================================================
ALTER TABLE public.brand_images
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id);

UPDATE public.brand_images
  SET brand_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE brand_id IS NULL;

-- ============================================================
-- 5. collaborations → add brand_id FK (was text brand_slug)
-- ============================================================
ALTER TABLE public.collaborations
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id);

-- Try to match on existing brand_slug text column first
UPDATE public.collaborations c
  SET brand_id = b.id
  FROM public.brands b
  WHERE b.slug = c.brand_slug AND c.brand_id IS NULL;

-- Remaining → Classy
UPDATE public.collaborations
  SET brand_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE brand_id IS NULL;

ALTER TABLE public.collaborations ALTER COLUMN brand_id SET NOT NULL;

-- ============================================================
-- 6. default_layout_sections → add brand_id
-- ============================================================
ALTER TABLE public.default_layout_sections
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id);

UPDATE public.default_layout_sections
  SET brand_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE brand_id IS NULL;

ALTER TABLE public.default_layout_sections ALTER COLUMN brand_id SET NOT NULL;

-- section_key is now unique per brand
ALTER TABLE public.default_layout_sections
  DROP CONSTRAINT IF EXISTS default_layout_sections_section_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS default_layout_sections_brand_section_idx
  ON public.default_layout_sections(brand_id, section_key);

-- ============================================================
-- 7. user_roles → add nullable brand_id
--    NULL = super-admin (access to all brands)
--    value = scoped to that brand only
-- ============================================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id);
-- Existing admins (davide) stay NULL → super-admin

-- ============================================================
-- 8. scan_events → align with BottlePage insert + add brand context
-- ============================================================
ALTER TABLE public.scan_events
  ADD COLUMN IF NOT EXISTS product_id  uuid REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS brand_id    uuid REFERENCES public.brands(id),
  ADD COLUMN IF NOT EXISTS brand_slug  text,
  ADD COLUMN IF NOT EXISTS source      text DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS user_agent  text;

-- Rename language column to match the insert code (lang → language already correct, no-op)
-- product_slug already exists; product_id is new

-- ============================================================
-- 9. has_brand_access(user_id, brand_id) helper
--    Returns true if the user is an admin AND:
--      - their user_roles.brand_id IS NULL (super-admin), OR
--      - their user_roles.brand_id matches p_brand_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_brand_access(p_user_id uuid, p_brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND role    = 'admin'::app_role
      AND (brand_id IS NULL OR brand_id = p_brand_id)
  );
$$;

REVOKE ALL ON FUNCTION public.has_brand_access(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_brand_access(uuid, uuid) TO authenticated;

-- ============================================================
-- 10. Update RLS policies to enforce brand scoping
-- ============================================================

-- brands: any admin can read; only super-admin can write
DROP POLICY IF EXISTS "Admin read brands"   ON public.brands;
DROP POLICY IF EXISTS "Admins can read brands" ON public.brands;
CREATE POLICY "Admins can read brands"
  ON public.brands FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Super admins can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Super admins can update brands" ON public.brands;
DROP POLICY IF EXISTS "Super admins can delete brands" ON public.brands;
CREATE POLICY "Super admins can insert brands"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role AND brand_id IS NULL
  ));
CREATE POLICY "Super admins can update brands"
  ON public.brands FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role AND brand_id IS NULL
  ));
CREATE POLICY "Super admins can delete brands"
  ON public.brands FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role AND brand_id IS NULL
  ));

-- products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Brand admins can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

-- brand_images
DROP POLICY IF EXISTS "Admins can insert brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Admins can update brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Admins can delete brand_images" ON public.brand_images;
CREATE POLICY "Brand admins can insert brand_images"
  ON public.brand_images FOR INSERT TO authenticated
  WITH CHECK (brand_id IS NULL OR has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can update brand_images"
  ON public.brand_images FOR UPDATE TO authenticated
  USING (brand_id IS NULL OR has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can delete brand_images"
  ON public.brand_images FOR DELETE TO authenticated
  USING (brand_id IS NULL OR has_brand_access(auth.uid(), brand_id));

-- activations (already had brand_id)
DROP POLICY IF EXISTS "Admins can insert activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can update activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can delete activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can read activations"   ON public.activations;
CREATE POLICY "Brand admins can read activations"
  ON public.activations FOR SELECT TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can insert activations"
  ON public.activations FOR INSERT TO authenticated
  WITH CHECK (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can update activations"
  ON public.activations FOR UPDATE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can delete activations"
  ON public.activations FOR DELETE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

-- collaborations
DROP POLICY IF EXISTS "Admins can insert collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Admins can update collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Admins can delete collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Admin read collaborations"        ON public.collaborations;
CREATE POLICY "Brand admins can read collaborations"
  ON public.collaborations FOR SELECT TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can insert collaborations"
  ON public.collaborations FOR INSERT TO authenticated
  WITH CHECK (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can update collaborations"
  ON public.collaborations FOR UPDATE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can delete collaborations"
  ON public.collaborations FOR DELETE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

-- default_layout_sections
DROP POLICY IF EXISTS "Admins can insert default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Admins can update default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Admins can delete default_layout_sections" ON public.default_layout_sections;
CREATE POLICY "Brand admins can insert default_layout_sections"
  ON public.default_layout_sections FOR INSERT TO authenticated
  WITH CHECK (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can update default_layout_sections"
  ON public.default_layout_sections FOR UPDATE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));
CREATE POLICY "Brand admins can delete default_layout_sections"
  ON public.default_layout_sections FOR DELETE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

-- ============================================================
-- 11. Rebuild collaborations_public view (now includes brand_id)
-- ============================================================
DROP VIEW IF EXISTS public.collaborations_public;
CREATE VIEW public.collaborations_public
WITH (security_invoker = on) AS
  SELECT id, brand_id, brand_name, brand_slug, brand_logo_url, brand_color,
         event_name, event_date, status, created_at, updated_at
  FROM public.collaborations;

GRANT SELECT ON public.collaborations_public TO anon, authenticated;

-- ============================================================
-- 12. Replace get_bottle_page_data — now takes brand_slug + product_slug
-- ============================================================
DROP FUNCTION IF EXISTS public.get_bottle_page_data(text, text);

CREATE OR REPLACE FUNCTION public.get_bottle_page_data(
  p_brand_slug text,
  p_slug       text,
  p_lang       text DEFAULT 'EN'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id   uuid;
  v_product_id uuid;
  result       jsonb;
BEGIN
  SELECT id INTO v_brand_id
    FROM public.brands WHERE slug = p_brand_slug AND active = true;
  IF v_brand_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_product_id
    FROM public.products WHERE brand_id = v_brand_id AND slug = p_slug;
  IF v_product_id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'product',             row_to_json(p.*),
    'brand',               row_to_json(br.*),
    'translation',         row_to_json(pt.*),
    'composition',         COALESCE((
                             SELECT jsonb_agg(c ORDER BY c.sort_order)
                             FROM product_composition c WHERE c.product_id = v_product_id
                           ), '[]'),
    'serve_moments',       COALESCE((
                             SELECT jsonb_agg(s ORDER BY s.sort_order)
                             FROM product_serve_moments s WHERE s.product_id = v_product_id
                           ), '[]'),
    'sections',            COALESCE((
                             SELECT jsonb_agg(sec ORDER BY sec.sort_order)
                             FROM product_sections sec WHERE sec.product_id = v_product_id
                           ), '[]'),
    'images',              COALESCE((
                             SELECT jsonb_agg(i ORDER BY i.sort_order)
                             FROM product_images i WHERE i.product_id = v_product_id
                           ), '[]'),
    'activations',         COALESCE((
                             SELECT jsonb_agg(a)
                             FROM activations a
                             WHERE v_product_id = ANY(a.target_product_ids)
                               AND a.brand_id = v_brand_id
                               AND a.status   = 'active'
                               AND (a.start_date IS NULL OR a.start_date <= now())
                               AND (a.end_date   IS NULL OR a.end_date   >  now())
                           ), '[]'),
    'pairings',            COALESCE((
                             SELECT jsonb_agg(pa ORDER BY pa.sort_order)
                             FROM product_ai_pairings pa WHERE pa.product_id = v_product_id
                           ), '[]'),
    'nutrition',           (SELECT get_product_nutrition(v_product_id)),
    'collaboration',       (SELECT row_to_json(col.*)
                             FROM collaborations_public col
                             WHERE col.id = p.collaboration_id),
    'available_languages', COALESCE((
                             SELECT jsonb_agg(DISTINCT pt2.language)
                             FROM product_translations pt2 WHERE pt2.product_id = v_product_id
                           ), '["EN"]')
  )
  INTO result
  FROM public.products p
  JOIN public.brands br ON br.id = p.brand_id
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.language = p_lang
  WHERE p.id = v_product_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bottle_page_data(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bottle_page_data(text, text, text) TO anon, authenticated;
