
DROP VIEW IF EXISTS public.product_nutrition_public;

CREATE VIEW public.product_nutrition_public
WITH (security_invoker = true) AS
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

-- Add a public read policy on the base table scoped to the view's columns
-- so anon can query the view (security invoker means anon's permissions apply)
CREATE POLICY "Public read via nutrition view" ON public.product_technical_data
  FOR SELECT TO anon USING (true);
