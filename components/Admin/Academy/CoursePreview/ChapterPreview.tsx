import React from 'react';
import { BookOpen } from 'lucide-react';
import type { AcademyModule } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import SectionPreview from './SectionPreview';
import LessonPreview from './LessonPreview';
import ContentBlockPreview from './ContentBlockPreview';

export interface ChapterPreviewProps {
  chapter: AcademyModule;
  index?: number;
  contentBlocks?: CourseContentBlocks | null;
}

const ChapterPreview: React.FC<ChapterPreviewProps> = ({ chapter, index, contentBlocks }) => {
  const sections = chapter.sections || [];
  const directLessons = chapter.lessons || [];
  const hasSections = sections.length > 0;
  const hasDirectLessons = directLessons.length > 0;
  const moduleBlocks = contentBlocks?.modules?.[chapter.id] || [];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <BookOpen size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          {index !== undefined && (
            <span className="text-xs font-medium text-slate-400">{index + 1}. </span>
          )}
          <span className="text-sm font-semibold text-slate-900">{chapter.title}</span>
          {chapter.description && (
            <p className="text-xs text-slate-500 mt-0.5">{chapter.description}</p>
          )}
        </div>
      </div>
      {moduleBlocks.length > 0 && (
        <div className="space-y-1 ml-2 mt-2">
          {moduleBlocks.map(block => (
            <ContentBlockPreview key={block.id} block={block} />
          ))}
        </div>
      )}
      {hasSections && (
        <div className="space-y-3 ml-2">
          {sections.map((section, i) => (
            <SectionPreview
              key={section.id}
              section={section}
              index={i}
              contentBlocks={contentBlocks}
            />
          ))}
        </div>
      )}
      {hasDirectLessons && !hasSections && (
        <div className="space-y-0.5 ml-4 mt-1">
          {directLessons.map((lesson, i) => (
            <LessonPreview
              key={lesson.id}
              lesson={lesson}
              index={i}
              contentBlocks={contentBlocks}
            />
          ))}
        </div>
      )}
      {hasDirectLessons && hasSections && (
        <div className="ml-4 border-l-2 border-slate-100 pl-4 space-y-0.5">
          <span className="text-xs font-medium text-slate-400">Direct lessons</span>
          {directLessons.map((lesson, i) => (
            <LessonPreview
              key={lesson.id}
              lesson={lesson}
              index={i}
              contentBlocks={contentBlocks}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChapterPreview;
