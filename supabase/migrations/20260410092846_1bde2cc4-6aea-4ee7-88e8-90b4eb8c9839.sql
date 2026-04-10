
-- Remove the anon policy that exposes all columns directly
DROP POLICY IF EXISTS "Public read via nutrition view" ON public.product_technical_data;

-- Drop the view
DROP VIEW IF EXISTS public.product_nutrition_public;

-- Create RPC with two merged jsonb objects to stay under 100 args
CREATE OR REPLACE FUNCTION public.get_product_nutrition(p_product_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    jsonb_build_object(
      'id', id,
      'product_id', product_id,
      'energy_kj', energy_kj,
      'energy_kcal', energy_kcal,
      'fats', fats,
      'saturated_fats', saturated_fats,
      'trans_fats', trans_fats,
      'carbohydrates', carbohydrates,
      'sugars', sugars,
      'fibre', fibre,
      'proteins', proteins,
      'salt', salt,
      'sodium_mg', sodium_mg,
      'ph', ph,
      'brix', brix,
      'total_acidity', total_acidity,
      'alcoholic_strength', alcoholic_strength,
      'odor', odor,
      'appearance', appearance,
      'taste_profile', taste_profile,
      'colour', colour,
      'shelf_life', shelf_life,
      'storage_conditions', storage_conditions,
      'storage_after_opening', storage_after_opening
    ) || jsonb_build_object(
      'allergen_gluten', allergen_gluten,
      'allergen_crustaceans', allergen_crustaceans,
      'allergen_eggs', allergen_eggs,
      'allergen_fish', allergen_fish,
      'allergen_peanuts', allergen_peanuts,
      'allergen_soybeans', allergen_soybeans,
      'allergen_milk', allergen_milk,
      'allergen_nuts', allergen_nuts,
      'allergen_celery', allergen_celery,
      'allergen_mustard', allergen_mustard,
      'allergen_sesame', allergen_sesame,
      'allergen_sulphites', allergen_sulphites,
      'allergen_lupin', allergen_lupin,
      'allergen_molluscs', allergen_molluscs,
      'gmo_declaration', gmo_declaration,
      'ionising_radiation', ionising_radiation,
      'compliance_references', compliance_references,
      'compliance_regulation_1', compliance_regulation_1,
      'compliance_regulation_2', compliance_regulation_2,
      'compliance_regulation_3', compliance_regulation_3,
      'additional_information', additional_information,
      'recommended_dosage', recommended_dosage,
      'application', application,
      'document_revision', document_revision,
      'document_date', document_date,
      'document_type', document_type,
      'raw_analytical_data', raw_analytical_data
    )
  FROM public.product_technical_data
  WHERE product_id = p_product_id
  LIMIT 1
$$;
