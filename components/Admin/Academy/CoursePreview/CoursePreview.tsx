import React, { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Loader2, Maximize2 } from 'lucide-react';
import type { AcademyCourse } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import { getContentBlocksForCourse } from '../../../../services/academyContentBlockService';
import ChapterAccordion from './ChapterAccordion';
import CourseFullScreenPreview from './CourseFullScreenPreview';

export interface CoursePreviewProps {
  course: AcademyCourse | null;
  refreshKey?: number;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({ course, refreshKey = 0 }) => {
  const [contentBlocks, setContentBlocks] = useState<CourseContentBlocks | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (!course?.modules?.length) {
      setContentBlocks(null);
      return;
    }
    setLoading(true);
    getContentBlocksForCourse(course.modules)
      .then(setContentBlocks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [course?.id, course?.modules?.length, refreshKey]);

  if (!course) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm">
        Select a course to preview its structure.
      </div>
    );
  }

  const modules = course.modules || [];
  const totalLessons = modules.reduce((acc, m) => {
    const sectionLessons = (m.sections || []).reduce((a, s) => a + (s.lessons || []).length, 0);
    return acc + sectionLessons + (m.lessons || []).length;
  }, 0);

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100">
              <BookOpen size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Course Preview</h3>
              <p className="text-xs text-slate-500">
                {modules.length} chapter{modules.length !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFullScreen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            title="Full screen preview"
          >
            <Maximize2 size={14} />
            Full screen
          </button>
        </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
          <span className="text-sm font-semibold text-slate-800 truncate flex-1">{course.title}</span>
          {course.difficulty && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
              <GraduationCap size={10} />
              {course.difficulty}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : modules.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No chapters yet.</p>
        ) : (
          <div className="space-y-2">
            {modules.map((chapter, i) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                index={i}
                defaultExpanded={i === 0}
                contentBlocks={contentBlocks}
              />
            ))}
          </div>
        )}
      </div>
    </div>

      {showFullScreen && (
        <CourseFullScreenPreview
          course={course}
          contentBlocks={contentBlocks}
          onClose={() => setShowFullScreen(false)}
        />
      )}
    </>
  );
};

export default CoursePreview;
