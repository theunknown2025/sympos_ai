import React from 'react';
import { Plus, Trash2, BookOpen, Layers, FileText, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import type { AcademyCourse, AcademyModule, AcademySection, AcademyLesson } from '../../../types';
import CourseStructureSelector from './CourseStructureSelector';
import InlineInput from './shared/InlineInput';

export type SelectedItem =
  | { type: 'chapter'; data: AcademyModule }
  | { type: 'section'; data: AcademySection; chapter: AcademyModule }
  | { type: 'lesson'; data: AcademyLesson; chapter: AcademyModule; section?: AcademySection }
  | null;

export interface StructureSummaryPanelProps {
  courses: AcademyCourse[];
  course: AcademyCourse | null;
  selectedCourseId: string | null;
  selectedItem: SelectedItem;
  onSelectCourse: (courseId: string | null) => void;
  onSelectItem: (item: SelectedItem) => void;
  expandedChapters: Set<string>;
  onToggleChapter: (id: string) => void;
  addingMode: 'chapter' | 'section' | 'lesson' | null;
  addingContext: { chapter?: AcademyModule; section?: AcademySection };
  inlineValue: string;
  onInlineValueChange: (v: string) => void;
  onStartAddChapter: () => void;
  onStartAddSection: (chapter: AcademyModule) => void;
  onStartAddLesson: (chapter: AcademyModule, section?: AcademySection) => void;
  onConfirmAdd: () => void;
  onCancelAdd: () => void;
  editingChapterId: string | null;
  editingSectionId: string | null;
  editValue: string;
  onEditValueChange: (v: string) => void;
  onConfirmEditChapter: () => void;
  onCancelEditChapter: () => void;
  onConfirmEditSection: () => void;
  onCancelEditSection: () => void;
  onStartEditChapter: (chapter: AcademyModule) => void;
  onStartEditSection: (section: AcademySection) => void;
  onDeleteChapter: (chapter: AcademyModule) => void;
  onDeleteSection: (section: AcademySection) => void;
  onDeleteLesson: (lesson: AcademyLesson) => void;
}

const StructureSummaryPanel: React.FC<StructureSummaryPanelProps> = ({
  courses,
  course,
  selectedCourseId,
  selectedItem,
  onSelectItem,
  expandedChapters,
  onToggleChapter,
  addingMode,
  addingContext,
  inlineValue,
  onInlineValueChange,
  onStartAddChapter,
  onStartAddSection,
  onStartAddLesson,
  onConfirmAdd,
  onCancelAdd,
  editingChapterId,
  editingSectionId,
  editValue,
  onEditValueChange,
  onConfirmEditChapter,
  onCancelEditChapter,
  onConfirmEditSection,
  onCancelEditSection,
  onStartEditChapter,
  onStartEditSection,
  onDeleteChapter,
  onDeleteSection,
  onDeleteLesson,
  onSelectCourse,
}) => {
  const isSelected = (type: string, id: string) =>
    selectedItem?.type === type && (selectedItem as any).data?.id === id;

  return (
    <div className="flex flex-col h-full border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <CourseStructureSelector
          courses={courses}
          selectedCourseId={selectedCourseId}
          onSelect={onSelectCourse}
        />
        <button
          onClick={onStartAddChapter}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        >
          <Plus size={14} />
          Add Chapter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
          Summary
        </h3>
        {!course ? (
          <p className="text-sm text-slate-500">Select a course.</p>
        ) : !course.modules?.length && addingMode !== 'chapter' ? (
          <p className="text-sm text-slate-500">No chapters yet.</p>
        ) : (
          <div className="space-y-1">
            {addingMode === 'chapter' && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-indigo-50/80 border border-indigo-100">
                <BookOpen size={14} className="text-indigo-600 shrink-0" />
                <InlineInput
                  value={inlineValue}
                  onChange={onInlineValueChange}
                  onApprove={onConfirmAdd}
                  onCancel={onCancelAdd}
                  placeholder="Chapter title..."
                />
              </div>
            )}
            {course.modules?.map((chapter) => (
              <div key={chapter.id}>
                <div
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer group ${
                    isSelected('chapter', chapter.id) ? 'bg-indigo-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => onToggleChapter(chapter.id)}
                    className="p-0.5 rounded hover:bg-slate-200"
                  >
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown size={14} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-500" />
                    )}
                  </button>
                  <BookOpen size={14} className="text-indigo-600 shrink-0" />
                  {editingChapterId === chapter.id ? (
                    <InlineInput
                      value={editValue}
                      onChange={onEditValueChange}
                      onApprove={onConfirmEditChapter}
                      onCancel={onCancelEditChapter}
                      placeholder="Chapter title..."
                    />
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left text-sm font-medium text-slate-800 truncate"
                        onClick={() => onSelectItem({ type: 'chapter', data: chapter })}
                      >
                        {chapter.title}
                      </button>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartAddSection(chapter); }}
                          className="p-1 rounded hover:bg-slate-200"
                          title="Add section"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartAddLesson(chapter); }}
                          className="p-1 rounded hover:bg-slate-200"
                          title="Add lesson"
                        >
                          <Layers size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartEditChapter(chapter); }}
                          className="p-1 rounded hover:bg-amber-100"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteChapter(chapter); }}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {expandedChapters.has(chapter.id) && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                    {addingMode === 'section' && addingContext.chapter?.id === chapter.id && (
                      <div className="flex items-center gap-2 py-2">
                        <Layers size={12} className="text-indigo-500 shrink-0" />
                        <InlineInput
                          value={inlineValue}
                          onChange={onInlineValueChange}
                          onApprove={onConfirmAdd}
                          onCancel={onCancelAdd}
                          placeholder="Section title..."
                        />
                      </div>
                    )}
                    {(chapter.sections || []).map((section) => (
                      <div key={section.id}>
                        <div
                          className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer group ${
                            isSelected('section', section.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <Layers size={12} className="text-slate-500 shrink-0" />
                          {editingSectionId === section.id ? (
                            <InlineInput
                              value={editValue}
                              onChange={onEditValueChange}
                              onApprove={onConfirmEditSection}
                              onCancel={onCancelEditSection}
                              placeholder="Section title..."
                            />
                          ) : (
                            <>
                              <button
                                className="flex-1 text-left text-xs font-medium text-slate-700 truncate"
                                onClick={() => onSelectItem({ type: 'section', data: section, chapter })}
                              >
                                {section.title}
                              </button>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStartAddLesson(chapter, section); }}
                                  className="p-0.5 rounded hover:bg-slate-200"
                                  title="Add lesson"
                                >
                                  <Plus size={10} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStartEditSection(section); }}
                                  className="p-0.5 rounded hover:bg-amber-100"
                                  title="Edit"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteSection(section); }}
                                  className="p-0.5 rounded hover:bg-red-100 text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {addingMode === 'lesson' && addingContext.chapter?.id === chapter.id && addingContext.section?.id === section.id && (
                            <div className="flex items-center gap-2 py-1.5">
                              <FileText size={12} className="text-indigo-500 shrink-0" />
                              <InlineInput
                                value={inlineValue}
                                onChange={onInlineValueChange}
                                onApprove={onConfirmAdd}
                                onCancel={onCancelAdd}
                                placeholder="Lesson title..."
                              />
                            </div>
                          )}
                          {(section.lessons || []).map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer group ${
                                isSelected('lesson', lesson.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                              }`}
                              onClick={() => onSelectItem({ type: 'lesson', data: lesson, chapter, section })}
                            >
                              <FileText size={12} className="text-slate-400 shrink-0" />
                              <span className="flex-1 text-xs text-slate-600 truncate">{lesson.title}</span>
                              {lesson.hasQuiz && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-600">Quiz</span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson); }}
                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600"
                                title="Delete"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {addingMode === 'lesson' && addingContext.chapter?.id === chapter.id && !addingContext.section && (
                      <div className="flex items-center gap-2 py-1.5">
                        <FileText size={12} className="text-indigo-500 shrink-0" />
                        <InlineInput
                          value={inlineValue}
                          onChange={onInlineValueChange}
                          onApprove={onConfirmAdd}
                          onCancel={onCancelAdd}
                          placeholder="Lesson title..."
                        />
                      </div>
                    )}
                    {(chapter.lessons || []).map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer group ${
                          isSelected('lesson', lesson.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => onSelectItem({ type: 'lesson', data: lesson, chapter })}
                      >
                        <FileText size={12} className="text-slate-400 shrink-0" />
                        <span className="flex-1 text-xs text-slate-600 truncate">{lesson.title}</span>
                        {lesson.hasQuiz && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-600">Quiz</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson); }}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StructureSummaryPanel;
