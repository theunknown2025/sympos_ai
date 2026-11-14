-- Add template_id to conference_posters
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'classic-academic';

COMMENT ON COLUMN public.conference_posters.template_id IS
  'Poster layout template: classic-academic, modern-minimal, institutional-banner, elegant-symposium';
