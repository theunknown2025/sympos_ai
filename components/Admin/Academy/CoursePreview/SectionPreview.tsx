import React from 'react';
import { Layers } from 'lucide-react';
import type { AcademySection } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import LessonPreview from './LessonPreview';
import ContentBlockPreview from './ContentBlockPreview';

export interface SectionPreviewProps {
  section: AcademySection;
  index?: number;
  contentBlocks?: CourseContentBlocks | null;
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ section, index, contentBlocks }) => {
  const sectionBlocks = contentBlocks?.sections?.[section.id] || [];

  return (
    <div className="border-l-2 border-slate-200 pl-4 ml-2">
      <div className="flex items-start gap-2 py-2">
        <Layers size={14} className="text-slate-500 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          {index !== undefined && (
            <span className="text-xs font-medium text-slate-400">{index + 1}. </span>
          )}
          <span className="text-sm font-medium text-slate-800">{section.title}</span>
          {section.description && (
            <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
          )}
        </div>
      </div>
      {sectionBlocks.length > 0 && (
        <div className="space-y-1 mt-2">
          {sectionBlocks.map(block => (
            <ContentBlockPreview key={block.id} block={block} />
          ))}
        </div>
      )}
      {(section.lessons || []).length > 0 && (
        <div className="space-y-0.5 mt-1">
          {(section.lessons || []).map((lesson, i) => (
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

export default SectionPreview;
