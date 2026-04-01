import { supabase, TABLES } from '../supabase';
import type { AcademySection, AcademyLesson, AcademyLessonContentBlock, AcademyLessonContentBlockType } from '../types';

const SECTIONS_TABLE = TABLES.ACADEMY_SECTIONS;
const LESSONS_TABLE = TABLES.ACADEMY_LESSONS;
const CONTENT_BLOCKS_TABLE = TABLES.ACADEMY_LESSON_CONTENT_BLOCKS;

const mapSectionRow = (row: any, lessons?: AcademyLesson[]): AcademySection => ({
  id: row.id,
  moduleId: row.module_id,
  title: row.title,
  description: row.description ?? undefined,
  orderIndex: row.order_index,
  lessons,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapContentBlockRow = (row: any): AcademyLessonContentBlock => ({
  id: row.id,
  lessonId: row.lesson_id,
  blockType: row.block_type as AcademyLessonContentBlockType,
  content: (row.content as Record<string, unknown>) || {},
  orderIndex: row.order_index,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export interface CreateSectionInput {
  moduleId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export const createSection = async (input: CreateSectionInput): Promise<AcademySection> => {
  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .insert({
      module_id: input.moduleId,
      title: input.title.trim(),
      description: input.description || null,
      order_index: input.orderIndex ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create section');
  return mapSectionRow(data);
};

export const updateSection = async (
  sectionId: string,
  updates: { title?: string; description?: string; orderIndex?: number }
): Promise<AcademySection> => {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) updateData.title = updates.title.trim();
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .update(updateData)
    .eq('id', sectionId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update section');
  return mapSectionRow(data);
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  const { error } = await supabase.from(SECTIONS_TABLE).delete().eq('id', sectionId);
  if (error) throw new Error(error.message || 'Failed to delete section');
};

export const getSectionsByModuleId = async (moduleId: string): Promise<AcademySection[]> => {
  const { data, error } = await supabase
    .from(SECTIONS_TABLE)
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sections');
  return (data || []).map((r: any) => mapSectionRow(r));
};

export interface CreateContentBlockInput {
  lessonId: string;
  blockType: AcademyLessonContentBlockType;
  content?: Record<string, unknown>;
  orderIndex?: number;
}

export const createContentBlock = async (
  input: CreateContentBlockInput
): Promise<AcademyLessonContentBlock> => {
  const { data, error } = await supabase
    .from(CONTENT_BLOCKS_TABLE)
    .insert({
      lesson_id: input.lessonId,
      block_type: input.blockType,
      content: input.content || {},
      order_index: input.orderIndex ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create content block');
  return mapContentBlockRow(data);
};

export const updateContentBlock = async (
  blockId: string,
  updates: { content?: Record<string, unknown>; orderIndex?: number }
): Promise<AcademyLessonContentBlock> => {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

  const { data, error } = await supabase
    .from(CONTENT_BLOCKS_TABLE)
    .update(updateData)
    .eq('id', blockId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update content block');
  return mapContentBlockRow(data);
};

export const deleteContentBlock = async (blockId: string): Promise<void> => {
  const { error } = await supabase.from(CONTENT_BLOCKS_TABLE).delete().eq('id', blockId);
  if (error) throw new Error(error.message || 'Failed to delete content block');
};

export const getContentBlocksByLessonId = async (
  lessonId: string
): Promise<AcademyLessonContentBlock[]> => {
  const { data, error } = await supabase
    .from(CONTENT_BLOCKS_TABLE)
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch content blocks');
  return (data || []).map((r: any) => mapContentBlockRow(r));
};
