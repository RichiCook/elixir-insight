ALTER TABLE public.scan_events
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city    text,
  ADD COLUMN IF NOT EXISTS region  text;
