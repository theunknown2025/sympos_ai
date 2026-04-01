import React from 'react';
import { FileText } from 'lucide-react';
import type { AcademyLesson } from '../../../../types';
import type { CourseContentBlocks } from '../../../../services/academyContentBlockService';
import ContentBlockPreview from './ContentBlockPreview';

export interface LessonPreviewProps {
  lesson: AcademyLesson;
  index?: number;
  contentBlocks?: CourseContentBlocks | null;
}

const LessonPreview: React.FC<LessonPreviewProps> = ({ lesson, index, contentBlocks }) => {
  const lessonBlocks = contentBlocks?.lessons?.[lesson.id] || [];

  return (
    <div className="py-2 px-3 rounded-lg hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-slate-400 shrink-0" />
        {index !== undefined && (
          <span className="text-xs font-medium text-slate-400 w-5">{index + 1}.</span>
        )}
        <span className="text-sm text-slate-800">{lesson.title}</span>
        {lesson.hasQuiz && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">Quiz</span>
        )}
      </div>
      {lessonBlocks.length > 0 && (
        <div className="space-y-1 mt-2 ml-7">
          {lessonBlocks.map(block => (
            <ContentBlockPreview key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonPreview;
