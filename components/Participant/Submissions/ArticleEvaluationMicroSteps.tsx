import React, { useEffect, useState } from 'react';
import type {
  ArticleEvalMicroStatus,
  ArticleEvalMicroStep,
} from '../../../services/participantArticleEvaluationService';
import type { SubmissionModificationRound } from '../../../types';
import ArticleModificationsPanel from './ArticleModificationsPanel';

function barClass(status: ArticleEvalMicroStatus): string {
  switch (status) {
    case 'done':
      return 'bg-green-600 text-white';
    case 'rejected':
      return 'bg-red-500 text-white';
    case 'in_progress':
      return 'bg-blue-600 text-white';
    case 'waiting_review':
      return 'bg-amber-400 text-amber-950 border border-amber-500';
    case 'not_applicable':
      return 'bg-slate-100 text-slate-400 border border-dashed border-slate-300';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

interface ArticleEvaluationMicroStepsProps {
  steps: ArticleEvalMicroStep[];
  strictArticlePipeline?: boolean;
  committeeEvaluationForms?: boolean;
  modificationRounds?: SubmissionModificationRound[];
  onOpenModificationsModal?: () => void;
}

/**
 * Article pipeline: Received → Accepted → Dispatched → Modifications → Evaluated → Approved.
 */
const ArticleEvaluationMicroSteps: React.FC<ArticleEvaluationMicroStepsProps> = ({
  steps,
  strictArticlePipeline = true,
  committeeEvaluationForms = true,
  modificationRounds = [],
  onOpenModificationsModal,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<ArticleEvalMicroStep['id'] | null>(null);

  useEffect(() => {
    const modStep = steps.find((s) => s.id === 'modifications');
    if (modStep?.status === 'in_progress') {
      setSelectedStepId('modifications');
    }
  }, [steps]);

  if (!steps?.length) return null;

  const strict = strictArticlePipeline;
  const committee = committeeEvaluationForms;
  const modificationsStep = steps.find((s) => s.id === 'modifications');
  const showModificationsDetail =
    selectedStepId === 'modifications' ||
    modificationsStep?.status === 'in_progress' ||
    modificationsStep?.status === 'waiting_review' ||
    (modificationsStep?.status === 'done' && modificationRounds.length > 0);

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
        aria-label="Article pipeline progress"
      >
        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
          Article pipeline
        </p>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 items-stretch">
          {steps.map((step, i) => {
            const isSelected = selectedStepId === step.id;
            const isClickable = step.id === 'modifications' && step.status !== 'not_applicable';
            return (
              <div key={step.id} className="flex-1 min-w-[60px] max-w-[100px] flex items-center gap-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (!isClickable) return;
                    setSelectedStepId((prev) => (prev === step.id ? null : step.id));
                  }}
                  className={`flex-1 min-w-0 rounded-md px-1.5 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold leading-tight transition-shadow ${barClass(step.status)} ${
                    isClickable ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300' : 'cursor-default'
                  } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  title={
                    step.status === 'not_applicable'
                      ? `${step.title}: not used for this event`
                      : `${step.title}: ${step.status.replace('_', ' ')}`
                  }
                >
                  <span className="line-clamp-2">{step.title}</span>
                </button>
                {i < steps.length - 1 ? (
                  <span className="w-px h-4 shrink-0 bg-slate-300 hidden sm:block" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {strict ? (
            committee ? (
              <>
                <strong className="font-medium text-slate-700">Accepted</strong> is the organizer&apos;s
                first decision on your article; <strong className="font-medium text-slate-700">Modifications</strong>{' '}
                shows reviewer questions before <strong className="font-medium text-slate-700">Evaluated</strong>;{' '}
                <strong className="font-medium text-slate-700">Approved</strong> is the final decision. Payment (if
                any) follows final approval.
              </>
            ) : (
              <>
                <strong className="font-medium text-slate-700">Accepted</strong> is the organizer&apos;s first
                decision; <strong className="font-medium text-slate-700">Modifications</strong> may appear before
                evaluation when reviewers request changes. Payment (if any) follows final approval.
              </>
            )
          ) : (
            <>
              This event does not use committee review. Steps after{' '}
              <strong className="font-medium text-slate-700">Accepted</strong> are shown as not applicable once your
              article is accepted.
            </>
          )}
        </p>
      </div>

      {showModificationsDetail ? (
        <ArticleModificationsPanel
          rounds={modificationRounds}
          showActionButton={!!onOpenModificationsModal}
          onRespond={onOpenModificationsModal}
        />
      ) : null}
    </div>
  );
};

export default ArticleEvaluationMicroSteps;
