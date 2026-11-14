-- Conference posters table and storage bucket
-- Applied via Supabase migration: create_conference_posters_table_and_bucket

CREATE TABLE IF NOT EXISTS public.conference_posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Poster',
  logo_url TEXT,
  organization_name TEXT,
  header_image_url TEXT,
  header_image_position_y INTEGER NOT NULL DEFAULT 50 CHECK (header_image_position_y >= 0 AND header_image_position_y <= 100),
  title TEXT,
  slogan TEXT,
  event_date TEXT,
  event_place TEXT,
  event_format TEXT,
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  qr_link TEXT,
  exported_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conference_posters_user_id ON public.conference_posters(user_id);
CREATE INDEX IF NOT EXISTS idx_conference_posters_updated_at ON public.conference_posters(updated_at DESC);

ALTER TABLE public.conference_posters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conference posters"
  ON public.conference_posters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conference posters"
  ON public.conference_posters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conference posters"
  ON public.conference_posters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conference posters"
  ON public.conference_posters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conference-posters',
  'conference-posters',
  true,
  20971520,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;
