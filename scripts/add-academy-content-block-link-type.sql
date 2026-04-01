-- Add 'link' to academy_lesson_content_blocks block_type
ALTER TABLE academy_lesson_content_blocks DROP CONSTRAINT IF EXISTS academy_lesson_content_blocks_block_type_check;
ALTER TABLE academy_lesson_content_blocks ADD CONSTRAINT academy_lesson_content_blocks_block_type_check
  CHECK (block_type IN ('text', 'video', 'image', 'link', 'document', 'quiz'));
