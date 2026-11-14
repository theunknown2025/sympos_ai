import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, ChevronDown, MapPin, Send, X } from 'lucide-react';
import { Event, FormSubmission } from '../../../types';
import {
  filterSubmissionsForEvent,
  getParticipantAbstractSubmission,
  getParticipantArticleSubmission,
  getSubmitPaperButtonLabel,
  isParticipantPipelineComplete,
  tryLaunchParticipantSubmissionForm,
  type ParticipantSubmissionFormLaunchContext,
  type ParticipantPipelineStepClickAction,
  type PipelineStepId,
} from '../../../services/submissionPipelineService';
import {
  buildArticleLifecycleMicroSteps,
  eventUsesArticleReviewPipeline,
  requiresFullArticlePostAcceptPath,
} from '../../../services/participantArticleEvaluationService';
import { getRoundsForSubmission } from '../../../services/submissionModificationService';
import { useParticipantSubmissionTimeline } from '../../../hooks/useParticipantSubmissionTimeline';
import SubmissionPipelineProgressBar from '../Events/SubmissionPipelineProgressBar';
import ParticipantPipelineStatusLegend from '../Events/ParticipantPipelineStatusLegend';
import ParticipantPublishedProgramPanel from '../Program/ParticipantPublishedProgramPanel';
import ArticleEvaluationMicroSteps from './ArticleEvaluationMicroSteps';
import ParticipantPipelineStepPreview from './ParticipantPipelineStepPreview';
import ParticipantSubmissionBadgePanel from './ParticipantSubmissionBadgePanel';
import SubmissionModificationsModal from './SubmissionModificationsModal';
import type { SubmissionModificationRound } from '../../../types';

interface ParticipantSubmissionsEventSectionProps {
  event: Event;
  /** All of the participant’s submission-form rows (used to pair abstract + article). */
  allUserSubmissionRows: FormSubmission[];
  onOpenSubmitModal: (payload: {
    event: Event;
    formId: string;
    pipelineContext: ParticipantSubmissionFormLaunchContext | null;
  }) => void;
  isCampusBlocked: () => Promise<boolean>;
}

type AccordionInsight =
  | null
  | {
      variant: 'feedback' | 'status';
      stepLabel?: string;
      decisionLabel?: string;
      body: string;
      canResubmit?: boolean;
    }
  | {
      variant: 'info';
      stepLabel?: string;
      title: string;
      body: string;
    };

const ParticipantSubmissionsEventSection: React.FC<ParticipantSubmissionsEventSectionProps> = ({
  event,
  allUserSubmissionRows,
  onOpenSubmitModal,
  isCampusBlocked,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [insight, setInsight] = useState<AccordionInsight>(null);
  const [selectedStepId, setSelectedStepId] = useState<PipelineStepId | null>(null);
  const [modificationRounds, setModificationRounds] = useState<SubmissionModificationRound[]>([]);
  const [modificationsModalOpen, setModificationsModalOpen] = useState(false);

  const subsForEvent = useMemo(
    () => filterSubmissionsForEvent(allUserSubmissionRows, event),
    [allUserSubmissionRows, event]
  );

  const { steps, publishedProgram, programLoading } = useParticipantSubmissionTimeline(
    event,
    subsForEvent,
    expanded
  );
  const launch = useMemo(() => tryLaunchParticipantSubmissionForm(event, subsForEvent), [event, subsForEvent]);

  const abstractSub = useMemo(
    () => getParticipantAbstractSubmission(event, subsForEvent),
    [event, subsForEvent]
  );
  const articleSub = useMemo(
    () => getParticipantArticleSubmission(event, subsForEvent, abstractSub?.submissionPipelineGroupId),
    [event, subsForEvent, abstractSub?.submissionPipelineGroupId]
  );

  useEffect(() => {
    if (!articleSub?.id) {
      setModificationRounds([]);
      return;
    }
    let cancelled = false;
    getRoundsForSubmission(articleSub.id)
      .then((rounds) => {
        if (!cancelled) setModificationRounds(rounds);
      })
      .catch(() => {
        if (!cancelled) setModificationRounds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [articleSub?.id]);

  const articleLifecycleSteps = useMemo(() => {
    if (!event.submissionFormIds?.length) return null;
    return buildArticleLifecycleMicroSteps(
      event,
      articleSub,
      abstractSub?.decisionStatus === 'accepted',
      modificationRounds
    );
  }, [event, articleSub, abstractSub?.decisionStatus, modificationRounds]);

  const toggleExpanded = () => {
    setExpanded((v) => {
      if (v) {
        setInsight(null);
        setSelectedStepId(null);
      }
      return !v;
    });
  };

  const selectedStep = useMemo(
    () => (selectedStepId ? steps.find((s) => s.id === selectedStepId) : undefined),
    [steps, selectedStepId]
  );

  const tryOpenFromLaunch = async () => {
    if (await isCampusBlocked()) {
      alert('Your subscription is blocked for this campus. You cannot submit papers for this event.');
      return;
    }
    const r = tryLaunchParticipantSubmissionForm(event, subsForEvent);
    if (r.outcome === 'misconfigured') {
      alert(r.message);
      return;
    }
    if (r.outcome === 'complete') {
      alert('All required submission steps are already complete for this event.');
      return;
    }
    if (r.outcome === 'wait') {
      alert(r.message);
      return;
    }
    setInsight(null);
    onOpenSubmitModal({
      event,
      formId: r.formId,
      pipelineContext: r.pipelineContext,
    });
  };

  const openFormFromLaunch = async () => {
    if (await isCampusBlocked()) {
      alert('Your subscription is blocked for this campus. You cannot submit papers for this event.');
      return;
    }
    const r = tryLaunchParticipantSubmissionForm(event, subsForEvent);
    if (r.outcome !== 'open') {
      alert(r.outcome === 'wait' ? r.message : 'The form cannot be opened right now.');
      return;
    }
    setInsight(null);
    onOpenSubmitModal({
      event,
      formId: r.formId,
      pipelineContext: r.pipelineContext,
    });
  };

  const handleStepClick = async (stepId: PipelineStepId, action: ParticipantPipelineStepClickAction) => {
    setSelectedStepId(stepId);
    if (stepId === 'program') {
      setInsight(null);
    }

    if (action.type === 'none') return;

    const stepLabel = steps.find((s) => s.id === stepId)?.title;

    if (action.type === 'open_form') {
      setInsight(null);
      await openFormFromLaunch();
      return;
    }

    if (action.type === 'under_review') {
      setInsight({
        variant: 'status',
        stepLabel,
        body: action.message,
      });
      return;
    }

    if (action.type === 'feedback') {
      setInsight({
        variant: 'feedback',
        stepLabel,
        decisionLabel: action.decisionLabel,
        body: action.comment,
        canResubmit: action.canResubmit,
      });
      return;
    }

    if (action.type === 'info') {
      if (stepId === 'program') return;
      setInsight({
        variant: 'info',
        stepLabel,
        title: action.title,
        body: action.body,
      });
    }
  };

  const pipelineComplete = isParticipantPipelineComplete(event, subsForEvent);
  const continueLabel = getSubmitPaperButtonLabel(event, subsForEvent);

  const dateSummary =
    event.dates && event.dates.length > 0
      ? new Date(event.dates[0].startDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={toggleExpanded}
        className="w-full flex items-start gap-3 text-left px-4 py-4 sm:px-5 sm:py-4 hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{event.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {dateSummary ? <span>{dateSummary}</span> : null}
            {event.location ? (
              <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            ) : null}
            {pipelineComplete ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 size={12} />
                Complete
              </span>
            ) : null}
          </div>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-slate-400 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="border-t border-slate-200 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 space-y-4">
          <SubmissionPipelineProgressBar
            steps={steps}
            event={event}
            subs={subsForEvent}
            launch={launch}
            selectedStepId={selectedStepId}
            onStepClick={(id, action) => void handleStepClick(id, action)}
          />

          <ParticipantPipelineStatusLegend />

          {selectedStepId === 'program' ? null : selectedStep ? (
            <ParticipantPipelineStepPreview event={event} subs={subsForEvent} step={selectedStep} />
          ) : (
            <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
              Select a step above to preview what you submitted in the form.
            </p>
          )}

          {selectedStepId === 'article' && articleLifecycleSteps ? (
            <ArticleEvaluationMicroSteps
              steps={articleLifecycleSteps}
              strictArticlePipeline={requiresFullArticlePostAcceptPath(event)}
              committeeEvaluationForms={eventUsesArticleReviewPipeline(event)}
              modificationRounds={modificationRounds}
              onOpenModificationsModal={
                articleSub ? () => setModificationsModalOpen(true) : undefined
              }
            />
          ) : null}

          {selectedStepId === 'program' ? (
            <>
              <ParticipantPublishedProgramPanel
                event={event}
                subsForEvent={subsForEvent}
                publishedProgram={publishedProgram}
                programLoading={programLoading}
              />
              <ParticipantSubmissionBadgePanel
                event={event}
                subsForEvent={subsForEvent}
                publishedProgram={publishedProgram}
                programLoading={programLoading}
              />
            </>
          ) : null}

          {insight && selectedStepId !== 'program' ? (
            <div className="relative rounded-lg border border-slate-200 bg-slate-50/95 p-4 pr-10 shadow-sm">
              <button
                type="button"
                className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200"
                aria-label="Dismiss"
                onClick={() => setInsight(null)}
              >
                <X size={18} />
              </button>
              {insight.stepLabel ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{insight.stepLabel}</p>
              ) : null}
              {insight.variant === 'feedback' ? (
                <>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Organizer feedback</h3>
                  {insight.decisionLabel ? (
                    <p className="text-xs text-slate-600 mb-1">
                      <span className="font-medium text-slate-800">Decision:</span> {insight.decisionLabel}
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{insight.body}</p>
                  {insight.canResubmit ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        onClick={() => void openFormFromLaunch()}
                      >
                        Edit and resubmit
                      </button>
                    </div>
                  ) : null}
                </>
              ) : insight.variant === 'status' ? (
                <>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Status</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{insight.body}</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{insight.title}</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{insight.body}</p>
                </>
              )}
            </div>
          ) : null}

          {launch.outcome === 'open' ? (
            <button
              type="button"
              onClick={() => void tryOpenFromLaunch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Send size={16} />
              {continueLabel === 'Submitted' ? 'Open form' : continueLabel}
            </button>
          ) : pipelineComplete ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={18} />
              All required steps are complete
            </span>
          ) : launch.outcome === 'wait' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {launch.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {modificationsModalOpen && articleSub ? (
        <SubmissionModificationsModal
          submission={articleSub}
          onClose={() => setModificationsModalOpen(false)}
          onSuccess={() => {
            getRoundsForSubmission(articleSub.id).then(setModificationRounds).catch(() => {});
          }}
        />
      ) : null}
    </section>
  );
};

export default ParticipantSubmissionsEventSection;
