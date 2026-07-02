-- ============================================================
-- Campaign seed: "Classy @ Vivienne Westwood" event activation — 2026-06-18
--
-- A co-branded lead_capture activation (name + email) that reveals the VW20
-- discount on submit, placed before the store CTA on 7 specific products.
-- Product IDs are resolved by name at apply-time and the whole thing is
-- transactional: if any product name doesn't match, it raises and inserts
-- nothing (no half-targeted activation).
--
-- CLONE NOTE: campaign data, not schema. Strip this file when cloning the
-- platform for another brand (see CLONE_PLAYBOOK.md).
-- ============================================================

DO $$
DECLARE
  v_brand_id uuid;
  v_ids      uuid[] := '{}';
  v_missing  text[] := '{}';
  v_id       uuid;
  v_pat      text;
  -- DAIQUIR% covers the Daiquiri/Daiquiry spelling
  v_patterns text[] := ARRAY[
    'AMERICANO', 'COSMOPOLITAN', 'ESPRESSO MARTINI', 'DAIQUIR%',
    'SPICY PALOMA', 'NEGRONI', 'MARGARITA'
  ];
BEGIN
  SELECT id INTO v_brand_id FROM public.brands WHERE slug = 'classy' LIMIT 1;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Classy brand (slug=classy) not found';
  END IF;

  -- Idempotent: don't double-insert if re-applied.
  IF EXISTS (
    SELECT 1 FROM public.activations
    WHERE name = 'Classy @ Vivienne Westwood' AND brand_id = v_brand_id
  ) THEN
    RAISE NOTICE 'VW activation already exists — skipping insert';
    RETURN;
  END IF;

  FOREACH v_pat IN ARRAY v_patterns LOOP
    SELECT id INTO v_id
    FROM public.products
    WHERE brand_id = v_brand_id AND upper(name) LIKE v_pat
    ORDER BY name
    LIMIT 1;
    IF v_id IS NULL THEN
      v_missing := array_append(v_missing, v_pat);
    ELSE
      v_ids := array_append(v_ids, v_id);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Could not match products: %. Available Classy products: %',
      array_to_string(v_missing, ', '),
      (SELECT string_agg(upper(name), ', ' ORDER BY name)
         FROM public.products WHERE brand_id = v_brand_id);
  END IF;

  INSERT INTO public.activations (
    name, brand_id, activation_type, content, reward_code,
    targeting_mode, target_product_ids, target_collection_ids,
    placement, start_date, end_date, status, priority
  )
  VALUES (
    'Classy @ Vivienne Westwood',
    v_brand_id,
    'lead_capture',
    jsonb_build_object(
      'kicker',          'EXCLUSIVE EVENT OFFER',
      'title',           'An evening with Vivienne Westwood',
      'description',     'Leave your details to unlock a private discount, available for this event only.',
      'partner_name',    'VIVIENNE WESTWOOD',
      'show_classy',     true,
      'fields',          jsonb_build_array('name', 'email'),
      'submit_text',     'Reveal my code',
      'success_message', 'You''re on the list. Enjoy the evening.',
      'reward_label',    'Your exclusive discount',
      'reward_url',      'https://classycocktails.com/discount/VW20',
      'reward_cta',      'Claim your 20% off',
      'bg_color',        '#141319',
      'accent_color',    '#c5a35a',
      'text_color',      '#f4efe6',
      'text_muted',      '#9b9382',
      'border_color',    'rgba(197,163,90,0.35)'
    ),
    'VW20',
    'products',
    v_ids,
    '{}',
    'before_cta',
    NULL,
    NULL,
    'active',
    10
  );

  RAISE NOTICE 'Created VW activation targeting % products', array_length(v_ids, 1);
END $$;
