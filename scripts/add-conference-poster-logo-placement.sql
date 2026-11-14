-- Logo placement on poster: top, middle, or bottom (per section)
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS organizer_logos_placement TEXT NOT NULL DEFAULT 'top'
    CHECK (organizer_logos_placement IN ('top', 'middle', 'bottom')),
  ADD COLUMN IF NOT EXISTS partner_logos_placement TEXT NOT NULL DEFAULT 'top'
    CHECK (partner_logos_placement IN ('top', 'middle', 'bottom'));
