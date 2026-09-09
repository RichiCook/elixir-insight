-- Dedicated logo for the centre of QR codes (optional). NULL = fall back to brands.logo_url.
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS qr_logo_url text;
COMMENT ON COLUMN public.brands.qr_logo_url IS 'Optional logo shown inside QR codes only; NULL falls back to logo_url.';
