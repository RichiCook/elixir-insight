-- ============================================================
-- Catalogue short links — 2026-06-18
--
-- Adds a short_code so a catalogue is reachable at /c/<code> (e.g. /c/vw) as
-- well as /collab/<slug>. get_catalogue_data resolves by slug OR short_code so
-- both routes hit the same page. A QR in the admin encodes the short link.
-- ============================================================

ALTER TABLE public.catalogues ADD COLUMN IF NOT EXISTS short_code text;
CREATE UNIQUE INDEX IF NOT EXISTS catalogues_short_code_key
  ON public.catalogues (lower(short_code)) WHERE short_code IS NOT NULL;

UPDATE public.catalogues SET short_code = 'vw'
  WHERE slug = 'vivienne-westwood' AND short_code IS NULL;

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
  -- Match by slug or short_code; prefer an exact slug match if both exist.
  SELECT * INTO v_cat FROM public.catalogues
  WHERE (slug = p_slug OR lower(short_code) = lower(p_slug)) AND status = 'active'
  ORDER BY (slug = p_slug) DESC
  LIMIT 1;
  IF v_cat.id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'catalogue', jsonb_build_object(
      'slug',             v_cat.slug,
      'short_code',       v_cat.short_code,
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
