-- change_log table for admin audit trail
-- Stores every insert/update/delete on key content tables via triggers

CREATE TABLE public.change_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email text,                          -- snapshot at time of change
  table_name       text        NOT NULL,
  row_id           uuid        NOT NULL,
  product_id       uuid,                          -- denormalised for fast per-product queries
  action           text        NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  entity_label     text,                          -- human-readable, e.g. "Negroni · Translation (EN)"
  before_data      jsonb,
  after_data       jsonb,
  changed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX change_log_product_idx    ON public.change_log (product_id,  changed_at DESC);
CREATE INDEX change_log_changed_by_idx ON public.change_log (changed_by,  changed_at DESC);
CREATE INDEX change_log_changed_at_idx ON public.change_log (changed_at  DESC);

ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read; triggers insert via SECURITY DEFINER so no direct-insert policy needed
CREATE POLICY "Admins can read change_log"
  ON public.change_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete (dismiss) log entries
CREATE POLICY "Admins can delete change_log"
  ON public.change_log FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
