
-- Repair settings table (one row per brand/global config)
CREATE TABLE public.repair_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  repair_email text,
  email_template_fields jsonb NOT NULL DEFAULT '[
    {"key":"product_name","label":"Product name & SKU","enabled":true,"sort_order":0,"type":"text","custom":false},
    {"key":"damage_type","label":"Damage type","enabled":true,"sort_order":1,"type":"text","custom":false},
    {"key":"damage_photos","label":"Damage photos (attached)","enabled":true,"sort_order":2,"type":"text","custom":false},
    {"key":"customer_email","label":"Customer email","enabled":true,"sort_order":3,"type":"text","custom":false},
    {"key":"customer_name","label":"Customer name","enabled":true,"sort_order":4,"type":"text","custom":false},
    {"key":"customer_location","label":"Customer country & city","enabled":true,"sort_order":5,"type":"text","custom":false},
    {"key":"warranty_status","label":"Warranty status","enabled":true,"sort_order":6,"type":"text","custom":false},
    {"key":"estimated_cost","label":"Estimated repair cost","enabled":true,"sort_order":7,"type":"text","custom":false},
    {"key":"request_date","label":"Date of request","enabled":true,"sort_order":8,"type":"text","custom":false}
  ]'::jsonb,
  repair_centre_address text DEFAULT 'Casadei S.p.A. — Repair Service
Via Tessenara 5/7
47833 Morciano di Romagna (RN), Italy',
  estimated_turnaround text DEFAULT '10–15 working days after receipt',
  damage_types jsonb NOT NULL DEFAULT '[
    {"name":"Heel damage","description":"Blade heel scratches, loosening, or re-plating"},
    {"name":"Upper fabric","description":"Lace tears, snagging, or staining"},
    {"name":"Sole wear","description":"Outsole damage or re-soling needed"},
    {"name":"Other","description":"General wear, hardware, or other issues"}
  ]'::jsonb,
  pricing_rules jsonb NOT NULL DEFAULT '[
    {"damage_type":"Heel damage","min_price":80,"max_price":150},
    {"damage_type":"Upper fabric","min_price":60,"max_price":120},
    {"damage_type":"Sole wear","min_price":50,"max_price":100},
    {"damage_type":"Other","min_price":40,"max_price":200}
  ]'::jsonb,
  return_shipping_cost numeric NOT NULL DEFAULT 15,
  warranty_covers_repair boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.repair_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read repair_settings" ON public.repair_settings FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert repair_settings" ON public.repair_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update repair_settings" ON public.repair_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete repair_settings" ON public.repair_settings FOR DELETE TO authenticated USING (true);

-- Repair request status enum
CREATE TYPE public.repair_request_status AS ENUM (
  'submitted', 'reviewing', 'approved', 'in_repair', 'shipped_back', 'completed', 'cancelled'
);

-- Repair requests table
CREATE TABLE public.repair_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  damage_type text NOT NULL,
  photos text[] DEFAULT '{}',
  country text,
  city text,
  warranty_status text DEFAULT 'unknown',
  estimated_cost_min numeric,
  estimated_cost_max numeric,
  status public.repair_request_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert repair_requests" ON public.repair_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth insert repair_requests" ON public.repair_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read repair_requests" ON public.repair_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth update repair_requests" ON public.repair_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete repair_requests" ON public.repair_requests FOR DELETE TO authenticated USING (true);

-- Storage bucket for repair photos
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-photos', 'repair-photos', true);

CREATE POLICY "Anyone can upload repair photos" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'repair-photos');
CREATE POLICY "Anyone can upload repair photos auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'repair-photos');
CREATE POLICY "Public read repair photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'repair-photos');
