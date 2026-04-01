
-- Create collaborations table
CREATE TABLE public.collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  brand_slug text NOT NULL UNIQUE,
  brand_logo_url text,
  brand_color text DEFAULT '#000000',
  contact_name text,
  contact_email text,
  event_name text,
  event_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read collaborations" ON public.collaborations FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert collaborations" ON public.collaborations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update collaborations" ON public.collaborations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete collaborations" ON public.collaborations FOR DELETE TO authenticated USING (true);

-- Add collaboration columns to products
ALTER TABLE public.products ADD COLUMN collaboration_id uuid REFERENCES public.collaborations(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN is_collaboration boolean DEFAULT false;
