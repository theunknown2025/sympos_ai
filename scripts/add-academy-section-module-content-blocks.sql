-- Add content blocks for sections and modules (chapters)
-- Same structure as academy_lesson_content_blocks

-- ============================================
-- academy_section_content_blocks
-- ============================================
CREATE TABLE IF NOT EXISTS academy_section_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES academy_sections(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'video', 'image', 'link', 'document', 'quiz')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_section_content_blocks_section_id ON academy_section_content_blocks(section_id);
CREATE INDEX IF NOT EXISTS idx_academy_section_content_blocks_order ON academy_section_content_blocks(section_id, order_index);

ALTER TABLE academy_section_content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage section content blocks"
  ON academy_section_content_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academy_sections
      JOIN academy_modules ON academy_modules.id = academy_sections.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_sections.id = academy_section_content_blocks.section_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_sections
      JOIN academy_modules ON academy_modules.id = academy_sections.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_sections.id = academy_section_content_blocks.section_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- academy_module_content_blocks
-- ============================================
CREATE TABLE IF NOT EXISTS academy_module_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'video', 'image', 'link', 'document', 'quiz')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_module_content_blocks_module_id ON academy_module_content_blocks(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_module_content_blocks_order ON academy_module_content_blocks(module_id, order_index);

ALTER TABLE academy_module_content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage module content blocks"
  ON academy_module_content_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_module_content_blocks.module_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_module_content_blocks.module_id
      AND academy_courses.user_id = auth.uid()
    )
  );
