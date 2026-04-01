import React, { useState } from 'react';
import { GripVertical, CheckCircle2, User, Mail, Calendar } from 'lucide-react';
import type { FormSubmission } from '../../../../types';
import type { ProgramCard, Venue } from './ProgramBuilder';

interface SubmissionsProgramsProps {
  submissions: FormSubmission[];
  onDragSubmission: (submission: FormSubmission) => void;
  isDraggingSubmission: boolean;
  draggedSubmission: FormSubmission | null;
}

const SubmissionsPrograms: React.FC<SubmissionsProgramsProps> = ({
  submissions,
  onDragSubmission,
  isDraggingSubmission,
  draggedSubmission,
}) => {
  const [draggedSubmissionId, setDraggedSubmissionId] = useState<string | null>(null);

  const handleSubmissionMouseDown = (e: React.MouseEvent, submission: FormSubmission) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedSubmissionId(submission.id);
    onDragSubmission(submission);
  };

  const handleSubmissionMouseUp = () => {
    setDraggedSubmissionId(null);
  };

  const getSubmissionTitle = (submission: FormSubmission): string => {
    // Try to get title from answers or general info
    if (submission.answers) {
      // Look for common title fields
      const titleFields = ['title', 'paperTitle', 'paper_title', 'submissionTitle', 'submission_title', 'name'];
      for (const field of titleFields) {
        if (submission.answers[field] && typeof submission.answers[field] === 'string') {
          return submission.answers[field] as string;
        }
      }
    }
    
    // Fallback to name or email
    return submission.generalInfo?.name || submission.submittedBy || 'Untitled Submission';
  };

  const getSubmissionDescription = (submission: FormSubmission): string => {
    if (submission.answers) {
      const descFields = ['description', 'abstract', 'summary', 'paperDescription', 'paper_description'];
      for (const field of descFields) {
        if (submission.answers[field] && typeof submission.answers[field] === 'string') {
          return submission.answers[field] as string;
        }
      }
    }
    return '';
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No approved submissions found</p>
        <p className="text-xs text-slate-400 mt-1">Drag approved submissions here to add them to the program</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-2">
          Drag submissions to the program grid to schedule them
        </p>
      </div>
      
      {submissions.map((submission) => {
        const isDragging = draggedSubmissionId === submission.id;
        const title = getSubmissionTitle(submission);
        const description = getSubmissionDescription(submission);
        
        return (
          <div
            key={submission.id}
            onMouseDown={(e) => handleSubmissionMouseDown(e, submission)}
            onMouseUp={handleSubmissionMouseUp}
            className={`
              p-3 border rounded-lg transition-all cursor-move select-none
              ${isDragging 
                ? 'border-indigo-400 bg-indigo-50 shadow-md opacity-50' 
                : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm active:cursor-grabbing'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <GripVertical 
                className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {title}
                    </p>
                  </div>
                </div>
                
                {submission.eventTitle && (
                  <p className="text-xs text-slate-500 truncate mb-1">
                    {submission.eventTitle}
                  </p>
                )}
                
                {description && (
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {submission.generalInfo?.name && (
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span className="truncate">{submission.generalInfo.name}</span>
                    </div>
                  )}
                  {submission.generalInfo?.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={12} />
                      <span className="truncate">{submission.generalInfo.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                    Approved
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionsPrograms;
