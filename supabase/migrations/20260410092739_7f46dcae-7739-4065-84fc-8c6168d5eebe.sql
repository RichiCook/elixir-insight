
-- 1. Restrict product_technical_data public read → create safe public view
DROP POLICY IF EXISTS "Public read technical_data" ON public.product_technical_data;

CREATE OR REPLACE VIEW public.product_nutrition_public AS
SELECT 
  id, product_id,
  energy_kj, energy_kcal, fats, saturated_fats, trans_fats,
  carbohydrates, sugars, fibre, proteins, salt, sodium_mg,
  ph, brix, total_acidity, alcoholic_strength,
  odor, appearance, taste_profile, colour,
  shelf_life, storage_conditions, storage_after_opening,
  allergen_gluten, allergen_crustaceans, allergen_eggs, allergen_fish,
  allergen_peanuts, allergen_soybeans, allergen_milk, allergen_nuts,
  allergen_celery, allergen_mustard, allergen_sesame, allergen_sulphites,
  allergen_lupin, allergen_molluscs,
  gmo_declaration, ionising_radiation,
  compliance_references, compliance_regulation_1, compliance_regulation_2, compliance_regulation_3,
  additional_information, recommended_dosage, application,
  document_revision, document_date, document_type,
  raw_analytical_data
FROM public.product_technical_data;

GRANT SELECT ON public.product_nutrition_public TO anon, authenticated;

-- 2. Restrict repair_settings to auth-only
DROP POLICY IF EXISTS "Public read repair_settings" ON public.repair_settings;
CREATE POLICY "Auth read repair_settings" ON public.repair_settings FOR SELECT TO authenticated USING (true);

-- 3. Tighten write policies to admin role on admin-managed tables

-- products
DROP POLICY IF EXISTS "Auth insert products" ON public.products;
DROP POLICY IF EXISTS "Auth update products" ON public.products;
DROP POLICY IF EXISTS "Auth delete products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- brands
DROP POLICY IF EXISTS "Auth insert brands" ON public.brands;
DROP POLICY IF EXISTS "Auth update brands" ON public.brands;
DROP POLICY IF EXISTS "Auth delete brands" ON public.brands;
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- brand_images
DROP POLICY IF EXISTS "Auth insert brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Auth update brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Auth delete brand_images" ON public.brand_images;
CREATE POLICY "Admins can insert brand_images" ON public.brand_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update brand_images" ON public.brand_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brand_images" ON public.brand_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- activations
DROP POLICY IF EXISTS "Auth insert activations" ON public.activations;
DROP POLICY IF EXISTS "Auth update activations" ON public.activations;
DROP POLICY IF EXISTS "Auth delete activations" ON public.activations;
CREATE POLICY "Admins can insert activations" ON public.activations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update activations" ON public.activations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete activations" ON public.activations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- collaborations
DROP POLICY IF EXISTS "Auth insert collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Auth update collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Auth delete collaborations" ON public.collaborations;
CREATE POLICY "Admins can insert collaborations" ON public.collaborations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update collaborations" ON public.collaborations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete collaborations" ON public.collaborations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_composition
DROP POLICY IF EXISTS "Auth insert composition" ON public.product_composition;
DROP POLICY IF EXISTS "Auth update composition" ON public.product_composition;
DROP POLICY IF EXISTS "Auth delete composition" ON public.product_composition;
CREATE POLICY "Admins can insert composition" ON public.product_composition FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update composition" ON public.product_composition FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete composition" ON public.product_composition FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_serve_moments
DROP POLICY IF EXISTS "Auth insert serve_moments" ON public.product_serve_moments;
DROP POLICY IF EXISTS "Auth update serve_moments" ON public.product_serve_moments;
DROP POLICY IF EXISTS "Auth delete serve_moments" ON public.product_serve_moments;
CREATE POLICY "Admins can insert serve_moments" ON public.product_serve_moments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update serve_moments" ON public.product_serve_moments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete serve_moments" ON public.product_serve_moments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_ai_pairings
DROP POLICY IF EXISTS "Auth insert ai_pairings" ON public.product_ai_pairings;
DROP POLICY IF EXISTS "Auth update ai_pairings" ON public.product_ai_pairings;
DROP POLICY IF EXISTS "Auth delete ai_pairings" ON public.product_ai_pairings;
CREATE POLICY "Admins can insert ai_pairings" ON public.product_ai_pairings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ai_pairings" ON public.product_ai_pairings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ai_pairings" ON public.product_ai_pairings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_ean_codes
DROP POLICY IF EXISTS "Auth insert ean_codes" ON public.product_ean_codes;
DROP POLICY IF EXISTS "Auth update ean_codes" ON public.product_ean_codes;
DROP POLICY IF EXISTS "Auth delete ean_codes" ON public.product_ean_codes;
CREATE POLICY "Admins can insert ean_codes" ON public.product_ean_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ean_codes" ON public.product_ean_codes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ean_codes" ON public.product_ean_codes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_images
DROP POLICY IF EXISTS "Auth insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Auth update product_images" ON public.product_images;
DROP POLICY IF EXISTS "Auth delete product_images" ON public.product_images;
CREATE POLICY "Admins can insert product_images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product_images" ON public.product_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product_images" ON public.product_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_sections
DROP POLICY IF EXISTS "Auth insert product_sections" ON public.product_sections;
DROP POLICY IF EXISTS "Auth update product_sections" ON public.product_sections;
DROP POLICY IF EXISTS "Auth delete product_sections" ON public.product_sections;
CREATE POLICY "Admins can insert product_sections" ON public.product_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product_sections" ON public.product_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product_sections" ON public.product_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_technical_data
DROP POLICY IF EXISTS "Auth insert technical_data" ON public.product_technical_data;
DROP POLICY IF EXISTS "Auth update technical_data" ON public.product_technical_data;
DROP POLICY IF EXISTS "Auth delete technical_data" ON public.product_technical_data;
CREATE POLICY "Admins can insert technical_data" ON public.product_technical_data FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update technical_data" ON public.product_technical_data FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete technical_data" ON public.product_technical_data FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_translations
DROP POLICY IF EXISTS "Auth insert translations" ON public.product_translations;
DROP POLICY IF EXISTS "Auth update translations" ON public.product_translations;
DROP POLICY IF EXISTS "Auth delete translations" ON public.product_translations;
CREATE POLICY "Admins can insert translations" ON public.product_translations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update translations" ON public.product_translations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete translations" ON public.product_translations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- default_layout_sections
DROP POLICY IF EXISTS "Auth insert default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Auth update default_layout_sections" ON public.default_layout_sections;
DROP POLICY IF EXISTS "Auth delete default_layout_sections" ON public.default_layout_sections;
CREATE POLICY "Admins can insert default_layout_sections" ON public.default_layout_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update default_layout_sections" ON public.default_layout_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete default_layout_sections" ON public.default_layout_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- tech_sheet_uploads
DROP POLICY IF EXISTS "Auth insert tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Auth update tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Auth delete tech_sheets" ON public.tech_sheet_uploads;
DROP POLICY IF EXISTS "Auth read tech_sheets" ON public.tech_sheet_uploads;
CREATE POLICY "Admins can read tech_sheets" ON public.tech_sheet_uploads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert tech_sheets" ON public.tech_sheet_uploads FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tech_sheets" ON public.tech_sheet_uploads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tech_sheets" ON public.tech_sheet_uploads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- image_attributes
DROP POLICY IF EXISTS "Auth insert image_attributes" ON public.image_attributes;
DROP POLICY IF EXISTS "Auth update image_attributes" ON public.image_attributes;
DROP POLICY IF EXISTS "Auth delete image_attributes" ON public.image_attributes;
DROP POLICY IF EXISTS "Auth read all image_attributes" ON public.image_attributes;
CREATE POLICY "Admins can read all image_attributes" ON public.image_attributes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert image_attributes" ON public.image_attributes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update image_attributes" ON public.image_attributes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete image_attributes" ON public.image_attributes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- repair_settings
DROP POLICY IF EXISTS "Auth insert repair_settings" ON public.repair_settings;
DROP POLICY IF EXISTS "Auth update repair_settings" ON public.repair_settings;
DROP POLICY IF EXISTS "Auth delete repair_settings" ON public.repair_settings;
CREATE POLICY "Admins can insert repair_settings" ON public.repair_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update repair_settings" ON public.repair_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete repair_settings" ON public.repair_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- repair_requests (keep public insert for consumers, but restrict admin ops)
DROP POLICY IF EXISTS "Auth insert repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Auth update repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Auth delete repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Auth read repair_requests" ON public.repair_requests;
CREATE POLICY "Admins can read repair_requests" ON public.repair_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert repair_requests" ON public.repair_requests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update repair_requests" ON public.repair_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete repair_requests" ON public.repair_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- activations read - keep existing auth + public policies, just tighten auth read to admin
DROP POLICY IF EXISTS "Auth read activations" ON public.activations;
CREATE POLICY "Admins can read activations" ON public.activations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
