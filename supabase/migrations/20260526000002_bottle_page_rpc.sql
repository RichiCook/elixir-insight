-- Sprint 2 H3: Consolidate BottlePage waterfall (10 queries → 1 RPC)
--
-- get_bottle_page_data returns all data needed to render the consumer
-- bottle page in a single round-trip. Accessible by anon (no auth needed).

CREATE OR REPLACE FUNCTION public.get_bottle_page_data(
  p_slug text,
  p_lang text DEFAULT 'EN'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  result       jsonb;
BEGIN
  -- Resolve slug → id (must be active)
  SELECT id INTO v_product_id
  FROM products
  WHERE slug = p_slug AND active = true;

  IF v_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    -- Core product row
    'product',        row_to_json(p.*),

    -- Single translation for requested language
    'translation',    row_to_json(pt.*),

    -- Ordered child rows
    'composition',    COALESCE((
                        SELECT jsonb_agg(c ORDER BY c.sort_order)
                        FROM product_composition c
                        WHERE c.product_id = v_product_id
                      ), '[]'::jsonb),

    'serve_moments',  COALESCE((
                        SELECT jsonb_agg(s ORDER BY s.sort_order)
                        FROM product_serve_moments s
                        WHERE s.product_id = v_product_id
                      ), '[]'::jsonb),

    'sections',       COALESCE((
                        SELECT jsonb_agg(sec ORDER BY sec.sort_order)
                        FROM product_sections sec
                        WHERE sec.product_id = v_product_id
                      ), '[]'::jsonb),

    'pairings',       COALESCE((
                        SELECT jsonb_agg(pa ORDER BY pa.sort_order)
                        FROM product_ai_pairings pa
                        WHERE pa.product_id = v_product_id
                      ), '[]'::jsonb),

    -- Images with nested brand_images + image_attributes
    'images',         COALESCE((
                        SELECT jsonb_agg(
                          jsonb_build_object(
                            'id',          pi.id,
                            'product_id',  pi.product_id,
                            'image_id',    pi.image_id,
                            'section',     pi.section,
                            'sort_order',  pi.sort_order,
                            'brand_images', jsonb_build_object(
                              'id',               bi.id,
                              'filename',         bi.filename,
                              'public_url',       bi.public_url,
                              'status',           bi.status,
                              'image_attributes', COALESCE((
                                SELECT jsonb_agg(ia.*)
                                FROM image_attributes ia
                                WHERE ia.image_id = bi.id
                              ), '[]'::jsonb)
                            )
                          )
                          ORDER BY pi.sort_order
                        )
                        FROM product_images pi
                        JOIN brand_images bi ON bi.id = pi.image_id
                        WHERE pi.product_id = v_product_id
                      ), '[]'::jsonb),

    -- Active activations that target this product
    'activations',    COALESCE((
                        SELECT jsonb_agg(a.*)
                        FROM activations a
                        WHERE a.status = 'active'
                          AND v_product_id = ANY(a.target_product_ids)
                          AND (a.start_date IS NULL OR a.start_date <= now())
                          AND (a.end_date IS NULL OR a.end_date >= now())
                      ), '[]'::jsonb),

    -- Nutrition via existing (already-fixed) RPC
    'nutrition',      public.get_product_nutrition(v_product_id),

    -- Collaboration linked via products.collaboration_id
    'collaboration',  (
                        SELECT row_to_json(col.*)
                        FROM collaborations_public col
                        WHERE col.id = p.collaboration_id
                        LIMIT 1
                      ),

    -- Languages that have at least one translation row
    'available_languages', COALESCE((
                        SELECT jsonb_agg(pt2.language)
                        FROM product_translations pt2
                        WHERE pt2.product_id = v_product_id
                      ), '["EN"]'::jsonb)
  )
  INTO result
  FROM products p
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.language = p_lang
  WHERE p.id = v_product_id;

  RETURN result;
END;
$$;

-- Only anon + authenticated may call this (no service_role needed from browser)
REVOKE ALL ON FUNCTION public.get_bottle_page_data(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bottle_page_data(text, text) TO anon, authenticated;
