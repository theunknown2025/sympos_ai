-- ============================================
-- BLOG ARTICLES TABLE
-- ============================================
-- This table stores blog articles with rich content
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text content (HTML or Markdown)
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  tags TEXT DEFAULT '[]', -- JSON array of tags
  author_name TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_user_id ON blog_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_created_at ON blog_articles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own blog articles"
  ON blog_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog articles"
  ON blog_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog articles"
  ON blog_articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blog articles"
  ON blog_articles FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
