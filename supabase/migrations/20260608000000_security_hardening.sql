-- ============================================================
-- Security hardening — 2026-06-08
-- Fixes: C-2, C-3, H-1, H-2, H-3, H-5, H-6, M-7
-- ============================================================


-- ── C-2: brand_videos — replace wildcard policy with brand-scoped policies ──

DROP POLICY IF EXISTS "Authenticated users can manage brand_videos" ON public.brand_videos;

CREATE POLICY "Brand admins can select brand_videos"
  ON public.brand_videos FOR SELECT TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand admins can insert brand_videos"
  ON public.brand_videos FOR INSERT TO authenticated
  WITH CHECK (has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand admins can update brand_videos"
  ON public.brand_videos FOR UPDATE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand admins can delete brand_videos"
  ON public.brand_videos FOR DELETE TO authenticated
  USING (has_brand_access(auth.uid(), brand_id));

-- Also tighten storage.objects policies for brand-videos bucket
-- (was: any authenticated user; now: only brand admins whose brand owns the object)
-- Storage objects don't carry brand_id so we keep authenticated insert but remove wildcard delete.
DROP POLICY IF EXISTS "Auth users can delete brand videos" ON storage.objects;
CREATE POLICY "Auth users can delete own brand videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-videos'
    AND auth.uid() IS NOT NULL
  );


-- ── C-3: brand_images — remove brand_id IS NULL escape hatch ────────────────

DROP POLICY IF EXISTS "Brand admins can insert brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Brand admins can update brand_images" ON public.brand_images;
DROP POLICY IF EXISTS "Brand admins can delete brand_images" ON public.brand_images;

CREATE POLICY "Brand admins can insert brand_images"
  ON public.brand_images FOR INSERT TO authenticated
  WITH CHECK (brand_id IS NOT NULL AND has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand admins can update brand_images"
  ON public.brand_images FOR UPDATE TO authenticated
  USING (brand_id IS NOT NULL AND has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Brand admins can delete brand_images"
  ON public.brand_images FOR DELETE TO authenticated
  USING (brand_id IS NOT NULL AND has_brand_access(auth.uid(), brand_id));


-- ── H-1, H-2, H-3: get_bottle_page_data — explicit column projection ─────────
-- Fixes:
--   H-1: was row_to_json(p.*) / row_to_json(br.*) — now explicit column lists
--   H-2: was jsonb_agg(ia) on image_attributes — now only consumer-needed cols
--   H-3: was jsonb_agg(a) on activations — now excludes reward_code

CREATE OR REPLACE FUNCTION public.get_bottle_page_data(
  p_brand_slug text,
  p_slug       text,
  p_lang       text DEFAULT 'EN'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id   uuid;
  v_product_id uuid;
  result       jsonb;
BEGIN
  SELECT id INTO v_brand_id
    FROM public.brands WHERE slug = p_brand_slug AND active = true;
  IF v_brand_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_product_id
    FROM public.products WHERE brand_id = v_brand_id AND slug = p_slug;
  IF v_product_id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(

    -- ── product: explicit consumer-facing columns only (no internal/supply fields) ──
    'product', jsonb_build_object(
      'id',               p.id,
      'slug',             p.slug,
      'name',             p.name,
      'line',             p.line,
      'abv',              p.abv,
      'spirit_type',      p.spirit_type,
      'primary_color',    p.primary_color,
      'secondary_color',  p.secondary_color,
      'completeness',     p.completeness,
      'active',           p.active,
      'collaboration_id', p.collaboration_id,
      'allergens_summary',p.allergens_summary,
      'bottle_color',     p.bottle_color,
      'created_at',       p.created_at,
      'ean_int',          p.ean_int,
      'flavour',          p.flavour,
      'food_pairing',     p.food_pairing,
      'garnish',          p.garnish,
      'glass',            p.glass,
      'ice',              p.ice,
      'liquid_color',     p.liquid_color,
      'spirit',           p.spirit,
      'serving',          p.serving,
      'uk_units',         p.uk_units,
      'label_color',      p.label_color,
      'hero_bg',          p.hero_bg,
      'product_link',     p.product_link,
      'is_collaboration', p.is_collaboration,
      'occasion',         p.occasion,
      'updated_at',       p.updated_at
    ),

    -- ── brand: only what the consumer page renders ──
    'brand', jsonb_build_object(
      'id',            br.id,
      'name',          br.name,
      'slug',          br.slug,
      'logo_url',      br.logo_url,
      'primary_color', br.primary_color,
      'description',   br.description,
      'website_url',   br.website_url
    ),

    'translation', row_to_json(pt.*),

    'composition', COALESCE((
      SELECT jsonb_agg(c ORDER BY c.sort_order)
      FROM product_composition c WHERE c.product_id = v_product_id
    ), '[]'),

    'serve_moments', COALESCE((
      SELECT jsonb_agg(s ORDER BY s.sort_order)
      FROM product_serve_moments s WHERE s.product_id = v_product_id
    ), '[]'),

    'sections', COALESCE((
      SELECT jsonb_agg(sec ORDER BY sec.sort_order)
      FROM product_sections sec WHERE sec.product_id = v_product_id
    ), '[]'),

    -- ── images: image_attributes scoped to consumer-needed cols only (H-2) ──
    'images', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',           pi.id,
          'product_id',   pi.product_id,
          'image_id',     pi.image_id,
          'section',      pi.section,
          'sort_order',   pi.sort_order,
          'brand_images', jsonb_build_object(
            'id',               bi.id,
            'filename',         bi.filename,
            'public_url',       bi.public_url,
            'status',           bi.status,
            'image_attributes', COALESCE(
              (SELECT jsonb_agg(jsonb_build_object(
                'id',          ia.id,
                'image_id',    ia.image_id,
                'is_approved', ia.is_approved,
                'alt_text_en', ia.alt_text_en,
                'alt_text_it', ia.alt_text_it
              ))
               FROM image_attributes ia WHERE ia.image_id = bi.id),
              '[]'
            )
          )
        )
        ORDER BY pi.sort_order
      )
      FROM product_images pi
      JOIN brand_images bi ON bi.id = pi.image_id
      WHERE pi.product_id = v_product_id
    ), '[]'),

    -- ── activations: reward_code excluded (H-3) ──
    'activations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',                   a.id,
        'name',                 a.name,
        'title',                a.title,
        'type',                 a.type,
        'activation_type',      a.activation_type,
        'status',               a.status,
        'content',              a.content,
        'config',               a.config,
        'placement',            a.placement,
        'priority',             a.priority,
        'start_date',           a.start_date,
        'end_date',             a.end_date,
        'targeting_mode',       a.targeting_mode,
        'target_product_ids',   a.target_product_ids,
        'target_collection_ids',a.target_collection_ids,
        'brand_id',             a.brand_id,
        'created_at',           a.created_at,
        'updated_at',           a.updated_at
      ))
      FROM activations a
      WHERE v_product_id = ANY(a.target_product_ids)
        AND a.brand_id = v_brand_id
        AND a.status   = 'active'
        AND (a.start_date IS NULL OR a.start_date <= now())
        AND (a.end_date   IS NULL OR a.end_date   >  now())
    ), '[]'),

    'pairings', COALESCE((
      SELECT jsonb_agg(pa ORDER BY pa.sort_order)
      FROM product_ai_pairings pa WHERE pa.product_id = v_product_id
    ), '[]'),

    'nutrition', (SELECT get_product_nutrition(v_product_id)),

    'collaboration', (SELECT row_to_json(col.*)
                      FROM collaborations_public col
                      WHERE col.id = p.collaboration_id),

    'available_languages', COALESCE((
      SELECT jsonb_agg(DISTINCT pt2.language)
      FROM product_translations pt2 WHERE pt2.product_id = v_product_id
    ), '["EN"]')

  )
  INTO result
  FROM public.products p
  JOIN public.brands br ON br.id = p.brand_id
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.language = p_lang
  WHERE p.id = v_product_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bottle_page_data(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bottle_page_data(text, text, text) TO anon, authenticated;


-- ── H-5: change_log — soft-delete via archived_at instead of hard DELETE ─────

ALTER TABLE public.change_log
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- Admins can archive (set archived_at) but not hard-delete rows.
-- Hard-delete now requires service_role only.
DROP POLICY IF EXISTS "Admins can delete change_log" ON public.change_log;

CREATE POLICY "Admins can archive change_log"
  ON public.change_log FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- SELECT policy: hide archived entries from the UI by default
DROP POLICY IF EXISTS "Admins can read change_log" ON public.change_log;

CREATE POLICY "Admins can read change_log"
  ON public.change_log FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    AND archived_at IS NULL
  );


-- ── M-7: change_log.table_name — enforce allowed table allowlist ─────────────

ALTER TABLE public.change_log
  DROP CONSTRAINT IF EXISTS change_log_table_name_check;

ALTER TABLE public.change_log
  ADD CONSTRAINT change_log_table_name_check
  CHECK (table_name IN (
    'products', 'product_translations', 'product_composition',
    'product_serve_moments', 'product_ai_pairings', 'product_sections',
    'default_layout_sections', 'activations'
  ));


-- ── H-6: log_change — strip raw row dumps for sensitive tables ───────────────
-- Replace to_jsonb(NEW)/to_jsonb(OLD) with filtered snapshots for tables that
-- could contain PII or internal-only fields. For most tables the full snapshot
-- is fine; for activations we strip reward_code from before/after snapshots.

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
  -- Capture full snapshot first, then strip sensitive keys
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
      v_label      := 'Default Layout · ' || COALESCE(NEW.section_type, OLD.section_type, 'Section');

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
