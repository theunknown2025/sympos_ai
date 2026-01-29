-- Create latex_documents table
CREATE TABLE IF NOT EXISTS latex_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_latex_documents_user_id ON latex_documents(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_latex_documents_updated_at ON latex_documents(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE latex_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own documents
CREATE POLICY "Users can view their own latex documents"
  ON latex_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own documents
CREATE POLICY "Users can insert their own latex documents"
  ON latex_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own documents
CREATE POLICY "Users can update their own latex documents"
  ON latex_documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own latex documents"
  ON latex_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_latex_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_latex_documents_updated_at
  BEFORE UPDATE ON latex_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_latex_documents_updated_at();

COMMENT ON TABLE latex_documents IS 'Stores LaTeX documents created by participants';
COMMENT ON COLUMN latex_documents.user_id IS 'User ID of the document owner';
COMMENT ON COLUMN latex_documents.title IS 'Title of the LaTeX document';
COMMENT ON COLUMN latex_documents.content IS 'LaTeX content of the document';
