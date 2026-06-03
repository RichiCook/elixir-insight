
-- Add missing columns to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name TEXT;

-- Add translations column to product_serve_moments
ALTER TABLE public.product_serve_moments ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Add translations column to product_ai_pairings
ALTER TABLE public.product_ai_pairings ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Add missing columns to product_serve_moments for consumer display
ALTER TABLE public.product_serve_moments ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE public.product_serve_moments ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Add missing columns to product_ai_pairings for consumer display
ALTER TABLE public.product_ai_pairings ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE public.product_ai_pairings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add missing columns to product_translations
ALTER TABLE public.product_translations ADD COLUMN IF NOT EXISTS allergens_local TEXT;
ALTER TABLE public.product_translations ADD COLUMN IF NOT EXISTS claim TEXT;
ALTER TABLE public.product_translations ADD COLUMN IF NOT EXISTS ingredient_list_full TEXT;
ALTER TABLE public.product_translations ADD COLUMN IF NOT EXISTS ingredient_list_short TEXT;
ALTER TABLE public.product_translations ADD COLUMN IF NOT EXISTS sensory_description TEXT;

-- Add missing columns to products for consumer display
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allergens_summary TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bottle_color TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collaboration_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS completeness INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ean_int TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS food_pairing TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS garnish TEXT;

-- Add missing column to scan_events
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS product_id TEXT;

-- Create get_bottle_page_data RPC if not exists
CREATE OR REPLACE FUNCTION public.get_bottle_page_data(p_brand_slug TEXT, p_slug TEXT, p_lang TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'product', row_to_json(p.*),
    'brand', row_to_json(b.*),
    'translation', row_to_json(t.*),
    'composition', (SELECT jsonb_agg(row_to_json(c.*)) FROM public.product_composition c WHERE c.product_id = p.id),
    'serve_moments', (SELECT jsonb_agg(row_to_json(sm.*)) FROM public.product_serve_moments sm WHERE sm.product_id = p.id ORDER BY sm.sort_order),
    'pairings', (SELECT jsonb_agg(row_to_json(ap.*)) FROM public.product_ai_pairings ap WHERE ap.product_id = p.id ORDER BY ap.sort_order),
    'certifications', (SELECT jsonb_agg(row_to_json(pc.*)) FROM public.product_certifications pc WHERE pc.product_id = p.id),
    'sections', (SELECT jsonb_agg(row_to_json(ps.*)) FROM public.product_sections ps WHERE ps.product_id = p.id ORDER BY ps.sort_order),
    'collaboration', (SELECT row_to_json(col.*) FROM public.collaborations col WHERE col.id = p.collaboration_id)
  ) INTO result
  FROM public.products p
  JOIN public.brands b ON b.id = p.brand_id
  LEFT JOIN public.product_translations t ON t.product_id = p.id AND t.language = p_lang
  WHERE b.slug = p_brand_slug AND p.slug = p_slug;
  
  RETURN result;
END;
$$;
