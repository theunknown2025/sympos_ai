import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Event, FormSubmission, RegistrationForm } from '../../../types';
import type { PipelineStepId, PipelineStepUi } from '../../../services/submissionPipelineService';
import {
  getParticipantAbstractSubmission,
  getParticipantArticleSubmission,
  getParticipantPaymentSubmission,
  workflowNeedsAbstract,
  eventSubmissionPreset,
} from '../../../services/submissionPipelineService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { SubmissionFormAnswersPreview } from './submissionFormFieldPreview';

interface ParticipantPipelineStepPreviewProps {
  event: Event;
  subs: FormSubmission[];
  step: PipelineStepUi;
}

function submissionForStep(
  event: Event,
  subs: FormSubmission[],
  stepId: PipelineStepId
): FormSubmission | undefined {
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );
  switch (stepId) {
    case 'abstract':
      return abstractSub;
    case 'article':
      return articleSub;
    case 'payment':
      return getParticipantPaymentSubmission(event, subs, articleSub?.submissionPipelineGroupId);
    default:
      return undefined;
  }
}

const ParticipantPipelineStepPreview: React.FC<ParticipantPipelineStepPreviewProps> = ({
  event,
  subs,
  step,
}) => {
  const submission = submissionForStep(event, subs, step.id);
  const preset = eventSubmissionPreset(event);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<RegistrationForm | null>(null);

  useEffect(() => {
    if (step.id === 'program' || !submission) {
      setForm(null);
      setLoadError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getRegistrationForm(submission.formId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setForm(null);
          setLoadError('Form could not be loaded.');
          return;
        }
        setForm(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load your submission preview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step.id, submission?.id, submission?.formId]);

  if (step.id === 'program') {
    return null;
  }

  if (step.id === 'abstract' && !workflowNeedsAbstract(preset)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        This event does not use a separate abstract step.
      </div>
    );
  }

  if (!submission) {
    const emptyMessages: Record<string, string> = {
      abstract: 'You have not submitted an abstract for this event yet.',
      article: 'You have not submitted your article for this event yet.',
      payment: 'You have not submitted the payment form yet.',
    };
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title} — preview</h3>
        <p className="text-sm text-slate-600">{emptyMessages[step.id] ?? 'No submission for this step yet.'}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        Loading your answers…
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {loadError || 'Form could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 max-h-[min(420px,50vh)] overflow-y-auto">
      <div className="mb-3 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{step.title} — your submission</h3>
        <p className="text-xs text-slate-500 mt-0.5">{form.title}</p>
      </div>
      <SubmissionFormAnswersPreview form={form} submission={submission} />
    </div>
  );
};

export default ParticipantPipelineStepPreview;
