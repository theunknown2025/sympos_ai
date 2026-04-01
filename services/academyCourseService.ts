import { supabase, TABLES } from '../supabase';
import type {
  AcademyCourse,
  AcademyCourseStatus,
  AcademyCourseVisibility,
  AcademyDifficulty,
  AcademyModule,
  AcademyLesson,
  AcademySection,
} from '../types';

const COURSES_TABLE = TABLES.ACADEMY_COURSES;
const MODULES_TABLE = TABLES.ACADEMY_MODULES;
const SECTIONS_TABLE = TABLES.ACADEMY_SECTIONS;
const LESSONS_TABLE = TABLES.ACADEMY_LESSONS;

const deserializeTags = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof value === 'object') {
    try {
      const arr = Array.isArray(value) ? value : [];
      return arr;
    } catch {
      return [];
    }
  }
  return [];
};

const mapLessonRowToLesson = (row: any): AcademyLesson => ({
  id: row.id,
  moduleId: row.module_id,
  sectionId: row.section_id ?? undefined,
  title: row.title,
  orderIndex: row.order_index,
  contentType: row.content_type,
  contentRichText: row.content_rich_text ?? undefined,
  videoUrl: row.video_url ?? undefined,
  attachmentUrls: Array.isArray(row.attachment_urls)
    ? row.attachment_urls
    : (typeof row.attachment_urls === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(row.attachment_urls);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : []),
  externalLink: row.external_link ?? undefined,
  hasQuiz: row.has_quiz,
  isRequired: row.is_required,
  estimatedDurationMinutes: row.estimated_duration_minutes ?? undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapModuleRowToModule = (
  row: any,
  options?: { sections?: AcademySection[]; lessons?: AcademyLesson[] } | AcademyLesson[]
): AcademyModule => {
  const opts = Array.isArray(options) ? { lessons: options } : options;
  return ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description ?? undefined,
  orderIndex: row.order_index,
  isRequired: row.is_required,
  sections: opts?.sections,
  lessons: opts?.lessons,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});
};

const mapCourseRowToCourse = (row: any, modules?: AcademyModule[]): AcademyCourse => ({
  id: row.id,
  userId: row.user_id,
  organizerProfileId: row.organizer_profile_id ?? undefined,
  eventId: row.event_id ?? undefined,
  title: row.title,
  slug: row.slug,
  shortDescription: row.short_description ?? undefined,
  longDescription: row.long_description ?? undefined,
  thumbnailUrl: row.thumbnail_url ?? undefined,
  bannerImageUrl: row.banner_image_url ?? undefined,
  difficulty: row.difficulty ?? undefined,
  estimatedDurationMinutes: row.estimated_duration_minutes ?? undefined,
  tags: deserializeTags(row.tags),
  visibility: row.visibility as AcademyCourseVisibility,
  status: row.status as AcademyCourseStatus,
  modules,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export interface CreateCourseInput {
  organizerProfileId?: string;
  eventId?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  difficulty?: AcademyDifficulty;
  estimatedDurationMinutes?: number;
  tags?: string[];
  visibility?: AcademyCourseVisibility;
  status?: AcademyCourseStatus;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

export const createCourse = async (
  userId: string,
  input: CreateCourseInput
): Promise<AcademyCourse> => {
  if (!userId) {
    throw new Error('User ID is required to create a course');
  }

  if (!input.title || !input.title.trim()) {
    throw new Error('Course title is required');
  }

  if (!input.slug || !input.slug.trim()) {
    throw new Error('Course slug is required');
  }

  const insertData: any = {
    user_id: userId,
    organizer_profile_id: input.organizerProfileId || null,
    event_id: input.eventId || null,
    title: input.title.trim(),
    slug: input.slug.trim(),
    short_description: input.shortDescription || null,
    long_description: input.longDescription || null,
    thumbnail_url: input.thumbnailUrl || null,
    banner_image_url: input.bannerImageUrl || null,
    difficulty: input.difficulty || null,
    estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
    tags: input.tags ? input.tags : [],
    visibility: input.visibility || 'organization',
    status: input.status || 'draft',
  };

  const { data, error } = await supabase
    .from(COURSES_TABLE)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating Academy course:', error);
    throw new Error(error.message || 'Failed to create course');
  }

  return mapCourseRowToCourse(data);
};

export const updateCourse = async (
  courseId: string,
  updates: UpdateCourseInput
): Promise<AcademyCourse> => {
  if (!courseId) {
    throw new Error('Course ID is required to update course');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.organizerProfileId !== undefined) {
    updateData.organizer_profile_id = updates.organizerProfileId || null;
  }
  if (updates.eventId !== undefined) {
    updateData.event_id = updates.eventId || null;
  }
  if (updates.title !== undefined) {
    updateData.title = updates.title ? updates.title.trim() : null;
  }
  if (updates.slug !== undefined) {
    updateData.slug = updates.slug ? updates.slug.trim() : null;
  }
  if (updates.shortDescription !== undefined) {
    updateData.short_description = updates.shortDescription || null;
  }
  if (updates.longDescription !== undefined) {
    updateData.long_description = updates.longDescription || null;
  }
  if (updates.thumbnailUrl !== undefined) {
    updateData.thumbnail_url = updates.thumbnailUrl || null;
  }
  if (updates.bannerImageUrl !== undefined) {
    updateData.banner_image_url = updates.bannerImageUrl || null;
  }
  if (updates.difficulty !== undefined) {
    updateData.difficulty = updates.difficulty || null;
  }
  if (updates.estimatedDurationMinutes !== undefined) {
    updateData.estimated_duration_minutes = updates.estimatedDurationMinutes ?? null;
  }
  if (updates.tags !== undefined) {
    updateData.tags = updates.tags || [];
  }
  if (updates.visibility !== undefined) {
    updateData.visibility = updates.visibility;
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  const { data, error } = await supabase
    .from(COURSES_TABLE)
    .update(updateData)
    .eq('id', courseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating Academy course:', error);
    throw new Error(error.message || 'Failed to update course');
  }

  return mapCourseRowToCourse(data);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (!courseId) {
    throw new Error('Course ID is required to delete course');
  }

  const { error } = await supabase.from(COURSES_TABLE).delete().eq('id', courseId);

  if (error) {
    console.error('Error deleting Academy course:', error);
    throw new Error(error.message || 'Failed to delete course');
  }
};

export const getCourseById = async (courseId: string): Promise<AcademyCourse | null> => {
  if (!courseId) {
    throw new Error('Course ID is required');
  }

  const { data, error } = await supabase
    .from(COURSES_TABLE)
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    if ((error as any).code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching Academy course:', error);
    throw new Error((error as any).message || 'Failed to fetch course');
  }

  if (!data) {
    return null;
  }

  return mapCourseRowToCourse(data);
};

export const getUserCourses = async (userId: string): Promise<AcademyCourse[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { data, error } = await supabase
    .from(COURSES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching Academy courses for user:', error);
    throw new Error(error.message || 'Failed to fetch courses');
  }

  return (data || []).map((row: any) => mapCourseRowToCourse(row));
};

export const getPublishedCoursesForParticipant = async (
  participantUserId: string,
  options?: { eventId?: string }
): Promise<AcademyCourse[]> => {
  // For now, participants can see all published public/organization courses,
  // optionally filtered by event.
  let query = supabase
    .from(COURSES_TABLE)
    .select('*')
    .eq('status', 'published');

  if (options?.eventId) {
    query = query.eq('event_id', options.eventId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching published Academy courses:', error);
    throw new Error(error.message || 'Failed to fetch published courses');
  }

  return (data || []).map((row: any) => mapCourseRowToCourse(row));
};

export const getCourseWithContent = async (
  courseId: string
): Promise<AcademyCourse | null> => {
  const course = await getCourseById(courseId);
  if (!course) {
    return null;
  }

  const { data: modulesData, error: modulesError } = await supabase
    .from(MODULES_TABLE)
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modulesError) {
    console.error('Error fetching Academy modules:', modulesError);
    throw new Error(modulesError.message || 'Failed to fetch course modules');
  }

  const moduleIds = (modulesData || []).map((m: any) => m.id);

  let sectionsByModule: Record<string, AcademySection[]> = {};
  let lessonsBySection: Record<string, AcademyLesson[]> = {};
  let directLessonsByModule: Record<string, AcademyLesson[]> = {};

  if (moduleIds.length > 0) {
    const { data: lessonsData, error: lessonsError } = await supabase
      .from(LESSONS_TABLE)
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });

    let sectionsData: any[] = [];
    const { data: sectionsResult, error: sectionsError } = await supabase
      .from(SECTIONS_TABLE)
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });
    if (!sectionsError && sectionsResult) {
      sectionsData = sectionsResult;
    }

    if (lessonsError) {
      console.error('Error fetching Academy lessons:', lessonsError);
      throw new Error(lessonsError.message || 'Failed to fetch course lessons');
    }

    (sectionsData || []).forEach((row: any) => {
      const section: AcademySection = {
        id: row.id,
        moduleId: row.module_id,
        title: row.title,
        description: row.description ?? undefined,
        orderIndex: row.order_index,
        lessons: [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
      if (!sectionsByModule[row.module_id]) {
        sectionsByModule[row.module_id] = [];
      }
      sectionsByModule[row.module_id].push(section);
      lessonsBySection[row.id] = [];
    });

    (lessonsData || []).forEach((row: any) => {
      const lesson = mapLessonRowToLesson(row);
      if (row.section_id) {
        if (!lessonsBySection[row.section_id]) {
          lessonsBySection[row.section_id] = [];
        }
        lessonsBySection[row.section_id].push(lesson);
      } else {
        if (!directLessonsByModule[lesson.moduleId]) {
          directLessonsByModule[lesson.moduleId] = [];
        }
        directLessonsByModule[lesson.moduleId].push(lesson);
      }
    });

    Object.keys(lessonsBySection).forEach(sectionId => {
      const section = Object.values(sectionsByModule).flat().find(s => s.id === sectionId);
      if (section) {
        section.lessons = lessonsBySection[sectionId] || [];
      }
    });
  }

  const modules: AcademyModule[] = (modulesData || []).map((row: any) => {
    const sections = sectionsByModule[row.id] || [];
    const directLessons = directLessonsByModule[row.id] || [];
    return mapModuleRowToModule(row, { sections, lessons: directLessons });
  });

  return {
    ...course,
    modules,
  };
};

export interface CreateModuleInput {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
  isRequired?: boolean;
}

export const createModule = async (input: CreateModuleInput): Promise<AcademyModule> => {
  if (!input.courseId) {
    throw new Error('Course ID is required to create a module');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Module title is required');
  }

  const insertData: any = {
    course_id: input.courseId,
    title: input.title.trim(),
    description: input.description || null,
    order_index: input.orderIndex ?? 0,
    is_required: input.isRequired ?? true,
  };

  const { data, error } = await supabase
    .from(MODULES_TABLE)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating Academy module:', error);
    throw new Error(error.message || 'Failed to create module');
  }

  return mapModuleRowToModule(data);
};

export interface UpdateModuleInput extends Partial<CreateModuleInput> {}

export const updateModule = async (
  moduleId: string,
  updates: UpdateModuleInput
): Promise<AcademyModule> => {
  if (!moduleId) {
    throw new Error('Module ID is required to update module');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title ? updates.title.trim() : null;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description || null;
  }
  if (updates.orderIndex !== undefined) {
    updateData.order_index = updates.orderIndex;
  }
  if (updates.isRequired !== undefined) {
    updateData.is_required = updates.isRequired;
  }

  const { data, error } = await supabase
    .from(MODULES_TABLE)
    .update(updateData)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating Academy module:', error);
    throw new Error(error.message || 'Failed to update module');
  }

  return mapModuleRowToModule(data);
};

export const deleteModule = async (moduleId: string): Promise<void> => {
  if (!moduleId) {
    throw new Error('Module ID is required to delete module');
  }

  const { error } = await supabase.from(MODULES_TABLE).delete().eq('id', moduleId);

  if (error) {
    console.error('Error deleting Academy module:', error);
    throw new Error(error.message || 'Failed to delete module');
  }
};

export interface CreateLessonInput {
  moduleId: string;
  sectionId?: string;
  title: string;
  orderIndex?: number;
  contentType?: 'article' | 'video' | 'file' | 'link';
  contentRichText?: any;
  videoUrl?: string;
  attachmentUrls?: string[];
  externalLink?: string;
  hasQuiz?: boolean;
  isRequired?: boolean;
  estimatedDurationMinutes?: number;
}

export const createLesson = async (input: CreateLessonInput): Promise<AcademyLesson> => {
  if (!input.moduleId) {
    throw new Error('Module ID is required to create lesson');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Lesson title is required');
  }

  const insertData: any = {
    module_id: input.moduleId,
    section_id: input.sectionId || null,
    title: input.title.trim(),
    order_index: input.orderIndex ?? 0,
    content_type: input.contentType || 'article',
    content_rich_text: input.contentRichText ?? null,
    video_url: input.videoUrl || null,
    attachment_urls: input.attachmentUrls || [],
    external_link: input.externalLink || null,
    has_quiz: input.hasQuiz ?? false,
    is_required: input.isRequired ?? true,
    estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
  };

  const { data, error } = await supabase
    .from(LESSONS_TABLE)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating Academy lesson:', error);
    throw new Error(error.message || 'Failed to create lesson');
  }

  return mapLessonRowToLesson(data);
};

export interface UpdateLessonInput extends Partial<CreateLessonInput> {}

export const updateLesson = async (
  lessonId: string,
  updates: UpdateLessonInput
): Promise<AcademyLesson> => {
  if (!lessonId) {
    throw new Error('Lesson ID is required to update lesson');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title ? updates.title.trim() : null;
  }
  if (updates.orderIndex !== undefined) {
    updateData.order_index = updates.orderIndex;
  }
  if (updates.contentType !== undefined) {
    updateData.content_type = updates.contentType;
  }
  if (updates.contentRichText !== undefined) {
    updateData.content_rich_text = updates.contentRichText ?? null;
  }
  if (updates.videoUrl !== undefined) {
    updateData.video_url = updates.videoUrl || null;
  }
  if (updates.attachmentUrls !== undefined) {
    updateData.attachment_urls = updates.attachmentUrls || [];
  }
  if (updates.externalLink !== undefined) {
    updateData.external_link = updates.externalLink || null;
  }
  if (updates.hasQuiz !== undefined) {
    updateData.has_quiz = updates.hasQuiz;
  }
  if (updates.isRequired !== undefined) {
    updateData.is_required = updates.isRequired;
  }
  if (updates.estimatedDurationMinutes !== undefined) {
    updateData.estimated_duration_minutes = updates.estimatedDurationMinutes ?? null;
  }

  const { data, error } = await supabase
    .from(LESSONS_TABLE)
    .update(updateData)
    .eq('id', lessonId)
    .select()
    .single();

  if (error) {
    console.error('Error updating Academy lesson:', error);
    throw new Error(error.message || 'Failed to update lesson');
  }

  return mapLessonRowToLesson(data);
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  if (!lessonId) {
    throw new Error('Lesson ID is required to delete lesson');
  }

  const { error } = await supabase.from(LESSONS_TABLE).delete().eq('id', lessonId);

  if (error) {
    console.error('Error deleting Academy lesson:', error);
    throw new Error(error.message || 'Failed to delete lesson');
  }
};

