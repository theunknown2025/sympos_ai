import React, { useState, useCallback, useEffect } from 'react';
import type { AcademyCourse, AcademyModule, AcademySection, AcademyLesson } from '../../../types';
import CourseStructureSelector from './CourseStructureSelector';
import StructureSummaryPanel, { type SelectedItem } from './StructureSummaryPanel';
import ContentPanel from './ContentPanel';
import { CoursePreview } from './CoursePreview';

export interface CourseStructureTabProps {
  courses: AcademyCourse[];
  course: AcademyCourse | null;
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string | null) => void;
  onCreateChapter: (title: string) => Promise<void>;
  onRenameChapter: (module: AcademyModule, title: string) => Promise<void>;
  onDeleteChapter: (module: AcademyModule) => void;
  onSaveChapterContent: (module: AcademyModule, updates: { title?: string; description?: string }) => Promise<void>;
  onCreateSection: (chapter: AcademyModule, title: string) => Promise<void>;
  onRenameSection: (section: AcademySection, title: string) => Promise<void>;
  onDeleteSection: (section: AcademySection) => void;
  onSaveSectionContent: (section: AcademySection, updates: { title?: string; description?: string }) => Promise<void>;
  onCreateLesson: (chapter: AcademyModule, section: AcademySection | undefined, title: string) => Promise<void>;
  onSaveLessonContent: (lesson: AcademyLesson, updates: {
    title?: string;
    contentRichText?: any;
    videoUrl?: string;
    attachmentUrls?: string[];
    hasQuiz?: boolean;
  }) => Promise<void>;
  onDeleteLesson: (lesson: AcademyLesson) => void;
}

type AddingMode = 'chapter' | 'section' | 'lesson' | null;

const CourseStructureTab: React.FC<CourseStructureTabProps> = ({
  courses,
  course,
  selectedCourseId,
  onSelectCourse,
  onCreateChapter,
  onRenameChapter,
  onDeleteChapter,
  onSaveChapterContent,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
  onSaveSectionContent,
  onCreateLesson,
  onSaveLessonContent,
  onDeleteLesson,
}) => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [addingMode, setAddingMode] = useState<AddingMode>(null);
  const [addingContext, setAddingContext] = useState<{ chapter?: AcademyModule; section?: AcademySection }>({});
  const [inlineValue, setInlineValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  useEffect(() => {
    if (course?.modules?.length) {
      setExpandedChapters(prev => {
        const next = new Set(prev);
        course.modules!.forEach(m => next.add(m.id));
        return next;
      });
    }
  }, [course?.id, course?.modules?.length]);

  useEffect(() => {
    if (addingContext.chapter && (addingMode === 'section' || addingMode === 'lesson')) {
      setExpandedChapters(prev => new Set([...prev, addingContext.chapter!.id]));
    }
  }, [addingMode, addingContext.chapter]);

  // Keep selectedItem in sync with refetched course data after save
  useEffect(() => {
    if (!selectedItem || !course) return;
    if (selectedItem.type === 'chapter') {
      const fresh = course.modules?.find(m => m.id === selectedItem.data.id);
      if (fresh && fresh !== selectedItem.data) {
        setSelectedItem({ type: 'chapter', data: fresh });
      }
    } else if (selectedItem.type === 'section') {
      const freshChapter = course.modules?.find(m => m.id === selectedItem.chapter.id);
      const freshSection = freshChapter?.sections?.find(s => s.id === selectedItem.data.id);
      if (freshChapter && freshSection && (freshSection !== selectedItem.data || freshChapter !== selectedItem.chapter)) {
        setSelectedItem({ type: 'section', data: freshSection, chapter: freshChapter });
      }
    } else if (selectedItem.type === 'lesson') {
      const freshChapter = course.modules?.find(m => m.id === selectedItem.chapter.id);
      const freshSection = selectedItem.section
        ? freshChapter?.sections?.find(s => s.id === selectedItem.section!.id)
        : undefined;
      const freshLesson = freshSection
        ? freshSection.lessons?.find(l => l.id === selectedItem.data.id)
        : freshChapter?.lessons?.find(l => l.id === selectedItem.data.id);
      if (freshChapter && freshLesson && freshLesson !== selectedItem.data) {
        setSelectedItem({
          type: 'lesson',
          data: freshLesson,
          chapter: freshChapter,
          section: freshSection,
        });
      }
    }
  }, [course, selectedItem?.type, selectedItem?.data?.id]);

  const startAddChapter = useCallback(() => {
    setAddingMode('chapter');
    setAddingContext({});
    setInlineValue('');
  }, []);

  const startAddSection = useCallback((chapter: AcademyModule) => {
    setAddingMode('section');
    setAddingContext({ chapter });
    setInlineValue('');
  }, []);

  const startAddLesson = useCallback((chapter: AcademyModule, section?: AcademySection) => {
    setAddingMode('lesson');
    setAddingContext({ chapter, section });
    setInlineValue('');
  }, []);

  const confirmAdd = useCallback(async () => {
    const title = inlineValue.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      if (addingMode === 'chapter') {
        await onCreateChapter(title);
      } else if (addingMode === 'section' && addingContext.chapter) {
        await onCreateSection(addingContext.chapter, title);
      } else if (addingMode === 'lesson' && addingContext.chapter) {
        await onCreateLesson(addingContext.chapter, addingContext.section, title);
      }
      setAddingMode(null);
      setAddingContext({});
      setInlineValue('');
    } finally {
      setSaving(false);
    }
  }, [addingMode, addingContext, inlineValue, saving, onCreateChapter, onCreateSection, onCreateLesson]);

  const cancelAdd = useCallback(() => {
    setAddingMode(null);
    setAddingContext({});
    setInlineValue('');
  }, []);

  const startEditChapter = useCallback((chapter: AcademyModule) => {
    setEditingChapterId(chapter.id);
    setEditValue(chapter.title);
  }, []);

  const startEditSection = useCallback((section: AcademySection) => {
    setEditingSectionId(section.id);
    setEditValue(section.title);
  }, []);

  const confirmEditChapter = useCallback(async () => {
    const ch = course?.modules?.find(m => m.id === editingChapterId);
    if (!ch || !editValue.trim()) return;
    setSaving(true);
    try {
      await onRenameChapter(ch, editValue.trim());
      setEditingChapterId(null);
      setEditValue('');
    } finally {
      setSaving(false);
    }
  }, [course?.modules, editingChapterId, editValue, onRenameChapter]);

  const confirmEditSection = useCallback(async () => {
    const section = Object.values(course?.modules || [])
      .flatMap(m => m.sections || [])
      .find(s => s.id === editingSectionId);
    if (!section || !editValue.trim()) return;
    setSaving(true);
    try {
      await onRenameSection(section, editValue.trim());
      setEditingSectionId(null);
      setEditValue('');
    } finally {
      setSaving(false);
    }
  }, [course?.modules, editingSectionId, editValue, onRenameSection]);

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!selectedCourseId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="mb-4">
          <CourseStructureSelector
            courses={courses}
            selectedCourseId={null}
            onSelect={onSelectCourse}
          />
        </div>
        <p className="text-sm text-slate-500 text-center py-12">
          Search and select a course above to structure its chapters, sections, and lessons.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Container 1: Course builder and content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.35fr)_1fr] flex-1 min-h-0">
          {/* Left: Summary */}
          <StructureSummaryPanel
          courses={courses}
          course={course}
          selectedCourseId={selectedCourseId}
          selectedItem={selectedItem}
          onSelectCourse={onSelectCourse}
          onSelectItem={setSelectedItem}
          expandedChapters={expandedChapters}
          onToggleChapter={toggleChapter}
          addingMode={addingMode}
          addingContext={addingContext}
          inlineValue={inlineValue}
          onInlineValueChange={setInlineValue}
          onStartAddChapter={startAddChapter}
          onStartAddSection={startAddSection}
          onStartAddLesson={startAddLesson}
          onConfirmAdd={confirmAdd}
          onCancelAdd={cancelAdd}
          editingChapterId={editingChapterId}
          editingSectionId={editingSectionId}
          editValue={editValue}
          onEditValueChange={setEditValue}
          onConfirmEditChapter={confirmEditChapter}
          onCancelEditChapter={() => { setEditingChapterId(null); setEditValue(''); }}
          onConfirmEditSection={confirmEditSection}
          onCancelEditSection={() => { setEditingSectionId(null); setEditValue(''); }}
          onStartEditChapter={startEditChapter}
          onStartEditSection={startEditSection}
          onDeleteChapter={onDeleteChapter}
          onDeleteSection={onDeleteSection}
          onDeleteLesson={onDeleteLesson}
        />

          {/* Right: Content editor */}
          <div className="flex flex-col min-h-0 border-l border-slate-200 bg-slate-50/30">
            <ContentPanel
              selectedItem={selectedItem}
              onSaveChapter={onSaveChapterContent}
              onSaveSection={onSaveSectionContent}
              onSaveLesson={onSaveLessonContent}
              onBlocksChange={() => setContentRefreshKey(k => k + 1)}
            />
          </div>
        </div>
      </div>

      {/* Container 2: Course preview - expands with content, no inner scroll */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[480px]">
        <CoursePreview course={course} refreshKey={contentRefreshKey} />
      </div>
    </div>
  );
};

export default CourseStructureTab;
