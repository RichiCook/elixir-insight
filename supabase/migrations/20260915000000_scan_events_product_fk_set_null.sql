-- Allow deleting a drink that has been scanned. scan_events.product_id had no
-- ON DELETE clause, so any scanned product was undeletable (FK violation).
-- Keep the scan history (product_slug text stays) and just unlink the id.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.scan_events'::regclass
      AND con.contype = 'f'
      AND att.attname = 'product_id'
  LOOP
    EXECUTE format('ALTER TABLE public.scan_events DROP CONSTRAINT %I', c.conname);
  END LOOP;

  -- Only re-add the FK if the column is a uuid (an earlier migration may have made it text).
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'scan_events' AND column_name = 'product_id') = 'uuid' THEN
    ALTER TABLE public.scan_events
      ADD CONSTRAINT scan_events_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;
