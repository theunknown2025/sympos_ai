-- Header collage: multiple images + layout template
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS header_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS header_collage_template TEXT;

-- Backfill from legacy single header_image_url
UPDATE public.conference_posters
SET header_images = jsonb_build_array(header_image_url)
WHERE header_image_url IS NOT NULL
  AND header_image_url <> ''
  AND (header_images IS NULL OR header_images = '[]'::jsonb);

UPDATE public.conference_posters
SET header_collage_template = 'single-hero'
WHERE header_image_url IS NOT NULL
  AND header_image_url <> ''
  AND (header_collage_template IS NULL OR header_collage_template = '');
