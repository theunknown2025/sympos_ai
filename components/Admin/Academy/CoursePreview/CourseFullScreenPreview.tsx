import React, { useEffect, useState } from 'react';
import { X, BookOpen, GraduationCap, Clock, Layers, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import type { AcademyCourse, AcademyModule, AcademySection, AcademyLesson } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import ContentBlockPreview from './ContentBlockPreview';

export type PreviewSelectedItem =
  | { type: 'chapter'; data: AcademyModule }
  | { type: 'section'; data: AcademySection; chapter: AcademyModule }
  | { type: 'lesson'; data: AcademyLesson; chapter: AcademyModule; section?: AcademySection }
  | null;

export interface CourseFullScreenPreviewProps {
  course: AcademyCourse;
  contentBlocks: CourseContentBlocks | null;
  onClose: () => void;
}

const CourseFullScreenPreview: React.FC<CourseFullScreenPreviewProps> = ({
  course,
  contentBlocks,
  onClose,
}) => {
  const modules = course.modules || [];
  const [selectedItem, setSelectedItem] = useState<PreviewSelectedItem>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (modules.length > 0) {
      setExpandedChapters(prev => {
        const next = new Set(prev);
        modules.forEach(m => next.add(m.id));
        return next;
      });
    }
  }, [course?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalLessons = modules.reduce((acc, m) => {
    const sectionLessons = (m.sections || []).reduce((a, s) => a + (s.lessons || []).length, 0);
    return acc + sectionLessons + (m.lessons || []).length;
  }, 0);

  const isSelected = (type: string, id: string) =>
    selectedItem?.type === type && (selectedItem as { data: { id: string } }).data?.id === id;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <BookOpen size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
            <p className="text-sm text-slate-500">
              {modules.length} chapter{modules.length !== 1 ? 's' : ''} · {totalLessons} lesson
              {totalLessons !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close preview"
        >
          <X size={24} />
        </button>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Structure */}
        <aside className="w-72 shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Structure</h2>
          </div>
          <div className="p-3 space-y-1">
            {modules.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No chapters yet.</p>
            ) : (
              modules.map(chapter => {
                const expanded = expandedChapters.has(chapter.id);
                const sections = chapter.sections || [];
                const directLessons = chapter.lessons || [];
                return (
                  <div key={chapter.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="p-0.5 rounded hover:bg-slate-200"
                      >
                        {expanded ? (
                          <ChevronDown size={14} className="text-slate-500" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedItem({ type: 'chapter', data: chapter })}
                        className={`flex-1 flex items-center gap-2 py-2 px-2 rounded-lg text-left w-full ${
                          isSelected('chapter', chapter.id) ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-slate-100'
                        }`}
                      >
                        <BookOpen size={14} className="text-indigo-600 shrink-0" />
                        <span className="text-sm font-medium truncate">{chapter.title}</span>
                      </button>
                    </div>
                    {expanded && (
                      <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-slate-200 pl-3">
                        {sections.map(section => (
                          <div key={section.id}>
                            <button
                              onClick={() =>
                                setSelectedItem({ type: 'section', data: section, chapter })
                              }
                              className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-left ${
                                isSelected('section', section.id) ? 'bg-indigo-50' : 'hover:bg-slate-100'
                              }`}
                            >
                              <Layers size={12} className="text-slate-500 shrink-0" />
                              <span className="text-xs font-medium truncate">{section.title}</span>
                            </button>
                            <div className="ml-4 space-y-0.5">
                              {(section.lessons || []).map(lesson => (
                                <button
                                  key={lesson.id}
                                  onClick={() =>
                                    setSelectedItem({
                                      type: 'lesson',
                                      data: lesson,
                                      chapter,
                                      section,
                                    })
                                  }
                                  className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-left ${
                                    isSelected('lesson', lesson.id) ? 'bg-indigo-50' : 'hover:bg-slate-100'
                                  }`}
                                >
                                  <FileText size={12} className="text-slate-400 shrink-0" />
                                  <span className="text-xs truncate">{lesson.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {directLessons.map(lesson => (
                          <button
                            key={lesson.id}
                            onClick={() =>
                              setSelectedItem({ type: 'lesson', data: lesson, chapter })
                            }
                            className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-left ${
                              isSelected('lesson', lesson.id) ? 'bg-indigo-50' : 'hover:bg-slate-100'
                            }`}
                          >
                            <FileText size={12} className="text-slate-400 shrink-0" />
                            <span className="text-xs truncate">{lesson.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {!selectedItem ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <BookOpen size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">Select a chapter, section, or lesson</p>
              <p className="text-xs mt-1">to view its content</p>
            </div>
          ) : selectedItem.type === 'chapter' ? (
            <PreviewContentPanel
              type="chapter"
              title={selectedItem.data.title}
              description={selectedItem.data.description}
              blocks={contentBlocks?.modules?.[selectedItem.data.id] || []}
            />
          ) : selectedItem.type === 'section' ? (
            <PreviewContentPanel
              type="section"
              title={selectedItem.data.title}
              description={selectedItem.data.description}
              blocks={contentBlocks?.sections?.[selectedItem.data.id] || []}
            />
          ) : (
            <PreviewContentPanel
              type="lesson"
              title={selectedItem.data.title}
              blocks={contentBlocks?.lessons?.[selectedItem.data.id] || []}
              hasQuiz={selectedItem.data.hasQuiz}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const PreviewContentPanel: React.FC<{
  type: 'chapter' | 'section' | 'lesson';
  title: string;
  description?: string;
  blocks: { id: string; blockType: string; content: Record<string, unknown> }[];
  hasQuiz?: boolean;
}> = ({ type, title, description, blocks, hasQuiz }) => {
  const icons = { chapter: BookOpen, section: Layers, lesson: FileText };
  const Icon = icons[type];
  const labels = { chapter: 'Chapter', section: 'Section', lesson: 'Lesson' };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-indigo-100">
          <Icon size={20} className="text-indigo-600" />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">{labels[type]}</span>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        {hasQuiz && (
          <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">Quiz</span>
        )}
      </div>

      {description && (
        <div className="mb-6">
          <p className="text-slate-600 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {blocks.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Content</h3>
          <div className="space-y-3">
            {blocks.map(block => (
              <ContentBlockPreview key={block.id} block={block as any} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No content added yet.</p>
      )}
    </div>
  );
};

export default CourseFullScreenPreview;
