
-- Brand images table
CREATE TABLE public.brand_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_size integer,
  width integer,
  height integer,
  uploaded_by text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.brand_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read brand_images" ON public.brand_images FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert brand_images" ON public.brand_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update brand_images" ON public.brand_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete brand_images" ON public.brand_images FOR DELETE TO authenticated USING (true);

-- Image attributes table
CREATE TABLE public.image_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES public.brand_images(id) ON DELETE CASCADE,
  product_slugs text[],
  alt_text_en text,
  alt_text_it text,
  scene_description text,
  cocktails_present text[],
  foods_present text[],
  props_present text[],
  people_present boolean,
  people_count integer,
  people_setting text,
  setting text,
  time_of_day text,
  season text,
  mood text[],
  dominant_colors text[],
  composition text,
  brightness text,
  best_for_sections text[],
  suitable_for_lines text[],
  is_alcoholic_context boolean,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.image_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved image_attributes" ON public.image_attributes FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Auth read all image_attributes" ON public.image_attributes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert image_attributes" ON public.image_attributes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update image_attributes" ON public.image_attributes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete image_attributes" ON public.image_attributes FOR DELETE TO authenticated USING (true);

-- Product images junction table
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  image_id uuid REFERENCES public.brand_images(id) ON DELETE CASCADE,
  section text NOT NULL,
  sort_order integer DEFAULT 0,
  UNIQUE(product_id, image_id, section)
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert product_images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update product_images" ON public.product_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete product_images" ON public.product_images FOR DELETE TO authenticated USING (true);

-- Public storage bucket for brand images
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-images', 'brand-images', true);

CREATE POLICY "Public read brand-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'brand-images');
CREATE POLICY "Auth upload brand-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-images');
CREATE POLICY "Auth update brand-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-images');
CREATE POLICY "Auth delete brand-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-images');
