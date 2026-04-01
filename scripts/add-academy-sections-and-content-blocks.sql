-- ============================================
-- Academy: Add Sections and Lesson Content Blocks
-- ============================================
-- Hierarchy: Course → Chapter (module) → Section → Lesson
-- Lessons can have multiple content blocks: text, video, image, document, quiz

-- ============================================
-- 1. ACADEMY SECTIONS (between Chapter/Module and Lesson)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_sections_module_id ON academy_sections(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_sections_order ON academy_sections(module_id, order_index);

ALTER TABLE academy_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sections of own modules"
  ON academy_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_sections.module_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_sections.module_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. ADD section_id TO academy_lessons (optional, for lessons in sections)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'academy_lessons' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE academy_lessons ADD COLUMN section_id UUID REFERENCES academy_sections(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_academy_lessons_section_id ON academy_lessons(section_id);
  END IF;
END $$;

-- ============================================
-- 3. ACADEMY LESSON CONTENT BLOCKS (text, video, image, document, quiz)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_lesson_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'video', 'image', 'document', 'quiz')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_lesson_content_blocks_lesson_id ON academy_lesson_content_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_content_blocks_order ON academy_lesson_content_blocks(lesson_id, order_index);

ALTER TABLE academy_lesson_content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage content blocks of own lessons"
  ON academy_lesson_content_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_lessons
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_lessons.id = academy_lesson_content_blocks.lesson_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_lessons
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_lessons.id = academy_lesson_content_blocks.lesson_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- Note: For lessons with section_id, the RLS path is: lessons -> sections -> modules -> courses
-- We need to extend the policy for lessons that might have section_id. The existing policy
-- uses module_id. For lessons with section_id, we get module via section. Let me add a
-- migration to handle section-based lessons in RLS. Actually the academy_lessons table
-- currently has module_id as NOT NULL. So we can't have section-only lessons without
-- module. Let me check - the lessons have module_id. So when we add section_id, the
-- lesson can be in a section within a module. The module_id would still point to the
-- parent chapter. So we need: for sections, the lesson's module_id could come from
-- section.module_id. So when creating a lesson in a section, we set module_id = section.module_id
-- and section_id = section.id. The existing structure remains. Good.
