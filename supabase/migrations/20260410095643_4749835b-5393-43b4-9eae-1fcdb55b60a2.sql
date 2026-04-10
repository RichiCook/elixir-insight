
-- Create has_any_role helper
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- activation_leads: restrict read to admin+marketing
DROP POLICY IF EXISTS "Auth read activation_leads" ON public.activation_leads;
CREATE POLICY "Admin/Marketing read activation_leads"
  ON public.activation_leads FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));

-- activations: admin+marketing
DROP POLICY IF EXISTS "Admins can insert activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can update activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can delete activations" ON public.activations;
DROP POLICY IF EXISTS "Admins can read activations" ON public.activations;

CREATE POLICY "Admin/Marketing read activations"
  ON public.activations FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));
CREATE POLICY "Admin/Marketing insert activations"
  ON public.activations FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));
CREATE POLICY "Admin/Marketing update activations"
  ON public.activations FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));
CREATE POLICY "Admin/Marketing delete activations"
  ON public.activations FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));

-- products: admin+editor
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admin/Editor insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update products"
  ON public.products FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete products"
  ON public.products FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_sections
DROP POLICY IF EXISTS "Admins can insert product_sections" ON public.product_sections;
DROP POLICY IF EXISTS "Admins can update product_sections" ON public.product_sections;
DROP POLICY IF EXISTS "Admins can delete product_sections" ON public.product_sections;

CREATE POLICY "Admin/Editor insert product_sections"
  ON public.product_sections FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update product_sections"
  ON public.product_sections FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete product_sections"
  ON public.product_sections FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_composition
DROP POLICY IF EXISTS "Admins can insert composition" ON public.product_composition;
DROP POLICY IF EXISTS "Admins can update composition" ON public.product_composition;
DROP POLICY IF EXISTS "Admins can delete composition" ON public.product_composition;

CREATE POLICY "Admin/Editor insert composition"
  ON public.product_composition FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update composition"
  ON public.product_composition FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete composition"
  ON public.product_composition FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_translations
DROP POLICY IF EXISTS "Admins can insert translations" ON public.product_translations;
DROP POLICY IF EXISTS "Admins can update translations" ON public.product_translations;
DROP POLICY IF EXISTS "Admins can delete translations" ON public.product_translations;

CREATE POLICY "Admin/Editor insert translations"
  ON public.product_translations FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update translations"
  ON public.product_translations FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete translations"
  ON public.product_translations FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_ai_pairings
DROP POLICY IF EXISTS "Admins can insert ai_pairings" ON public.product_ai_pairings;
DROP POLICY IF EXISTS "Admins can update ai_pairings" ON public.product_ai_pairings;
DROP POLICY IF EXISTS "Admins can delete ai_pairings" ON public.product_ai_pairings;

CREATE POLICY "Admin/Editor insert ai_pairings"
  ON public.product_ai_pairings FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update ai_pairings"
  ON public.product_ai_pairings FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete ai_pairings"
  ON public.product_ai_pairings FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_serve_moments
DROP POLICY IF EXISTS "Admins can insert serve_moments" ON public.product_serve_moments;
DROP POLICY IF EXISTS "Admins can update serve_moments" ON public.product_serve_moments;
DROP POLICY IF EXISTS "Admins can delete serve_moments" ON public.product_serve_moments;

CREATE POLICY "Admin/Editor insert serve_moments"
  ON public.product_serve_moments FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update serve_moments"
  ON public.product_serve_moments FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete serve_moments"
  ON public.product_serve_moments FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_ean_codes
DROP POLICY IF EXISTS "Admins can insert ean_codes" ON public.product_ean_codes;
DROP POLICY IF EXISTS "Admins can update ean_codes" ON public.product_ean_codes;
DROP POLICY IF EXISTS "Admins can delete ean_codes" ON public.product_ean_codes;

CREATE POLICY "Admin/Editor insert ean_codes"
  ON public.product_ean_codes FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update ean_codes"
  ON public.product_ean_codes FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete ean_codes"
  ON public.product_ean_codes FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- brand_images
DROP POLICY IF EXISTS "Admins can insert brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Admins can update brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Admins can delete brand_images" ON public.brand_images;

CREATE POLICY "Admin/Editor insert brand_images"
  ON public.brand_images FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update brand_images"
  ON public.brand_images FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete brand_images"
  ON public.brand_images FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_images
DROP POLICY IF EXISTS "Admins can insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product_images" ON public.product_images;

CREATE POLICY "Admin/Editor insert product_images"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update product_images"
  ON public.product_images FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete product_images"
  ON public.product_images FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- default_layout_sections
DROP POLICY IF EXISTS "Admins can insert default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Admins can update default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Admins can delete default_layout_sections" ON public.default_layout_sections;

CREATE POLICY "Admin/Editor insert default_layout_sections"
  ON public.default_layout_sections FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor update default_layout_sections"
  ON public.default_layout_sections FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));
CREATE POLICY "Admin/Editor delete default_layout_sections"
  ON public.default_layout_sections FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','editor']::app_role[]));

-- product_technical_data: admin+supply+editor read, admin+supply write
CREATE POLICY "Admin/Supply/Editor read technical_data"
  ON public.product_technical_data FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply','editor']::app_role[]));

DROP POLICY IF EXISTS "Admins can insert technical_data" ON public.product_technical_data;
DROP POLICY IF EXISTS "Admins can update technical_data" ON public.product_technical_data;
DROP POLICY IF EXISTS "Admins can delete technical_data" ON public.product_technical_data;

CREATE POLICY "Admin/Supply insert technical_data"
  ON public.product_technical_data FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));
CREATE POLICY "Admin/Supply update technical_data"
  ON public.product_technical_data FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));
CREATE POLICY "Admin/Supply delete technical_data"
  ON public.product_technical_data FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));

-- tech_sheet_uploads: admin+supply
DROP POLICY IF EXISTS "Admins can insert tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Admins can update tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Admins can delete tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Admins can read tech_sheets" ON public.tech_sheet_uploads;

CREATE POLICY "Admin/Supply read tech_sheets"
  ON public.tech_sheet_uploads FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));
CREATE POLICY "Admin/Supply insert tech_sheets"
  ON public.tech_sheet_uploads FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));
CREATE POLICY "Admin/Supply update tech_sheets"
  ON public.tech_sheet_uploads FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));
CREATE POLICY "Admin/Supply delete tech_sheets"
  ON public.tech_sheet_uploads FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','supply']::app_role[]));

-- Analytics: admin+marketing read
DROP POLICY IF EXISTS "Auth read page_views" ON public.page_views;
CREATE POLICY "Admin/Marketing read page_views"
  ON public.page_views FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));

DROP POLICY IF EXISTS "Auth read scan_events" ON public.scan_events;
CREATE POLICY "Admin/Marketing read scan_events"
  ON public.scan_events FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));

DROP POLICY IF EXISTS "Auth read section_interactions" ON public.section_interactions;
CREATE POLICY "Admin/Marketing read section_interactions"
  ON public.section_interactions FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));

DROP POLICY IF EXISTS "Auth read image_views" ON public.image_views;
CREATE POLICY "Admin/Marketing read image_views"
  ON public.image_views FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','marketing']::app_role[]));
