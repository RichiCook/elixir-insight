-- ============================================================
-- Fix change_log trigger — default_layout_sections branch — 2026-06-11
--
-- BUG: log_change() referenced NEW.section_type / OLD.section_type for the
-- default_layout_sections table, but that table has no section_type column
-- (its column is section_key). Every INSERT/UPDATE/DELETE on
-- default_layout_sections therefore aborted with
--   record "new" has no field "section_type"
-- which surfaced in the admin as "Failed to save layout".
--
-- Fix: use section_key (matching the product_sections branch, which was
-- already corrected). Full function reproduced because CREATE OR REPLACE
-- replaces the whole body.
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_email      text;
  v_product_id uuid;
  v_label      text;
  v_action     text;
  v_before     jsonb;
  v_after      jsonb;

  -- Strip sensitive keys from a jsonb snapshot
  SENSITIVE_KEYS CONSTANT text[] := ARRAY['reward_code'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_before := NULL;
    v_after  := to_jsonb(NEW) - SENSITIVE_KEYS;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_before := to_jsonb(OLD) - SENSITIVE_KEYS;
    v_after  := to_jsonb(NEW) - SENSITIVE_KEYS;
  ELSE
    v_action := 'deleted';
    v_before := to_jsonb(OLD) - SENSITIVE_KEYS;
    v_after  := NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  CASE TG_TABLE_NAME

    WHEN 'products' THEN
      v_product_id := COALESCE(NEW.id, OLD.id);
      v_label      := COALESCE(NEW.name, OLD.name);

    WHEN 'product_translations' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id), 'Product'
                      ) || ' · Translation (' || COALESCE(NEW.language, OLD.language) || ')';

    WHEN 'product_composition' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id), 'Product'
                      ) || ' · Ingredient · ' || COALESCE(NEW.ingredient_name, OLD.ingredient_name, '');

    WHEN 'product_serve_moments' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id), 'Product'
                      ) || ' · Serve Moment · ' || COALESCE(NEW.title, OLD.title, '');

    WHEN 'product_ai_pairings' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id), 'Product'
                      ) || ' · Pairing · ' || COALESCE(NEW.name, OLD.name, '');

    WHEN 'product_sections' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id), 'Product'
                      ) || ' · Section · ' || COALESCE(NEW.section_key, OLD.section_key, 'block');

    WHEN 'default_layout_sections' THEN
      v_product_id := NULL;
      v_label      := 'Default Layout · ' || COALESCE(NEW.section_key, OLD.section_key, 'Section');

    WHEN 'activations' THEN
      v_product_id := NULL;
      v_label      := 'Activation · ' || COALESCE(NEW.name, OLD.name, 'Untitled');

    ELSE
      v_product_id := NULL;
      v_label      := TG_TABLE_NAME;

  END CASE;

  INSERT INTO public.change_log
    (changed_by, changed_by_email, table_name, row_id, product_id, action, entity_label, before_data, after_data)
  VALUES
    (v_user_id, v_email, TG_TABLE_NAME,
     COALESCE(NEW.id, OLD.id),
     v_product_id, v_action, v_label, v_before, v_after);

  RETURN NULL;
END;
$$;
