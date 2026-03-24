
ALTER TABLE product_technical_data
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'SUPPLIER_TECH_SHEET',
  ADD COLUMN IF NOT EXISTS batch_number text,
  ADD COLUMN IF NOT EXISTS label_date text,
  ADD COLUMN IF NOT EXISTS total_acidity text,
  ADD COLUMN IF NOT EXISTS alcoholic_strength text,
  ADD COLUMN IF NOT EXISTS sodium_mg text,
  ADD COLUMN IF NOT EXISTS additional_information text,
  ADD COLUMN IF NOT EXISTS compliance_regulation_1 text,
  ADD COLUMN IF NOT EXISTS compliance_regulation_2 text,
  ADD COLUMN IF NOT EXISTS compliance_regulation_3 text,
  ADD COLUMN IF NOT EXISTS laboratory_name text,
  ADD COLUMN IF NOT EXISTS laboratory_address text,
  ADD COLUMN IF NOT EXISTS test_report_number text,
  ADD COLUMN IF NOT EXISTS accreditation_number text;
