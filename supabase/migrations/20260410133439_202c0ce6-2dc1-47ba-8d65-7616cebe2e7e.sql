
-- 1. Make repair-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'repair-photos';

-- 2. Drop existing overly permissive storage policies for repair-photos
DROP POLICY IF EXISTS "Anyone can view repair photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read repair-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload repair photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload repair photos" ON storage.objects;

-- 3. Create admin-only SELECT policy for repair-photos
CREATE POLICY "Admin read repair-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'repair-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Keep anon INSERT for repair-photos (customers submit photos)
CREATE POLICY "Public insert repair-photos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'repair-photos');

CREATE POLICY "Auth insert repair-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repair-photos');

-- 5. Drop overly permissive tech-sheets policies
DROP POLICY IF EXISTS "Authenticated users can upload tech sheets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete tech sheets" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload tech-sheets" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete tech-sheets" ON storage.objects;

-- 6. Create role-restricted policies for tech-sheets
CREATE POLICY "Admin/Supply upload tech-sheets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tech-sheets' AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'supply'::app_role]));

CREATE POLICY "Admin/Supply delete tech-sheets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tech-sheets' AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'supply'::app_role]));
