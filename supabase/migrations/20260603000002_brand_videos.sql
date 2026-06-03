-- brand_videos table and storage bucket for uploaded video assets

CREATE TABLE IF NOT EXISTS public.brand_videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  filename     text NOT NULL,
  storage_path text NOT NULL,
  public_url   text NOT NULL,
  file_size    bigint,
  duration_s   numeric,          -- duration in seconds (optional, set client-side)
  thumbnail_url text,             -- optional poster frame URL
  status       text NOT NULL DEFAULT 'complete',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage brand_videos"
  ON public.brand_videos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage bucket for video assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-videos',
  'brand-videos',
  true,
  524288000,   -- 500 MB limit
  ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload/delete
CREATE POLICY "Auth users can upload brand videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-videos');

CREATE POLICY "Auth users can delete brand videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-videos');

CREATE POLICY "Public read brand videos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'brand-videos');
