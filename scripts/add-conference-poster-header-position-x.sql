-- Horizontal focal point for header / banner image crop
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS header_image_position_x INTEGER NOT NULL DEFAULT 50
  CHECK (header_image_position_x >= 0 AND header_image_position_x <= 100);
