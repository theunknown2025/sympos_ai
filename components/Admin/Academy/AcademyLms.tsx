import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Users,
  BarChart2,
  BookOpen,
  Clock,
  Save,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type {
  AcademyCourse,
  AcademyModule,
  AcademyLesson,
  AcademyCourseStatus,
  AcademyCourseVisibility,
  AcademyDifficulty,
  AcademyEnrollment,
} from '../../../types';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  getCourseWithContent,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../../../services/academyCourseService';
import { uploadImageToStorage } from '../../../services/storageService';
import {
  getCourseEnrollments,
  getCourseCompletionPercentage,
} from '../../../services/academyEnrollmentService';
import CourseInfoTab, { CourseFormState } from './CourseInfoTab';
import CourseStructureTab from './CourseStructureTab';
import CourseEnrollmentsTab from './CourseEnrollmentsTab';

type CourseFormMode = 'new' | 'edit';
type AdminAcademyTab = 'course-info' | 'structure' | 'enrollments';

const emptyCourseForm = (): CourseFormState => ({
  title: '',
  slug: '',
  shortDescription: '',
  longDescription: '',
  thumbnailUrl: '',
  bannerImageUrl: '',
  difficulty: '',
  estimatedDurationMinutes: '',
  tagsInput: '',
  visibility: 'organization',
  status: 'draft',
});

const AcademyLms: React.FC = () => {
  const { currentUser } = useAuth();

  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<AcademyCourse | null>(null);

  const [courseFormMode, setCourseFormMode] = useState<CourseFormMode>('new');
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm());
  const [savingCourse, setSavingCourse] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseEnrollments, setCourseEnrollments] = useState<AcademyEnrollment[]>([]);
  const [courseCompletionRate, setCourseCompletionRate] = useState<number | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminAcademyTab>('course-info');

  useEffect(() => {
    if (currentUser?.id) {
      loadCourses();
    }
  }, [currentUser?.id]);

  const loadCourses = async () => {
    if (!currentUser?.id) return;
    try {
      setLoadingCourses(true);
      setError(null);
      const userCourses = await getUserCourses(currentUser.id);
      setCourses(userCourses);
      // Auto-select first course if none selected
      if (!selectedCourseId && userCourses.length > 0) {
        handleSelectCourse(userCourses[0].id);
      }
    } catch (e: any) {
      console.error('Error loading Academy courses:', e);
      setError(e.message || 'Failed to load Academy courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadCourseDetail = async (courseId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const detail = await getCourseWithContent(courseId);
      setSelectedCourseDetail(detail);
      if (detail) {
        setCourseFormFromCourse(detail);
        await loadCourseAnalytics(courseId);
      }
    } catch (e: any) {
      console.error('Error loading Academy course detail:', e);
      setError(e.message || 'Failed to load course detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadCourseAnalytics = async (courseId: string) => {
    try {
      setLoadingAnalytics(true);
      const enrollments = await getCourseEnrollments(courseId);
      setCourseEnrollments(enrollments);
      if (enrollments.length === 0) {
        setCourseCompletionRate(0);
        return;
      }
      // Approximate completion rate by ratio of completed enrollments
      const completedCount = enrollments.filter(e => e.status === 'completed').length;
      const rate = (completedCount / enrollments.length) * 100;
      setCourseCompletionRate(rate);
    } catch (e) {
      console.error('Error loading Academy course analytics:', e);
      setCourseCompletionRate(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const setCourseFormFromCourse = (course: AcademyCourse) => {
    setCourseForm({
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription || '',
      longDescription: course.longDescription || '',
      thumbnailUrl: course.thumbnailUrl || '',
      bannerImageUrl: course.bannerImageUrl || '',
      difficulty: course.difficulty || '',
      estimatedDurationMinutes: course.estimatedDurationMinutes
        ? String(course.estimatedDurationMinutes)
        : '',
      tagsInput: course.tags?.join(', ') || '',
      visibility: course.visibility,
      status: course.status,
    });
    setCourseFormMode('edit');
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCourseFormMode('edit');
    loadCourseDetail(courseId);
  };

  const handleNewCourse = () => {
    setSelectedCourseId(null);
    setSelectedCourseDetail(null);
    setCourseForm(emptyCourseForm());
    setCourseFormMode('new');
    setCourseEnrollments([]);
    setCourseCompletionRate(null);
    setActiveTab('course-info');
  };

  const handleCourseFormChange = (
    field: keyof CourseFormState,
    value: string | AcademyCourseStatus | AcademyCourseVisibility | AcademyDifficulty | ''
  ) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBannerUpload = async (file: File) => {
    if (!currentUser?.id) return;
    try {
      setBannerUploading(true);
      const url = await uploadImageToStorage(
        currentUser.id,
        file,
        'academy-course-banners'
      );
      setCourseForm(prev => ({
        ...prev,
        bannerImageUrl: url,
      }));
    } catch (e: any) {
      console.error('Error uploading course banner:', e);
      setError(e.message || 'Failed to upload course banner');
    } finally {
      setBannerUploading(false);
    }
  };

  const buildCoursePayload = () => {
    const tags =
      courseForm.tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean) || [];

    const estimatedMinutes = courseForm.estimatedDurationMinutes
      ? parseInt(courseForm.estimatedDurationMinutes, 10)
      : undefined;

    return {
      title: courseForm.title.trim(),
      slug: courseForm.slug.trim(),
      shortDescription: courseForm.shortDescription.trim(),
      longDescription: courseForm.longDescription.trim(),
      thumbnailUrl: courseForm.thumbnailUrl.trim(),
      bannerImageUrl: courseForm.bannerImageUrl.trim(),
      difficulty: courseForm.difficulty || undefined,
      estimatedDurationMinutes: Number.isNaN(estimatedMinutes || NaN)
        ? undefined
        : estimatedMinutes,
      tags,
      visibility: courseForm.visibility,
      status: courseForm.status,
    };
  };

  const handleSaveCourse = async () => {
    if (!currentUser?.id) return;
    if (!courseForm.title.trim()) {
      setError('Course title is required');
      return;
    }
    if (!courseForm.slug.trim()) {
      setError('Course slug is required');
      return;
    }

    try {
      setSavingCourse(true);
      setError(null);
      const payload = buildCoursePayload();

      if (courseFormMode === 'new') {
        const created = await createCourse(currentUser.id, payload);
        await loadCourses();
        setSelectedCourseId(created.id);
        await loadCourseDetail(created.id);
      } else if (selectedCourseId) {
        const updated = await updateCourse(selectedCourseId, payload);
        setCourses(prev =>
          prev.map(c => (c.id === updated.id ? updated : c))
        );
        await loadCourseDetail(updated.id);
      }
    } catch (e: any) {
      console.error('Error saving Academy course:', e);
      setError(e.message || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    try {
      await deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (selectedCourseId === courseId) {
        handleNewCourse();
      }
    } catch (e: any) {
      console.error('Error deleting Academy course:', e);
      setError(e.message || 'Failed to delete course');
    }
  };

  const handleCreateModule = async () => {
    if (!selectedCourseId) return;
    const title = window.prompt('Module title');
    if (!title || !title.trim()) return;
    try {
      await createModule({
        courseId: selectedCourseId,
        title: title.trim(),
      });
      await loadCourseDetail(selectedCourseId);
    } catch (e: any) {
      console.error('Error creating module:', e);
      setError(e.message || 'Failed to create module');
    }
  };

  const handleRenameModule = async (module: AcademyModule) => {
    const title = window.prompt('New module title', module.title);
    if (!title || !title.trim()) return;
    try {
      await updateModule(module.id, { title: title.trim() });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error updating module:', e);
      setError(e.message || 'Failed to update module');
    }
  };

  const handleDeleteModule = async (module: AcademyModule) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await deleteModule(module.id);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error deleting module:', e);
      setError(e.message || 'Failed to delete module');
    }
  };

  const handleCreateLesson = async (module: AcademyModule) => {
    const title = window.prompt('Lesson title');
    if (!title || !title.trim()) return;
    try {
      await createLesson({
        moduleId: module.id,
        title: title.trim(),
      });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error creating lesson:', e);
      setError(e.message || 'Failed to create lesson');
    }
  };

  const handleEditLesson = async (lesson: AcademyLesson) => {
    const title = window.prompt('Lesson title', lesson.title);
    if (!title || !title.trim()) return;
    try {
      await updateLesson(lesson.id, { title: title.trim() });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error updating lesson:', e);
      setError(e.message || 'Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (lesson: AcademyLesson) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await deleteLesson(lesson.id);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error deleting lesson:', e);
      setError(e.message || 'Failed to delete lesson');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Academy LMS</h2>
          <p className="text-sm text-slate-600">
            You need to be signed in to manage Academy courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Academy – LMS</h1>
            <p className="text-sm text-slate-500">
              Design courses, structure content, and track learners’ progress.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleNewCourse}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={16} />
            New Course
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={savingCourse}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingCourse ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving…
              </>
            ) : (
              <>
                <Save size={16} />
                Save Course
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Courses list */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} />
                Courses
              </h2>
              {loadingCourses && (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              )}
            </div>
            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {courses.length === 0 && !loadingCourses ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No courses yet. Create your first course to get started.
                </div>
              ) : (
                courses.map(course => {
                  const isSelected = course.id === selectedCourseId;
                  return (
                    <button
                      key={course.id}
                      onClick={() => handleSelectCourse(course.id)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <GraduationCap
                          size={18}
                          className={isSelected ? 'text-indigo-600' : 'text-slate-400'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {course.title}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              course.status === 'published'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : course.status === 'draft'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                          </span>
                        </div>
                        {course.shortDescription && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {course.shortDescription}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                          {course.difficulty && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} />
                              {course.difficulty}
                            </span>
                          )}
                          {course.estimatedDurationMinutes && (
                            <span>
                              ~{course.estimatedDurationMinutes} min total
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Basic analytics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart2 size={16} />
                Course Analytics
              </h2>
              {loadingAnalytics && (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              )}
            </div>
            {selectedCourseDetail ? (
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Users size={14} />
                    Enrollments
                  </span>
                  <span className="font-semibold text-slate-900">
                    {courseEnrollments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <CheckCircleIcon />
                    Completion rate
                  </span>
                  <span className="font-semibold text-slate-900">
                    {courseCompletionRate !== null
                      ? `${courseCompletionRate.toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Analytics are based on enrollments and completion status. More detailed
                  reporting can be added later.
                </p>
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-500">
                Select a course to view basic enrollment and completion statistics.
              </div>
            )}
          </div>
        </div>

        {/* Course editor & structure */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs for course management */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 pt-3 pb-0">
            <div className="flex gap-2 border-b border-slate-200">
              <button
                className={`px-3 py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'course-info'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('course-info')}
              >
                Course
              </button>
              <button
                className={`px-3 py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'structure'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('structure')}
              >
                Structure
              </button>
              <button
                className={`px-3 py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'enrollments'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('enrollments')}
              >
                Enrollments
              </button>
            </div>
          </div>

          {activeTab === 'course-info' && (
            <CourseInfoTab
              courseForm={courseForm}
              onChange={handleCourseFormChange}
              onUploadBanner={handleBannerUpload}
              bannerUploading={bannerUploading}
            />
          )}

          {activeTab === 'structure' && (
            <CourseStructureTab
              course={selectedCourseDetail}
              selectedCourseId={selectedCourseId}
              onCreateModule={handleCreateModule}
              onRenameModule={handleRenameModule}
              onDeleteModule={handleDeleteModule}
              onCreateLesson={handleCreateLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
            />
          )}

          {activeTab === 'enrollments' && (
            <CourseEnrollmentsTab
              course={selectedCourseDetail}
              enrollments={courseEnrollments}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon: React.FC = () => (
  <svg
    className="w-3 h-3 text-emerald-500"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default AcademyLms;

