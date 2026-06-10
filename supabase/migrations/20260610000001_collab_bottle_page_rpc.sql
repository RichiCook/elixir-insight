-- Extend get_bottle_page_data to support collaboration brand slugs.
-- When p_brand_slug is not found in the brands table, the function now
-- checks the collaborations table and resolves the product via the
-- collaboration_cocktails join table.  The JSON envelope is identical to
-- the regular brand path so BottlePage.tsx and useBottlePageData.ts need
-- no changes.
--
-- Also fixes the earlier (broken) security_hardening version which referenced
-- p.spirit_type, p.primary_color, p.secondary_color, p.active — none of which
-- exist on the products table.  The correct product columns come from types.ts.

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
  v_collab_id  uuid;
  v_product_id uuid;
  result       jsonb;
BEGIN

  -- ── PATH 1: regular brand ──────────────────────────────────────────────────
  SELECT id INTO v_brand_id
    FROM public.brands WHERE slug = p_brand_slug AND active = true;

  IF v_brand_id IS NOT NULL THEN
    SELECT id INTO v_product_id
      FROM public.products WHERE brand_id = v_brand_id AND slug = p_slug;
    IF v_product_id IS NULL THEN RETURN NULL; END IF;

    SELECT jsonb_build_object(

      'product', jsonb_build_object(
        'id',               p.id,
        'slug',             p.slug,
        'name',             p.name,
        'line',             p.line,
        'abv',              p.abv,
        'collaboration_id', p.collaboration_id,
        'is_collaboration', p.is_collaboration,
        'allergens_summary',p.allergens_summary,
        'bottle_color',     p.bottle_color,
        'completeness',     p.completeness,
        'created_at',       p.created_at,
        'ean_int',          p.ean_int,
        'flavour',          p.flavour,
        'food_pairing',     p.food_pairing,
        'garnish',          p.garnish,
        'glass',            p.glass,
        'hero_bg',          p.hero_bg,
        'ice',              p.ice,
        'label_color',      p.label_color,
        'liquid_color',     p.liquid_color,
        'occasion',         p.occasion,
        'product_link',     p.product_link,
        'serving',          p.serving,
        'spirit',           p.spirit,
        'uk_units',         p.uk_units,
        'updated_at',       p.updated_at
      ),

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

      'activations', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id',                    a.id,
          'name',                  a.name,
          'title',                 a.title,
          'type',                  a.type,
          'activation_type',       a.activation_type,
          'status',                a.status,
          'content',               a.content,
          'config',                a.config,
          'placement',             a.placement,
          'priority',              a.priority,
          'start_date',            a.start_date,
          'end_date',              a.end_date,
          'targeting_mode',        a.targeting_mode,
          'target_product_ids',    a.target_product_ids,
          'target_collection_ids', a.target_collection_ids,
          'brand_id',              a.brand_id,
          'created_at',            a.created_at,
          'updated_at',            a.updated_at
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
  END IF;

  -- ── PATH 2: collaboration brand ────────────────────────────────────────────
  SELECT id, brand_id INTO v_collab_id, v_brand_id
    FROM public.collaborations WHERE brand_slug = p_brand_slug;
  IF v_collab_id IS NULL THEN RETURN NULL; END IF;

  -- Resolve the product via the collaboration_cocktails join
  SELECT cc.product_id INTO v_product_id
    FROM public.collaboration_cocktails cc
    JOIN public.products p ON p.id = cc.product_id
    WHERE cc.collaboration_id = v_collab_id AND p.slug = p_slug
    LIMIT 1;
  IF v_product_id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(

    'product', jsonb_build_object(
      'id',               p.id,
      'slug',             p.slug,
      'name',             p.name,
      'line',             p.line,
      'abv',              p.abv,
      'collaboration_id', p.collaboration_id,
      'is_collaboration', p.is_collaboration,
      'allergens_summary',p.allergens_summary,
      'bottle_color',     p.bottle_color,
      'completeness',     p.completeness,
      'created_at',       p.created_at,
      'ean_int',          p.ean_int,
      'flavour',          p.flavour,
      'food_pairing',     p.food_pairing,
      'garnish',          p.garnish,
      'glass',            p.glass,
      'hero_bg',          p.hero_bg,
      'ice',              p.ice,
      'label_color',      p.label_color,
      'liquid_color',     p.liquid_color,
      'occasion',         p.occasion,
      'product_link',     p.product_link,
      'serving',          p.serving,
      'spirit',           p.spirit,
      'uk_units',         p.uk_units,
      'updated_at',       p.updated_at
    ),

    -- Brand presented as the collaboration identity
    'brand', jsonb_build_object(
      'id',            col.id,
      'name',          col.brand_name,
      'slug',          col.brand_slug,
      'logo_url',      col.brand_logo_url,
      'primary_color', col.brand_color,
      'description',   NULL::text,
      'website_url',   NULL::text
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

    -- Activations: filter by the collaboration's parent brand_id (e.g. Classy)
    'activations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',                    a.id,
        'name',                  a.name,
        'title',                 a.title,
        'type',                  a.type,
        'activation_type',       a.activation_type,
        'status',                a.status,
        'content',               a.content,
        'config',                a.config,
        'placement',             a.placement,
        'priority',              a.priority,
        'start_date',            a.start_date,
        'end_date',              a.end_date,
        'targeting_mode',        a.targeting_mode,
        'target_product_ids',    a.target_product_ids,
        'target_collection_ids', a.target_collection_ids,
        'brand_id',              a.brand_id,
        'created_at',            a.created_at,
        'updated_at',            a.updated_at
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

    -- Always expose the collaboration object for collab-path pages
    -- (uses collaborations_public view to exclude contact_name / contact_email)
    'collaboration', (SELECT row_to_json(cp.*) FROM collaborations_public cp WHERE cp.id = v_collab_id),

    'available_languages', COALESCE((
      SELECT jsonb_agg(DISTINCT pt2.language)
      FROM product_translations pt2 WHERE pt2.product_id = v_product_id
    ), '["EN"]')

  )
  INTO result
  FROM public.products p
  JOIN public.collaborations col ON col.id = v_collab_id
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.language = p_lang
  WHERE p.id = v_product_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bottle_page_data(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bottle_page_data(text, text, text) TO anon, authenticated;
