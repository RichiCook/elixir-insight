
-- Enums
CREATE TYPE activation_type AS ENUM ('text_image', 'video', 'banner_cta', 'custom_html', 'lead_capture', 'lead_capture_rating');
CREATE TYPE activation_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed');
CREATE TYPE targeting_mode AS ENUM ('products', 'collections');

-- Brands table
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON brands FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert brands" ON brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update brands" ON brands FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete brands" ON brands FOR DELETE TO authenticated USING (true);

-- Activations table
CREATE TABLE activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  activation_type activation_type NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  targeting_mode targeting_mode NOT NULL DEFAULT 'products',
  target_product_ids uuid[] DEFAULT '{}',
  target_collection_ids uuid[] DEFAULT '{}',
  placement text NOT NULL DEFAULT 'after_hero',
  start_date timestamptz,
  end_date timestamptz,
  status activation_status NOT NULL DEFAULT 'draft',
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active activations" ON activations FOR SELECT TO anon USING (status = 'active' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "Auth read activations" ON activations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert activations" ON activations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update activations" ON activations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete activations" ON activations FOR DELETE TO authenticated USING (true);

-- Activation leads table (for lead capture)
CREATE TABLE activation_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id uuid REFERENCES activations(id) ON DELETE CASCADE NOT NULL,
  product_slug text,
  session_id text,
  name text,
  email text,
  phone text,
  rating integer,
  custom_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activation_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert activation_leads" ON activation_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth insert activation_leads" ON activation_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read activation_leads" ON activation_leads FOR SELECT TO authenticated USING (true);
