import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getParticipantApplications,
  getSubmissionsForApplication,
} from '../../../services/opportunityApplicationService';
import {
  getFormIdForOpportunityStep,
} from '../../../services/opportunityService';
import { participantCanSubmitCurrentStep } from '../../../services/opportunityPipelineService';
import { useParticipantOpportunityTimeline } from '../../../hooks/useParticipantOpportunityTimeline';
import type { FormSubmission, OpportunityApplication } from '../../../types';
import FormModal from '../../Admin/Tools/FormBuilder/FormModal';
import { SubmissionPipelineTimeline } from '../Events/SubmissionPipelineTimeline';

const ParticipantOpportunityApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<OpportunityApplication[]>([]);
  const [subsMap, setSubsMap] = useState<Map<string, FormSubmission[]>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState<{
    formId: string;
    opportunity: NonNullable<OpportunityApplication['opportunity']>;
    applicationId: string;
    stepIndex: number;
  } | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const apps = await getParticipantApplications(currentUser.id);
      setApplications(apps);
      const m = new Map<string, FormSubmission[]>();
      for (const a of apps) {
        m.set(a.id, await getSubmissionsForApplication(a.id));
      }
      setSubsMap(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ClipboardList size={32} className="text-indigo-600" />
          My applications
        </h1>
      </header>

      {applications.length === 0 ? (
        <p className="text-slate-500 text-center py-12">You have not applied to any opportunities yet</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const opp = app.opportunity;
            if (!opp) return null;
            const subs = subsMap.get(app.id) || [];
            const canContinue = participantCanSubmitCurrentStep(app, subs);
            return (
              <ApplicationRow
                key={app.id}
                app={app}
                opportunity={opp}
                submissions={subs}
                expanded={expanded === app.id}
                onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                canContinue={canContinue}
                onContinue={() => {
                  const formId = getFormIdForOpportunityStep(opp, app.currentStepIndex);
                  if (!formId) {
                    alert('No form for this step yet.');
                    return;
                  }
                  setFormModal({
                    formId,
                    opportunity: opp,
                    applicationId: app.id,
                    stepIndex: app.currentStepIndex,
                  });
                }}
              />
            );
          })}
        </div>
      )}

      {formModal && (
        <FormModal
          formId={formModal.formId}
          eventId={formModal.opportunity.id}
          eventTitle={formModal.opportunity.title}
          opportunityContext={{
            opportunityId: formModal.opportunity.id,
            opportunityApplicationId: formModal.applicationId,
            opportunityStepIndex: formModal.stepIndex,
          }}
          onClose={() => setFormModal(null)}
          onSuccess={() => {
            setFormModal(null);
            load();
          }}
        />
      )}
    </div>
  );
};

function ApplicationRow({
  app,
  opportunity,
  submissions,
  expanded,
  onToggle,
  canContinue,
  onContinue,
}: {
  app: OpportunityApplication;
  opportunity: NonNullable<OpportunityApplication['opportunity']>;
  submissions: FormSubmission[];
  expanded: boolean;
  onToggle: () => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const { steps } = useParticipantOpportunityTimeline(opportunity, app, submissions);
  const timelineSteps = steps.map((s) => ({
    id: s.id as 'abstract',
    title: s.title,
    status: s.status,
    detail: s.detail,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50"
        onClick={onToggle}
      >
        <span className="font-semibold text-slate-900">{opportunity.title}</span>
        <span className="flex items-center gap-2 text-sm capitalize text-slate-600">
          {app.status.replace('_', ' ')}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {expanded && (
        <div className="p-4 border-t border-slate-100 space-y-4">
          <SubmissionPipelineTimeline steps={timelineSteps} compact />
          {canContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
            >
              Continue — complete step {(app.currentStepIndex ?? 0) + 1}
            </button>
          )}
          {app.status === 'in_progress' && !canContinue && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Your submission is under review. You will be able to continue when the organizer advances you.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ParticipantOpportunityApplications;
