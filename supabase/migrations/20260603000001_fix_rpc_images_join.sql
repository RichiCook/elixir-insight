-- Fix get_bottle_page_data: nest brand_images + image_attributes inside the images array
-- Previously returned flat product_images rows; consumer page needs brand_images.public_url
-- and brand_images.image_attributes[].is_approved to render hero/editorial/gallery images.

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
    'product',             row_to_json(p.*),
    'brand',               row_to_json(br.*),
    'translation',         row_to_json(pt.*),
    'composition',         COALESCE((
                             SELECT jsonb_agg(c ORDER BY c.sort_order)
                             FROM product_composition c WHERE c.product_id = v_product_id
                           ), '[]'),
    'serve_moments',       COALESCE((
                             SELECT jsonb_agg(s ORDER BY s.sort_order)
                             FROM product_serve_moments s WHERE s.product_id = v_product_id
                           ), '[]'),
    'sections',            COALESCE((
                             SELECT jsonb_agg(sec ORDER BY sec.sort_order)
                             FROM product_sections sec WHERE sec.product_id = v_product_id
                           ), '[]'),
    'images',              COALESCE((
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
                                     (SELECT jsonb_agg(ia)
                                      FROM image_attributes ia
                                      WHERE ia.image_id = bi.id),
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
    'activations',         COALESCE((
                             SELECT jsonb_agg(a)
                             FROM activations a
                             WHERE v_product_id = ANY(a.target_product_ids)
                               AND a.brand_id = v_brand_id
                               AND a.status   = 'active'
                               AND (a.start_date IS NULL OR a.start_date <= now())
                               AND (a.end_date   IS NULL OR a.end_date   >  now())
                           ), '[]'),
    'pairings',            COALESCE((
                             SELECT jsonb_agg(pa ORDER BY pa.sort_order)
                             FROM product_ai_pairings pa WHERE pa.product_id = v_product_id
                           ), '[]'),
    'nutrition',           (SELECT get_product_nutrition(v_product_id)),
    'collaboration',       (SELECT row_to_json(col.*)
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
