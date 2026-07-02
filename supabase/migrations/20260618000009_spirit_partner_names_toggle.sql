-- Add toggle to show/hide spirit partner names alongside logos
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_spirit_partner_names boolean NOT NULL DEFAULT false;
