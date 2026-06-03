-- Trigger function that fires after INSERT / UPDATE / DELETE on audited tables
-- Uses SECURITY DEFINER so it can read auth.users.email and write to change_log

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
BEGIN
  -- Determine action and before/after snapshots
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_before := NULL;
    v_after  := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
  ELSE
    v_action := 'deleted';
    v_before := to_jsonb(OLD);
    v_after  := NULL;
  END IF;

  -- Snapshot caller email (may be NULL for service-role calls)
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Resolve product_id and a human-readable label per table
  CASE TG_TABLE_NAME

    WHEN 'products' THEN
      v_product_id := COALESCE(NEW.id, OLD.id);
      v_label      := COALESCE(NEW.name, OLD.name);

    WHEN 'product_translations' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id),
                        'Product'
                      ) || ' · Translation (' || COALESCE(NEW.language, OLD.language) || ')';

    WHEN 'product_composition' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id),
                        'Product'
                      ) || ' · Ingredient · ' || COALESCE(NEW.ingredient, OLD.ingredient, '');

    WHEN 'product_serve_moments' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id),
                        'Product'
                      ) || ' · Serve Moment · ' || COALESCE(NEW.title, OLD.title, '');

    WHEN 'product_ai_pairings' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id),
                        'Product'
                      ) || ' · Pairing · ' || COALESCE(NEW.name, OLD.name, '');

    WHEN 'product_sections' THEN
      v_product_id := COALESCE(NEW.product_id, OLD.product_id);
      v_label      := COALESCE(
                        (SELECT name FROM products WHERE id = v_product_id),
                        'Product'
                      ) || ' · Section · ' || COALESCE(NEW.title, OLD.title, 'Untitled');

    WHEN 'default_layout_sections' THEN
      v_product_id := NULL;
      v_label      := 'Default Layout · ' || COALESCE(NEW.section_type, OLD.section_type, 'Section');

    WHEN 'activations' THEN
      v_product_id := NULL;
      v_label      := 'Activation · ' || COALESCE(NEW.title, OLD.title, 'Untitled');

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

-- Create AFTER triggers on all audited tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products',
    'product_translations',
    'product_composition',
    'product_serve_moments',
    'product_ai_pairings',
    'product_sections',
    'default_layout_sections',
    'activations'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER change_log_%1$s
       AFTER INSERT OR UPDATE OR DELETE ON public.%1$s
       FOR EACH ROW EXECUTE FUNCTION public.log_change()',
      t
    );
  END LOOP;
END $$;
