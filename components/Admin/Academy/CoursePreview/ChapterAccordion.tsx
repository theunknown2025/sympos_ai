import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AcademyModule } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import ChapterPreview from './ChapterPreview';

export interface ChapterAccordionProps {
  chapter: AcademyModule;
  index?: number;
  defaultExpanded?: boolean;
  contentBlocks?: CourseContentBlocks | null;
}

const ChapterAccordion: React.FC<ChapterAccordionProps> = ({
  chapter,
  index,
  defaultExpanded = true,
  contentBlocks,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sectionsCount = (chapter.sections || []).length;
  const lessonsCount = (chapter.lessons || []).length + (chapter.sections || []).reduce(
    (acc, s) => acc + (s.lessons || []).length,
    0
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={18} className="text-slate-500 shrink-0" />
        ) : (
          <ChevronRight size={18} className="text-slate-500 shrink-0" />
        )}
        {index !== undefined && (
          <span className="text-sm font-medium text-slate-400 w-6">{index + 1}.</span>
        )}
        <span className="flex-1 text-sm font-semibold text-slate-900 truncate">
          {chapter.title}
        </span>
        <span className="text-xs text-slate-500 shrink-0">
          {sectionsCount} section{sectionsCount !== 1 ? 's' : ''} · {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
        </span>
      </button>
      {expanded && (
        <div className="p-4 bg-white border-t border-slate-200">
          <ChapterPreview chapter={chapter} index={index} contentBlocks={contentBlocks} />
        </div>
      )}
    </div>
  );
};

export default ChapterAccordion;
