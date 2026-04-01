import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Loader2,
  AlertCircle,
  Save,
  BookOpen,
  List,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type {
  AcademyCourse,
  AcademyModule,
  AcademySection,
  AcademyLesson,
  AcademyCourseStatus,
  AcademyCourseVisibility,
  AcademyDifficulty,
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
  createSection,
  updateSection,
  deleteSection,
} from '../../../services/academySectionService';
import CourseInfoTab, { CourseFormState } from './CourseInfoTab';
import CourseStructureTab from './CourseStructureTab';
import CourseListDisplay from './CourseListDisplay';
import CoursePreviewModal from './CoursePreviewModal';

type CourseFormMode = 'new' | 'edit';
type CourseManagerTab = 'new-course' | 'list' | 'structure';

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

const CourseManager: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<CourseManagerTab>('list');
  const [previewCourse, setPreviewCourse] = useState<AcademyCourse | null>(null);

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
      }
    } catch (e: any) {
      console.error('Error loading Academy course detail:', e);
      setError(e.message || 'Failed to load course detail');
    } finally {
      setLoadingDetail(false);
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
    setActiveTab('new-course');
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
        setActiveTab('list');
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

  const handleCreateModule = async (title: string) => {
    if (!selectedCourseId) return;
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

  const handleRenameModule = async (module: AcademyModule, title: string) => {
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

  const handleSaveChapterContent = async (
    module: AcademyModule,
    updates: { title?: string; description?: string }
  ) => {
    try {
      await updateModule(module.id, updates);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error updating module content:', e);
      setError(e.message || 'Failed to update chapter');
      throw e;
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

  const handleCreateSection = async (chapter: AcademyModule, title: string) => {
    try {
      await createSection({
        moduleId: chapter.id,
        title: title.trim(),
      });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error creating section:', e);
      setError(e.message || 'Failed to create section');
    }
  };

  const handleRenameSection = async (section: AcademySection, title: string) => {
    try {
      await updateSection(section.id, { title: title.trim() });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error updating section:', e);
      setError(e.message || 'Failed to update section');
    }
  };

  const handleSaveSectionContent = async (
    section: AcademySection,
    updates: { title?: string; description?: string }
  ) => {
    try {
      await updateSection(section.id, updates);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error updating section content:', e);
      setError(e.message || 'Failed to update section');
      throw e;
    }
  };

  const handleDeleteSection = async (section: AcademySection) => {
    if (!window.confirm('Delete this section and all its lessons?')) return;
    try {
      await deleteSection(section.id);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error deleting section:', e);
      setError(e.message || 'Failed to delete section');
    }
  };

  const handleCreateLesson = async (
    chapter: AcademyModule,
    section: AcademySection | undefined,
    title: string
  ) => {
    try {
      await createLesson({
        moduleId: chapter.id,
        sectionId: section?.id,
        title: title.trim(),
        orderIndex: section ? (section.lessons?.length ?? 0) : (chapter.lessons?.length ?? 0),
      });
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      console.error('Error creating lesson:', e);
      setError(e.message || 'Failed to create lesson');
    }
  };

  const handleSaveLessonContent = async (
    lesson: AcademyLesson,
    updates: {
      title?: string;
      contentRichText?: any;
      videoUrl?: string;
      attachmentUrls?: string[];
      hasQuiz?: boolean;
    }
  ) => {
    try {
      await updateLesson(lesson.id, updates);
      if (selectedCourseId) {
        await loadCourseDetail(selectedCourseId);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update lesson');
      throw e;
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

  const handleDisplayCourse = async (course: AcademyCourse) => {
    try {
      const detail = await getCourseWithContent(course.id);
      setPreviewCourse(detail);
    } catch (e: any) {
      setError(e.message || 'Failed to load course preview');
    }
  };

  const handleEditCourse = (course: AcademyCourse) => {
    handleSelectCourse(course.id);
    setActiveTab('new-course');
  };

  const handlePublishCourse = async (course: AcademyCourse) => {
    try {
      await updateCourse(course.id, { status: 'published' });
      await loadCourses();
      if (selectedCourseId === course.id) {
        await loadCourseDetail(course.id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to publish course');
    }
  };

  const handleUnpublishCourse = async (course: AcademyCourse) => {
    try {
      await updateCourse(course.id, { status: 'draft' });
      await loadCourses();
      if (selectedCourseId === course.id) {
        await loadCourseDetail(course.id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to unpublish course');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Course Manager</h2>
          <p className="text-sm text-slate-600">
            You need to be signed in to manage courses.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'new-course' as const, label: 'New Course', icon: Plus },
    { id: 'list' as const, label: 'List of Courses', icon: List },
    { id: 'structure' as const, label: 'Course Structure', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <BookOpen className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Course Manager</h1>
            <p className="text-sm text-slate-500">
              Create courses, manage the catalog, and structure content.
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
          {activeTab === 'new-course' && (
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
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 pt-3 pb-0">
        <div className="flex gap-2 border-b border-slate-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'new-course' && (
        <CourseInfoTab
          courseForm={courseForm}
          onChange={handleCourseFormChange}
          onUploadBanner={handleBannerUpload}
          bannerUploading={bannerUploading}
        />
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} />
              Saved Courses
            </h2>
            {loadingCourses && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>
          {courses.length === 0 && !loadingCourses ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No courses yet. Create your first course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Thumbnail</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Short Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Long Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Visibility</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <CourseListDisplay
                      key={course.id}
                      course={course}
                      onDisplay={handleDisplayCourse}
                      onEdit={handleEditCourse}
                      onDelete={c => handleDeleteCourse(c.id)}
                      onPublish={handlePublishCourse}
                      onUnpublish={handleUnpublishCourse}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {activeTab === 'structure' && (
        <CourseStructureTab
          courses={courses}
          course={selectedCourseDetail}
          selectedCourseId={selectedCourseId}
          onSelectCourse={handleSelectCourse}
          onCreateChapter={handleCreateModule}
          onRenameChapter={handleRenameModule}
          onDeleteChapter={handleDeleteModule}
          onSaveChapterContent={handleSaveChapterContent}
          onCreateSection={handleCreateSection}
          onRenameSection={handleRenameSection}
          onDeleteSection={handleDeleteSection}
          onSaveSectionContent={handleSaveSectionContent}
          onCreateLesson={handleCreateLesson}
          onSaveLessonContent={handleSaveLessonContent}
          onDeleteLesson={handleDeleteLesson}
        />
      )}
    </div>
  );
};

export default CourseManager;
