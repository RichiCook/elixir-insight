-- ─── R-1: Fix text[] cast in get_product_nutrition ───────────────────────────
-- has_any_role expects app_role[], not text[]. The wrong cast caused
-- supply/admin users to never receive raw_analytical_data from the RPC.
CREATE OR REPLACE FUNCTION public.get_product_nutrition(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.product_technical_data%ROWTYPE;
  _result jsonb;
BEGIN
  SELECT * INTO _row FROM public.product_technical_data WHERE product_id = p_product_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  _result := jsonb_build_object(
    'id', _row.id,
    'product_id', _row.product_id,
    'energy_kj', _row.energy_kj,
    'energy_kcal', _row.energy_kcal,
    'fat_total', _row.fat_total,
    'fat_saturated', _row.fat_saturated,
    'carbohydrate_total', _row.carbohydrate_total,
    'carbohydrate_sugars', _row.carbohydrate_sugars,
    'fibre', _row.fibre,
    'protein', _row.protein,
    'salt', _row.salt,
    'alcohol_percent', _row.alcohol_percent,
    'allergen_gluten', _row.allergen_gluten,
    'allergen_crustaceans', _row.allergen_crustaceans,
    'allergen_eggs', _row.allergen_eggs,
    'allergen_fish', _row.allergen_fish,
    'allergen_peanuts', _row.allergen_peanuts,
    'allergen_soybeans', _row.allergen_soybeans,
    'allergen_milk', _row.allergen_milk,
    'allergen_nuts', _row.allergen_nuts,
    'allergen_celery', _row.allergen_celery,
    'allergen_mustard', _row.allergen_mustard,
    'allergen_sesame', _row.allergen_sesame,
    'allergen_sulphites', _row.allergen_sulphites,
    'allergen_lupin', _row.allergen_lupin,
    'allergen_molluscs', _row.allergen_molluscs,
    'gmo_declaration', _row.gmo_declaration,
    'ionising_radiation', _row.ionising_radiation,
    'compliance_references', _row.compliance_references,
    'document_type', _row.document_type,
    'document_date', _row.document_date,
    'document_revision', _row.document_revision,
    'additional_information', _row.additional_information,
    'recommended_dosage', _row.recommended_dosage,
    'application', _row.application
  );

  -- Append supplier-confidential data only for admin/supply roles.
  -- Cast to app_role[] (was incorrectly text[] in previous version).
  IF public.has_any_role(auth.uid(), ARRAY['admin', 'supply']::app_role[]) THEN
    _result := _result || jsonb_build_object('raw_analytical_data', _row.raw_analytical_data);
  END IF;

  RETURN _result;
END;
$$;

-- ─── R-2: Add admin SELECT policy on user_roles ───────────────────────────────
-- Without this, admins querying user_roles see only their own row (due to the
-- self-read policy), making the AdminUsers page show no other users.
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
