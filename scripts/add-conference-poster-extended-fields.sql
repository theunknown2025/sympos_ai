-- Extended poster fields: organizer/partner logos, contact photo, team, QR codes
ALTER TABLE public.conference_posters
  ADD COLUMN IF NOT EXISTS organizer_logos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partner_logos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_image_url TEXT,
  ADD COLUMN IF NOT EXISTS show_team_section BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qr_codes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate legacy single logo into organizer_logos
UPDATE public.conference_posters
SET organizer_logos = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'imageUrl', logo_url
  )
)
WHERE logo_url IS NOT NULL
  AND logo_url <> ''
  AND (organizer_logos IS NULL OR organizer_logos = '[]'::jsonb);

-- Migrate legacy qr_link into qr_codes
UPDATE public.conference_posters
SET qr_codes = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Registration',
    'type', 'link',
    'linkUrl', qr_link,
    'targetUrl', qr_link
  )
)
WHERE qr_link IS NOT NULL
  AND qr_link <> ''
  AND (qr_codes IS NULL OR qr_codes = '[]'::jsonb);
