-- ============================================================
-- Custom catalogues — co-branded collection landing pages — 2026-06-18
--
-- A catalogue is a presentation layer over existing products: one designed
-- landing page (/collab/<slug>) showing an ordered set of products as cards
-- plus an optional embedded activation (e.g. the VW20 lead capture). It does
-- not duplicate product data — cards link to each product's bottle page.
--
-- CLONE NOTE: the table is generic infra; the seeded VW row is campaign data —
-- clear it when cloning for another brand (see CLONE_PLAYBOOK.md).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.catalogues (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         uuid        REFERENCES public.brands(id),
  slug             text        NOT NULL UNIQUE,
  title            text,
  kicker           text,
  intro            text,
  partner_name     text,
  partner_logo_url text,
  show_classy      boolean     NOT NULL DEFAULT true,
  bg_color         text,
  accent_color     text,
  text_color       text,
  text_muted       text,
  product_ids      uuid[]      NOT NULL DEFAULT '{}',
  activation_id    uuid        REFERENCES public.activations(id) ON DELETE SET NULL,
  status           text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalogues ENABLE ROW LEVEL SECURITY;

-- Admins manage; the public reads only active catalogues, via the RPC below.
CREATE POLICY "Admins manage catalogues" ON public.catalogues FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- One call returns everything the landing page needs.
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
      JOIN products p ON p.id = ids.pid AND p.active = true
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

-- ── Seed: Classy × Vivienne Westwood catalogue ──────────────────────────────
DO $$
DECLARE
  v_brand_id     uuid;
  v_activation   uuid;
  v_ids          uuid[] := '{}';
  v_missing      text[] := '{}';
  v_id           uuid;
  v_pat          text;
  -- Display order chosen by the brand. DAIQUIR% covers the Daiquiri/Daiquiry spelling.
  v_patterns     text[] := ARRAY[
    'AMERICANO', 'COSMOPOLITAN', 'ESPRESSO MARTINI', 'DAIQUIR%',
    'SPICY PALOMA', 'NEGRONI', 'MARGARITA'
  ];
BEGIN
  SELECT id INTO v_brand_id FROM public.brands WHERE slug = 'classy' LIMIT 1;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Classy brand not found'; END IF;

  IF EXISTS (SELECT 1 FROM public.catalogues WHERE slug = 'vivienne-westwood') THEN
    RAISE NOTICE 'VW catalogue already exists — skipping seed';
    RETURN;
  END IF;

  FOREACH v_pat IN ARRAY v_patterns LOOP
    SELECT id INTO v_id FROM public.products
      WHERE brand_id = v_brand_id AND upper(name) LIKE v_pat ORDER BY name LIMIT 1;
    IF v_id IS NULL THEN v_missing := array_append(v_missing, v_pat);
    ELSE v_ids := array_append(v_ids, v_id); END IF;
  END LOOP;

  IF array_length(v_missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Could not match products: %', array_to_string(v_missing, ', ');
  END IF;

  SELECT id INTO v_activation FROM public.activations
    WHERE name = 'Classy @ Vivienne Westwood' AND brand_id = v_brand_id LIMIT 1;

  INSERT INTO public.catalogues (
    brand_id, slug, title, kicker, intro,
    partner_name, show_classy,
    bg_color, accent_color, text_color, text_muted,
    product_ids, activation_id, status
  ) VALUES (
    v_brand_id,
    'vivienne-westwood',
    'The Collection',
    'LIMITED-EDITION COLLABORATION',
    'Seven signature serves, bottled in Italy and dressed for the occasion. Tap any cocktail to open its digital passport.',
    'VIVIENNE WESTWOOD',
    true,
    '#0c0b0f', '#c5a35a', '#f4efe6', '#9b9382',
    v_ids,
    v_activation,
    'active'
  );

  RAISE NOTICE 'Seeded VW catalogue with % products (activation: %)',
    array_length(v_ids, 1), coalesce(v_activation::text, 'none');
END $$;
