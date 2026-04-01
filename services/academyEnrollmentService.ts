import { supabase, TABLES } from '../supabase';
import type {
  AcademyEnrollment,
  AcademyEnrollmentSource,
  AcademyEnrollmentStatus,
  AcademyLessonProgress,
} from '../types';

const ENROLLMENTS_TABLE = TABLES.ACADEMY_ENROLLMENTS;
const LESSON_PROGRESS_TABLE = TABLES.ACADEMY_LESSON_PROGRESS;
const LESSONS_TABLE = TABLES.ACADEMY_LESSONS;

const mapEnrollmentRowToEnrollment = (row: any): AcademyEnrollment => ({
  id: row.id,
  courseId: row.course_id,
  participantUserId: row.participant_user_id,
  enrollmentSource: row.enrollment_source as AcademyEnrollmentSource,
  status: row.status as AcademyEnrollmentStatus,
  finalScore: row.final_score !== null && row.final_score !== undefined ? Number(row.final_score) : undefined,
  enrolledAt: new Date(row.enrolled_at || row.created_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapLessonProgressRow = (row: any): AcademyLessonProgress => ({
  id: row.id,
  enrollmentId: row.enrollment_id,
  lessonId: row.lesson_id,
  isCompleted: row.is_completed,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const enrollInCourse = async (
  courseId: string,
  participantUserId: string,
  source: AcademyEnrollmentSource = 'self'
): Promise<AcademyEnrollment> => {
  if (!courseId) {
    throw new Error('Course ID is required to enroll');
  }
  if (!participantUserId) {
    throw new Error('Participant user ID is required to enroll');
  }

  // Upsert-like behavior: if enrollment already exists, return it
  const existing = await getEnrollment(courseId, participantUserId);
  if (existing) {
    return existing;
  }

  const insertData: any = {
    course_id: courseId,
    participant_user_id: participantUserId,
    enrollment_source: source,
    status: 'in_progress',
    enrolled_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error enrolling in Academy course:', error);
    throw new Error(error.message || 'Failed to enroll in course');
  }

  return mapEnrollmentRowToEnrollment(data);
};

export const getEnrollment = async (
  courseId: string,
  participantUserId: string
): Promise<AcademyEnrollment | null> => {
  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('*')
    .eq('course_id', courseId)
    .eq('participant_user_id', participantUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Academy enrollment:', error);
    throw new Error(error.message || 'Failed to fetch enrollment');
  }

  if (!data) {
    return null;
  }

  return mapEnrollmentRowToEnrollment(data);
};

export const getParticipantEnrollments = async (
  participantUserId: string
): Promise<AcademyEnrollment[]> => {
  if (!participantUserId) {
    throw new Error('Participant user ID is required');
  }

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('*')
    .eq('participant_user_id', participantUserId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching participant Academy enrollments:', error);
    throw new Error(error.message || 'Failed to fetch enrollments');
  }

  return (data || []).map((row: any) => mapEnrollmentRowToEnrollment(row));
};

export const getAllEnrollmentsForOrganizer = async (
  organizerUserId: string
): Promise<AcademyEnrollment[]> => {
  const { data: courses } = await supabase
    .from(TABLES.ACADEMY_COURSES)
    .select('id')
    .eq('user_id', organizerUserId);
  const courseIds = (courses || []).map((c: { id: string }) => c.id);
  if (courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('*')
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching all Academy enrollments for organizer:', error);
    throw new Error(error.message || 'Failed to fetch enrollments');
  }

  return (data || []).map((row: any) => mapEnrollmentRowToEnrollment(row));
};

export const getCourseEnrollments = async (courseId: string): Promise<AcademyEnrollment[]> => {
  if (!courseId) {
    throw new Error('Course ID is required');
  }

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('*')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: true });

  if (error) {
    console.error('Error fetching course Academy enrollments:', error);
    throw new Error(error.message || 'Failed to fetch course enrollments');
  }

  return (data || []).map((row: any) => mapEnrollmentRowToEnrollment(row));
};

export const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: AcademyEnrollmentStatus,
  finalScore?: number
): Promise<AcademyEnrollment> => {
  if (!enrollmentId) {
    throw new Error('Enrollment ID is required');
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (finalScore !== undefined) {
    updateData.final_score = finalScore;
  }

  const { data, error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .update(updateData)
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating Academy enrollment status:', error);
    throw new Error(error.message || 'Failed to update enrollment');
  }

  return mapEnrollmentRowToEnrollment(data);
};

export const touchEnrollmentLastAccessed = async (
  enrollmentId: string
): Promise<void> => {
  if (!enrollmentId) {
    throw new Error('Enrollment ID is required');
  }

  const { error } = await supabase
    .from(ENROLLMENTS_TABLE)
    .update({
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  if (error) {
    console.error('Error updating Academy enrollment last accessed:', error);
    throw new Error(error.message || 'Failed to update last accessed');
  }
};

export const upsertLessonProgress = async (
  enrollmentId: string,
  lessonId: string,
  isCompleted: boolean
): Promise<AcademyLessonProgress> => {
  if (!enrollmentId) {
    throw new Error('Enrollment ID is required');
  }
  if (!lessonId) {
    throw new Error('Lesson ID is required');
  }

  const nowIso = new Date().toISOString();

  // Try update existing
  const { data: existing, error: existingError } = await supabase
    .from(LESSON_PROGRESS_TABLE)
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking existing Academy lesson progress:', existingError);
    throw new Error(existingError.message || 'Failed to update lesson progress');
  }

  if (existing) {
    const { data, error } = await supabase
      .from(LESSON_PROGRESS_TABLE)
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? nowIso : null,
        last_viewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Academy lesson progress:', error);
      throw new Error(error.message || 'Failed to update lesson progress');
    }

    return mapLessonProgressRow(data);
  }

  const { data, error } = await supabase
    .from(LESSON_PROGRESS_TABLE)
    .insert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      is_completed: isCompleted,
      completed_at: isCompleted ? nowIso : null,
      last_viewed_at: nowIso,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating Academy lesson progress:', error);
    throw new Error(error.message || 'Failed to create lesson progress');
  }

  return mapLessonProgressRow(data);
};

export const getLessonProgressForEnrollment = async (
  enrollmentId: string
): Promise<AcademyLessonProgress[]> => {
  const { data, error } = await supabase
    .from(LESSON_PROGRESS_TABLE)
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) {
    console.error('Error fetching Academy lesson progress:', error);
    throw new Error(error.message || 'Failed to fetch lesson progress');
  }

  return (data || []).map((row: any) => mapLessonProgressRow(row));
};

export const getCourseCompletionPercentage = async (
  enrollmentId: string
): Promise<number> => {
  // Count required lessons in the course and compare to completed required lessons
  const { data: enrollment, error: enrollmentError } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('course_id')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError) {
    console.error('Error fetching enrollment for completion percentage:', enrollmentError);
    throw new Error(enrollmentError.message || 'Failed to compute completion');
  }

  const courseId = enrollment.course_id;

  // Fetch all modules for the course
  const { data: modules, error: modulesError } = await supabase
    .from(TABLES.ACADEMY_MODULES)
    .select('id')
    .eq('course_id', courseId);

  if (modulesError) {
    console.error('Error fetching modules for completion percentage:', modulesError);
    throw new Error(modulesError.message || 'Failed to compute completion');
  }

  const moduleIds = (modules || []).map((m: any) => m.id);
  if (moduleIds.length === 0) {
    return 0;
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from(LESSONS_TABLE)
    .select('id, is_required')
    .in('module_id', moduleIds);

  if (lessonsError) {
    console.error('Error fetching lessons for completion percentage:', lessonsError);
    throw new Error(lessonsError.message || 'Failed to compute completion');
  }

  const requiredLessonIds =
    (lessons || [])
      .filter((l: any) => l.is_required)
      .map((l: any) => l.id);

  if (requiredLessonIds.length === 0) {
    return 0;
  }

  const { data: progress, error: progressError } = await supabase
    .from(LESSON_PROGRESS_TABLE)
    .select('lesson_id, is_completed')
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', requiredLessonIds);

  if (progressError) {
    console.error('Error fetching progress for completion percentage:', progressError);
    throw new Error(progressError.message || 'Failed to compute completion');
  }

  const completedRequiredCount = (progress || []).filter(
    (p: any) => p.is_completed
  ).length;

  return (completedRequiredCount / requiredLessonIds.length) * 100;
};

export const withdrawEnrollment = async (
  enrollmentId: string
): Promise<AcademyEnrollment> => {
  return updateEnrollmentStatus(enrollmentId, 'withdrawn');
};

