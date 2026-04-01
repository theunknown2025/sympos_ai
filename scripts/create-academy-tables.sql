-- ============================================
-- Academy LMS Tables Setup Script
-- ============================================
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new
--
-- This script creates the core tables for the Academy LMS:
-- - academy_courses
-- - academy_modules
-- - academy_lessons
-- - academy_enrollments
-- - academy_lesson_progress
-- - academy_quizzes
-- - academy_quiz_questions
-- - academy_quiz_options
-- - academy_certificates
--
-- It also configures indexes, row level security (RLS), and updated_at triggers.

-- ============================================
-- 1. ACADEMY COURSES
-- ============================================
CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Owner of the course (organizer)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Optional link to organizer profile and event
  organizer_profile_id UUID REFERENCES organizer_profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,

  visibility TEXT NOT NULL DEFAULT 'organization'
    CHECK (visibility IN ('public', 'organization', 'event')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_academy_courses_user_id ON academy_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_courses_event_id ON academy_courses(event_id);
CREATE INDEX IF NOT EXISTS idx_academy_courses_status ON academy_courses(status);

ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;

-- Organizers: manage their own courses
CREATE POLICY "Users can view own academy_courses"
  ON academy_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own academy_courses"
  ON academy_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own academy_courses"
  ON academy_courses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own academy_courses"
  ON academy_courses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. ACADEMY MODULES
-- ============================================
CREATE TABLE IF NOT EXISTS academy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_modules_course_id ON academy_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_modules_order_index ON academy_modules(course_id, order_index);

ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage modules of own courses"
  ON academy_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_modules.course_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_modules.course_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. ACADEMY LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,

  content_type TEXT NOT NULL DEFAULT 'article'
    CHECK (content_type IN ('article', 'video', 'file', 'link')),

  content_rich_text JSONB, -- Rich text content for articles
  video_url TEXT,
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  external_link TEXT,

  has_quiz BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_minutes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_lessons_module_id ON academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_order_index ON academy_lessons(module_id, order_index);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage lessons of own modules"
  ON academy_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_lessons.module_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_modules
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_modules.id = academy_lessons.module_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. ACADEMY ENROLLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  enrollment_source TEXT NOT NULL DEFAULT 'self'
    CHECK (enrollment_source IN ('self', 'assigned', 'event-auto')),

  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'failed', 'withdrawn')),

  final_score NUMERIC(5,2),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (course_id, participant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course_id ON academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_participant_user_id ON academy_enrollments(participant_user_id);

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;

-- Participants: can view/manage their own enrollments
CREATE POLICY "Participants can view own academy_enrollments"
  ON academy_enrollments FOR SELECT
  USING (participant_user_id = auth.uid());

CREATE POLICY "Participants can update own academy_enrollments"
  ON academy_enrollments FOR UPDATE
  USING (participant_user_id = auth.uid())
  WITH CHECK (participant_user_id = auth.uid());

-- Organizers: can view enrollments for their courses
CREATE POLICY "Organizers can view enrollments for own courses"
  ON academy_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_enrollments.course_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- Organizers: can insert/enroll participants into their courses
CREATE POLICY "Organizers can insert enrollments for own courses"
  ON academy_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_enrollments.course_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. ACADEMY LESSON PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES academy_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,

  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_lesson_progress_enrollment_id ON academy_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_progress_lesson_id ON academy_lesson_progress(lesson_id);

ALTER TABLE academy_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Participants: can view/update progress for their own enrollments
CREATE POLICY "Participants can manage own lesson_progress"
  ON academy_lesson_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      WHERE academy_enrollments.id = academy_lesson_progress.enrollment_id
      AND academy_enrollments.participant_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      WHERE academy_enrollments.id = academy_lesson_progress.enrollment_id
      AND academy_enrollments.participant_user_id = auth.uid()
    )
  );

-- Organizers: can view progress for enrollments of own courses
CREATE POLICY "Organizers can view lesson_progress for own courses"
  ON academy_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      JOIN academy_courses ON academy_courses.id = academy_enrollments.course_id
      WHERE academy_enrollments.id = academy_lesson_progress.enrollment_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. ACADEMY QUIZZES
-- ============================================
CREATE TABLE IF NOT EXISTS academy_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_attempts INTEGER, -- NULL = unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_quizzes_lesson_id ON academy_quizzes(lesson_id);

ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quizzes of own lessons"
  ON academy_quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_lessons
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_lessons.id = academy_quizzes.lesson_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_lessons
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_lessons.id = academy_quizzes.lesson_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. ACADEMY QUIZ QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice'
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_quiz_questions_quiz_id ON academy_quiz_questions(quiz_id);

ALTER TABLE academy_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quiz_questions of own quizzes"
  ON academy_quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_quizzes
      JOIN academy_lessons ON academy_lessons.id = academy_quizzes.lesson_id
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_quizzes.id = academy_quiz_questions.quiz_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_quizzes
      JOIN academy_lessons ON academy_lessons.id = academy_quizzes.lesson_id
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_quizzes.id = academy_quiz_questions.quiz_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. ACADEMY QUIZ OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES academy_quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_quiz_options_question_id ON academy_quiz_options(question_id);

ALTER TABLE academy_quiz_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quiz_options of own questions"
  ON academy_quiz_options FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_quiz_questions
      JOIN academy_quizzes ON academy_quizzes.id = academy_quiz_questions.quiz_id
      JOIN academy_lessons ON academy_lessons.id = academy_quizzes.lesson_id
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_quiz_questions.id = academy_quiz_options.question_id
      AND academy_courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_quiz_questions
      JOIN academy_quizzes ON academy_quizzes.id = academy_quiz_questions.quiz_id
      JOIN academy_lessons ON academy_lessons.id = academy_quizzes.lesson_id
      JOIN academy_modules ON academy_modules.id = academy_lessons.module_id
      JOIN academy_courses ON academy_courses.id = academy_modules.course_id
      WHERE academy_quiz_questions.id = academy_quiz_options.question_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. ACADEMY QUIZ ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS academy_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES academy_enrollments(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  passed BOOLEAN,
  answers JSONB, -- Stores selected options per question
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_quiz_id ON academy_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_enrollment_id ON academy_quiz_attempts(enrollment_id);

ALTER TABLE academy_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Participants: manage attempts for their own enrollments
CREATE POLICY "Participants can manage own quiz_attempts"
  ON academy_quiz_attempts FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      WHERE academy_enrollments.id = academy_quiz_attempts.enrollment_id
      AND academy_enrollments.participant_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      WHERE academy_enrollments.id = academy_quiz_attempts.enrollment_id
      AND academy_enrollments.participant_user_id = auth.uid()
    )
  );

-- Organizers: can view quiz attempts for enrollments of own courses
CREATE POLICY "Organizers can view quiz_attempts for own courses"
  ON academy_quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM academy_enrollments
      JOIN academy_courses ON academy_courses.id = academy_enrollments.course_id
      WHERE academy_enrollments.id = academy_quiz_attempts.enrollment_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. ACADEMY CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS academy_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  verification_code TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_certificates_course_id ON academy_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_certificates_participant_user_id ON academy_certificates(participant_user_id);

ALTER TABLE academy_certificates ENABLE ROW LEVEL SECURITY;

-- Participants: view their own Academy certificates
CREATE POLICY "Participants can view own academy_certificates"
  ON academy_certificates FOR SELECT
  USING (participant_user_id = auth.uid());

-- Organizers: view certificates for their courses
CREATE POLICY "Organizers can view academy_certificates for own courses"
  ON academy_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_certificates.course_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- Organizers: issue certificates for their courses
CREATE POLICY "Organizers can insert academy_certificates for own courses"
  ON academy_certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_courses
      WHERE academy_courses.id = academy_certificates.course_id
      AND academy_courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================
-- Note: Uses the update_updated_at_column() function from setup-supabase-tables.sql

CREATE TRIGGER update_academy_courses_updated_at
BEFORE UPDATE ON academy_courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_modules_updated_at
BEFORE UPDATE ON academy_modules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_lessons_updated_at
BEFORE UPDATE ON academy_lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_enrollments_updated_at
BEFORE UPDATE ON academy_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_lesson_progress_updated_at
BEFORE UPDATE ON academy_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_quizzes_updated_at
BEFORE UPDATE ON academy_quizzes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_quiz_questions_updated_at
BEFORE UPDATE ON academy_quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_quiz_options_updated_at
BEFORE UPDATE ON academy_quiz_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_quiz_attempts_updated_at
BEFORE UPDATE ON academy_quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_certificates_updated_at
BEFORE UPDATE ON academy_certificates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Academy LMS schema
-- ============================================

