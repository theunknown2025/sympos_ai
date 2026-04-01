import { supabase, TABLES } from '../supabase';
import type { AcademyLessonContentBlockType } from '../types';

export interface ContentBlock {
  id: string;
  blockType: AcademyLessonContentBlockType;
  content: Record<string, unknown>;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentBlockParentType = 'lesson' | 'section' | 'module';

const TABLE_MAP = {
  lesson: TABLES.ACADEMY_LESSON_CONTENT_BLOCKS,
  section: TABLES.ACADEMY_SECTION_CONTENT_BLOCKS,
  module: TABLES.ACADEMY_MODULE_CONTENT_BLOCKS,
} as const;

const ID_COLUMN_MAP = {
  lesson: 'lesson_id',
  section: 'section_id',
  module: 'module_id',
} as const;

const mapRow = (row: any): ContentBlock => ({
  id: row.id,
  blockType: row.block_type as AcademyLessonContentBlockType,
  content: (row.content as Record<string, unknown>) || {},
  orderIndex: row.order_index,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getContentBlocks = async (
  parentType: ContentBlockParentType,
  parentId: string
): Promise<ContentBlock[]> => {
  const table = TABLE_MAP[parentType];
  const idColumn = ID_COLUMN_MAP[parentType];
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(idColumn, parentId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch content blocks');
  return (data || []).map((r: any) => mapRow(r));
};

export const createContentBlock = async (
  parentType: ContentBlockParentType,
  parentId: string,
  input: { blockType: AcademyLessonContentBlockType; content?: Record<string, unknown>; orderIndex?: number }
): Promise<ContentBlock> => {
  const table = TABLE_MAP[parentType];
  const idColumn = ID_COLUMN_MAP[parentType];
  const insertData: Record<string, unknown> = {
    [idColumn]: parentId,
    block_type: input.blockType,
    content: input.content || {},
    order_index: input.orderIndex ?? 0,
  };

  const { data, error } = await supabase.from(table).insert(insertData).select().single();

  if (error) throw new Error(error.message || 'Failed to create content block');
  return mapRow(data);
};

export const updateContentBlock = async (
  parentType: ContentBlockParentType,
  blockId: string,
  updates: { content?: Record<string, unknown>; orderIndex?: number }
): Promise<ContentBlock> => {
  const table = TABLE_MAP[parentType];
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', blockId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update content block');
  return mapRow(data);
};

export interface CourseContentBlocks {
  modules: Record<string, ContentBlock[]>;
  sections: Record<string, ContentBlock[]>;
  lessons: Record<string, ContentBlock[]>;
}

export const getContentBlocksForCourse = async (
  modules: { id: string; sections?: { id: string; lessons?: { id: string }[] }[]; lessons?: { id: string }[] }[]
): Promise<CourseContentBlocks> => {
  const moduleIds = modules.map(m => m.id);
  const sectionIds = modules.flatMap(m => (m.sections || []).map(s => s.id));
  const lessonIds = [
    ...modules.flatMap(m => (m.lessons || []).map(l => l.id)),
    ...modules.flatMap(m => (m.sections || []).flatMap(s => (s.lessons || []).map(l => l.id))),
  ];

  const [moduleBlocks, sectionBlocks, lessonBlocks] = await Promise.all([
    Promise.all(moduleIds.map(id => getContentBlocks('module', id))),
    Promise.all(sectionIds.map(id => getContentBlocks('section', id))),
    Promise.all(lessonIds.map(id => getContentBlocks('lesson', id))),
  ]);

  const result: CourseContentBlocks = {
    modules: {},
    sections: {},
    lessons: {},
  };

  moduleIds.forEach((id, i) => {
    result.modules[id] = moduleBlocks[i] || [];
  });
  sectionIds.forEach((id, i) => {
    result.sections[id] = sectionBlocks[i] || [];
  });
  lessonIds.forEach((id, i) => {
    result.lessons[id] = lessonBlocks[i] || [];
  });

  return result;
};

export const deleteContentBlock = async (
  parentType: ContentBlockParentType,
  blockId: string
): Promise<void> => {
  const table = TABLE_MAP[parentType];
  const { error } = await supabase.from(table).delete().eq('id', blockId);
  if (error) throw new Error(error.message || 'Failed to delete content block');
};
