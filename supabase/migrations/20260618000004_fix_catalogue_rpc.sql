-- ============================================================
-- Fix get_catalogue_data — products has no `active` column — 2026-06-18
--
-- The products join referenced p.active (which doesn't exist), so the RPC
-- errored with 42703. Catalogue products are explicitly curated by an admin,
-- so no visibility filter is needed — recreate the function without it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_catalogue_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat  public.catalogues;
  result jsonb;
BEGIN
  SELECT * INTO v_cat FROM public.catalogues WHERE slug = p_slug AND status = 'active';
  IF v_cat.id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'catalogue', jsonb_build_object(
      'slug',             v_cat.slug,
      'title',            v_cat.title,
      'kicker',           v_cat.kicker,
      'intro',            v_cat.intro,
      'partner_name',     v_cat.partner_name,
      'partner_logo_url', v_cat.partner_logo_url,
      'show_classy',      v_cat.show_classy,
      'bg_color',         v_cat.bg_color,
      'accent_color',     v_cat.accent_color,
      'text_color',       v_cat.text_color,
      'text_muted',       v_cat.text_muted
    ),
    'products', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',           p.id,
        'name',         p.name,
        'slug',         p.slug,
        'line',         p.line,
        'abv',          p.abv,
        'liquid_color', p.liquid_color,
        'image_url', (
          SELECT bi.public_url
          FROM product_images pim
          JOIN brand_images bi ON bi.id = pim.image_id
          WHERE pim.product_id = p.id
          ORDER BY (lower(coalesce(pim.section, '')) = 'hero') DESC, pim.sort_order ASC
          LIMIT 1
        )
      ) ORDER BY ids.ord)
      FROM unnest(v_cat.product_ids) WITH ORDINALITY AS ids(pid, ord)
      JOIN products p ON p.id = ids.pid
    ), '[]'::jsonb),
    'activation', (
      SELECT to_jsonb(a) FROM activations a
      WHERE a.id = v_cat.activation_id AND a.status = 'active'
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalogue_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catalogue_data(text) TO anon, authenticated;
