-- ════════════════════════════════════════════════════════════════════════════
-- Sprint 0 — Critical Fixes
-- 2026-05-26
-- ════════════════════════════════════════════════════════════════════════════

-- ─── FIX 1: Restore correct get_product_nutrition column names ───────────────
-- Migration 20260525000001 introduced wrong column aliases (fat_total,
-- fat_saturated, carbohydrate_total, carbohydrate_sugars, protein,
-- alcohol_percent) that don't exist on product_technical_data. The function
-- therefore returned null for every nutritional field, silently breaking the
-- consumer bottle page nutrition section.
-- This version restores the correct names while keeping the ::app_role[] cast
-- fix from 20260525000001.
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
    'id',                      _row.id,
    'product_id',              _row.product_id,
    'energy_kj',               _row.energy_kj,
    'energy_kcal',             _row.energy_kcal,
    'fats',                    _row.fats,
    'saturated_fats',          _row.saturated_fats,
    'trans_fats',              _row.trans_fats,
    'carbohydrates',           _row.carbohydrates,
    'sugars',                  _row.sugars,
    'fibre',                   _row.fibre,
    'proteins',                _row.proteins,
    'salt',                    _row.salt,
    'sodium_mg',               _row.sodium_mg,
    'ph',                      _row.ph,
    'brix',                    _row.brix,
    'total_acidity',           _row.total_acidity,
    'alcoholic_strength',      _row.alcoholic_strength,
    'odor',                    _row.odor,
    'appearance',              _row.appearance,
    'taste_profile',           _row.taste_profile,
    'colour',                  _row.colour,
    'shelf_life',              _row.shelf_life,
    'storage_conditions',      _row.storage_conditions,
    'storage_after_opening',   _row.storage_after_opening,
    'allergen_gluten',         _row.allergen_gluten,
    'allergen_crustaceans',    _row.allergen_crustaceans,
    'allergen_eggs',           _row.allergen_eggs,
    'allergen_fish',           _row.allergen_fish,
    'allergen_peanuts',        _row.allergen_peanuts,
    'allergen_soybeans',       _row.allergen_soybeans,
    'allergen_milk',           _row.allergen_milk,
    'allergen_nuts',           _row.allergen_nuts,
    'allergen_celery',         _row.allergen_celery,
    'allergen_mustard',        _row.allergen_mustard,
    'allergen_sesame',         _row.allergen_sesame,
    'allergen_sulphites',      _row.allergen_sulphites,
    'allergen_lupin',          _row.allergen_lupin,
    'allergen_molluscs',       _row.allergen_molluscs,
    'gmo_declaration',         _row.gmo_declaration,
    'ionising_radiation',      _row.ionising_radiation,
    'compliance_references',   _row.compliance_references,
    'document_type',           _row.document_type,
    'document_date',           _row.document_date,
    'document_revision',       _row.document_revision,
    'additional_information',  _row.additional_information,
    'recommended_dosage',      _row.recommended_dosage,
    'application',             _row.application
  );

  -- Append supplier-confidential data only for admin/supply roles.
  -- Cast to app_role[] (not text[]) to match the has_any_role signature.
  IF public.has_any_role(auth.uid(), ARRAY['admin', 'supply']::app_role[]) THEN
    _result := _result || jsonb_build_object(
      'raw_analytical_data',    _row.raw_analytical_data,
      'supplier_name',          _row.supplier_name,
      'supplier_address',       _row.supplier_address,
      'supplier_phone',         _row.supplier_phone,
      'supplier_email',         _row.supplier_email,
      'supplier_vat',           _row.supplier_vat,
      'laboratory_name',        _row.laboratory_name,
      'laboratory_address',     _row.laboratory_address,
      'test_report_number',     _row.test_report_number,
      'accreditation_number',   _row.accreditation_number,
      'batch_number',           _row.batch_number,
      'label_date',             _row.label_date
    );
  END IF;

  RETURN _result;
END;
$$;

-- ─── FIX 2: Rebuild product_nutrition_public view — remove sensitive columns ──
-- The original view (20260410092801) included raw_analytical_data, supplier_name,
-- supplier_address, supplier_phone, supplier_email, supplier_vat, laboratory_*,
-- test_report_number, accreditation_number, batch_number, and label_date — all
-- granted to anon. This bypasses the column-level restriction that get_product_nutrition
-- correctly enforces. Drop and recreate without any of those columns.
DROP VIEW IF EXISTS public.product_nutrition_public;

CREATE VIEW public.product_nutrition_public
WITH (security_invoker = true)
AS
SELECT
  id,
  product_id,
  document_type,
  document_date,
  document_revision,
  energy_kj,
  energy_kcal,
  fats,
  saturated_fats,
  trans_fats,
  carbohydrates,
  sugars,
  fibre,
  proteins,
  salt,
  sodium_mg,
  ph,
  brix,
  total_acidity,
  alcoholic_strength,
  odor,
  appearance,
  taste_profile,
  colour,
  shelf_life,
  storage_conditions,
  storage_after_opening,
  allergen_gluten,
  allergen_crustaceans,
  allergen_eggs,
  allergen_fish,
  allergen_peanuts,
  allergen_soybeans,
  allergen_milk,
  allergen_nuts,
  allergen_celery,
  allergen_mustard,
  allergen_sesame,
  allergen_sulphites,
  allergen_lupin,
  allergen_molluscs,
  gmo_declaration,
  ionising_radiation,
  compliance_references,
  additional_information,
  recommended_dosage,
  application
FROM public.product_technical_data;

GRANT SELECT ON public.product_nutrition_public TO anon, authenticated;

-- ─── FIX 3: Revoke has_role / has_any_role execution from anon ───────────────
-- Supabase grants EXECUTE to public by default for new functions, making these
-- SECURITY DEFINER role-check helpers callable by unauthenticated users. An anon
-- caller could use them to enumerate whether a given UUID holds a given role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
