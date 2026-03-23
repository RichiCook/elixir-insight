
-- Create storage bucket for tech sheets
INSERT INTO storage.buckets (id, name, public) VALUES ('tech-sheets', 'tech-sheets', false);

-- Allow authenticated users to upload to tech-sheets bucket
CREATE POLICY "Auth upload tech-sheets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tech-sheets');
CREATE POLICY "Auth read tech-sheets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'tech-sheets');
CREATE POLICY "Auth delete tech-sheets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tech-sheets');
