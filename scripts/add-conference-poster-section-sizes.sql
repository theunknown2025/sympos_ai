-- Per-section width/height controls for poster layout
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS section_sizes JSONB NOT NULL DEFAULT '{}'::jsonb;
