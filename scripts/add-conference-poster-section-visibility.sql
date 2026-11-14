-- Per-section visibility toggles for poster layout
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS section_visibility JSONB NOT NULL DEFAULT '{}'::jsonb;
