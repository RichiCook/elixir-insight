
ALTER TABLE public.product_technical_data
  ADD COLUMN IF NOT EXISTS colour text,
  ADD COLUMN IF NOT EXISTS trans_fats text,
  ADD COLUMN IF NOT EXISTS recommended_dosage text,
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS supplier_address text,
  ADD COLUMN IF NOT EXISTS supplier_phone text,
  ADD COLUMN IF NOT EXISTS supplier_email text,
  ADD COLUMN IF NOT EXISTS supplier_vat text,
  ADD COLUMN IF NOT EXISTS document_revision text,
  ADD COLUMN IF NOT EXISTS document_date text;
