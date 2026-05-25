-- =============================================================
-- Production Security Hardening
-- Covers: H-3, H-5, H-6, M-4, M-5, M-6
-- =============================================================

-- ─── H-3: Revoke maybe_assign_admin from authenticated (deadline expired) ───
REVOKE EXECUTE ON FUNCTION public.maybe_assign_admin() FROM authenticated;

-- ─── M-5: Drop surviving broad read policies on product_technical_data ───
DROP POLICY IF EXISTS "Public read technical_data" ON public.product_technical_data;
DROP POLICY IF EXISTS "Auth read technical_data" ON public.product_technical_data;

-- ─── H-6: Replace get_product_nutrition with a version that strips
--          raw_analytical_data for anonymous callers ───────────────────────
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
  SELECT * INTO _row
  FROM public.product_technical_data
  WHERE product_id = p_product_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  _result := jsonb_build_object(
    'id', _row.id,
    'product_id', _row.product_id,
    'energy_kj', _row.energy_kj,
    'energy_kcal', _row.energy_kcal,
    'fats', _row.fats,
    'saturated_fats', _row.saturated_fats,
    'trans_fats', _row.trans_fats,
    'carbohydrates', _row.carbohydrates,
    'sugars', _row.sugars,
    'fibre', _row.fibre,
    'proteins', _row.proteins,
    'salt', _row.salt,
    'sodium_mg', _row.sodium_mg,
    'ph', _row.ph,
    'brix', _row.brix,
    'total_acidity', _row.total_acidity,
    'alcoholic_strength', _row.alcoholic_strength,
    'odor', _row.odor,
    'appearance', _row.appearance,
    'taste_profile', _row.taste_profile,
    'colour', _row.colour,
    'shelf_life', _row.shelf_life,
    'storage_conditions', _row.storage_conditions,
    'storage_after_opening', _row.storage_after_opening,
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
    -- raw_analytical_data intentionally excluded for public callers
    -- authenticated admin/supply users access it via direct table SELECT
  );

  -- Only append supplier-confidential data for authenticated users with supply/admin role
  IF public.has_any_role(auth.uid(), ARRAY['admin', 'supply']::text[]) THEN
    _result := _result || jsonb_build_object('raw_analytical_data', _row.raw_analytical_data);
  END IF;

  RETURN _result;
END;
$$;

-- ─── H-5: Fix activation_leads INSERT — require a valid active activation ───
DROP POLICY IF EXISTS "Public insert activation_leads" ON public.activation_leads;
CREATE POLICY "Public insert activation_leads" ON public.activation_leads
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activations
      WHERE id = activation_id
        AND status = 'active'
        AND (start_date IS NULL OR start_date <= now())
        AND (end_date IS NULL OR end_date >= now())
    )
  );

-- ─── M-4: Cap metadata size on section_interactions ────────────────────────
DROP POLICY IF EXISTS "Public insert section_interactions" ON public.section_interactions;
CREATE POLICY "Public insert section_interactions" ON public.section_interactions
  FOR INSERT TO anon
  WITH CHECK (
    octet_length(metadata::text) < 2048
  );

-- ─── M-6: Move reward_code out of public activations.content JSONB ──────────
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS reward_code text;

-- Migrate any existing reward_code values from content JSONB
UPDATE public.activations
SET
  reward_code = content->>'reward_code',
  content     = content - 'reward_code'
WHERE content ? 'reward_code';

-- Restrict anon role to columns that do not include reward_code
-- (column-level privilege: anon cannot see reward_code)
REVOKE SELECT ON TABLE public.activations FROM anon;
GRANT SELECT (
  id, name, brand_id, activation_type, content,
  targeting_mode, target_product_ids, target_collection_ids,
  placement, start_date, end_date, status, priority,
  created_at, updated_at
) ON TABLE public.activations TO anon;

-- ─── L-5: Protect collaboration contact fields from public reads ─────────────
-- Replace the open collaborations SELECT policy with one that uses a view
DROP POLICY IF EXISTS "Public read collaborations" ON public.collaborations;
CREATE POLICY "Public read collaborations" ON public.collaborations
  FOR SELECT TO public
  USING (status = 'active');

-- Revoke contact columns from anon
REVOKE SELECT ON TABLE public.collaborations FROM anon;
GRANT SELECT (
  id, brand_name, brand_slug, brand_logo_url, brand_color,
  event_name, event_date, status, created_at, updated_at
) ON TABLE public.collaborations TO anon;
