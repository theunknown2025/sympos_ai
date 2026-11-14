import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, Loader2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getApplicationsForOrganizerOpportunities,
  getSubmissionsForApplication,
  advanceOpportunityApplication,
  rejectOpportunityApplication,
  hasSubmissionForStep,
} from '../../../services/opportunityApplicationService';
import {
  buildOpportunityApplicationTimeline,
  type OpportunityPipelineStepStatusUi,
} from '../../../services/opportunityPipelineService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { sortedOpportunitySteps } from '../../../services/opportunityService';
import { groupApplicationsByProcessStep } from '../../../utils/groupOpportunityApplicationsByStep';
import type { FormSubmission, Opportunity, OpportunityApplication } from '../../../types';
import OpportunityApplicationProgressBar from './OpportunityApplicationProgressBar';
import OpportunityApplicationPickerCard from './OpportunityApplicationPickerCard';
import OpportunityApplicationsStepTimeline from './OpportunityApplicationsStepTimeline';
import {
  OpportunityApplicationsAccordion,
  OpportunityApplicationReportView,
} from './Report';

const OpportunityApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<
    { opportunity: Opportunity; applications: OpportunityApplication[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [subsByApp, setSubsByApp] = useState<Map<string, FormSubmission[]>>(new Map());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const groupsWithApplications = useMemo(
    () => groups.filter((g) => g.applications.length > 0),
    [groups]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.opportunity.id === selectedOpportunityId) ?? null,
    [groups, selectedOpportunityId]
  );

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getApplicationsForOrganizerOpportunities(currentUser.id);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser]);

  const loadSubs = async (appId: string) => {
    const subs = await getSubmissionsForApplication(appId);
    setSubsByApp((prev) => new Map(prev).set(appId, subs));
  };

  const selectOpportunity = (opportunityId: string) => {
    const group = groups.find((g) => g.opportunity.id === opportunityId);
    if (!group) return;
    const stepGroups = groupApplicationsByProcessStep(group.opportunity, group.applications);
    const firstWithApps = stepGroups.find((sg) => sg.applications.length > 0);
    setSelectedOpportunityId(opportunityId);
    setSelectedStepKey(firstWithApps?.key ?? stepGroups[0]?.key ?? null);
    setExpandedApp(null);
  };

  const backToPicker = () => {
    setSelectedOpportunityId(null);
    setSelectedStepKey(null);
    setExpandedApp(null);
  };

  const toggleApp = async (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
      return;
    }
    setExpandedApp(appId);
    if (!subsByApp.has(appId)) await loadSubs(appId);
  };

  const handleAdvance = async (opp: Opportunity, app: OpportunityApplication) => {
    if (!currentUser) return;
    setBusyId(app.id);
    try {
      await advanceOpportunityApplication(app.id, currentUser.id, opp);
      await load();
      await loadSubs(app.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to advance');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (app: OpportunityApplication) => {
    if (!currentUser) return;
    setBusyId(app.id);
    try {
      await rejectOpportunityApplication(app.id, currentUser.id, rejectComment || undefined);
      setRejectComment('');
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setBusyId(null);
    }
  };

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
          Applications
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {selectedGroup
            ? 'Review candidates by process step'
            : 'Select an opportunity to review applications'}
        </p>
      </header>

      {groupsWithApplications.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No applications received yet</p>
      ) : !selectedGroup ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupsWithApplications.map(({ opportunity, applications }) => (
            <OpportunityApplicationPickerCard
              key={opportunity.id}
              opportunity={opportunity}
              applicationCount={applications.length}
              onSelect={() => selectOpportunity(opportunity.id)}
            />
          ))}
        </div>
      ) : (
        <OpportunityApplicationsDetail
          key={selectedGroup.opportunity.id}
          opportunity={selectedGroup.opportunity}
          applications={selectedGroup.applications}
          selectedStepKey={selectedStepKey}
          onSelectStepKey={setSelectedStepKey}
          onBack={backToPicker}
          expandedApp={expandedApp}
          onClearExpandedApp={() => setExpandedApp(null)}
          onToggleApp={toggleApp}
          subsByApp={subsByApp}
          busyId={busyId}
          rejectComment={rejectComment}
          onRejectCommentChange={setRejectComment}
          onAdvance={handleAdvance}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

function OpportunityApplicationsDetail({
  opportunity,
  applications,
  selectedStepKey,
  onSelectStepKey,
  onBack,
  expandedApp,
  onClearExpandedApp,
  onToggleApp,
  subsByApp,
  busyId,
  rejectComment,
  onRejectCommentChange,
  onAdvance,
  onReject,
}: {
  opportunity: Opportunity;
  applications: OpportunityApplication[];
  selectedStepKey: string | null;
  onSelectStepKey: (key: string) => void;
  onBack: () => void;
  expandedApp: string | null;
  onClearExpandedApp: () => void;
  onToggleApp: (appId: string) => void;
  subsByApp: Map<string, FormSubmission[]>;
  busyId: string | null;
  rejectComment: string;
  onRejectCommentChange: (v: string) => void;
  onAdvance: (opp: Opportunity, app: OpportunityApplication) => void;
  onReject: (app: OpportunityApplication) => void;
}) {
  const stepGroups = useMemo(
    () => groupApplicationsByProcessStep(opportunity, applications),
    [opportunity, applications]
  );

  const timelineItems = useMemo(
    () =>
      stepGroups.map((g) => ({
        key: g.key,
        stepIndex: g.stepIndex,
        title: g.title,
        count: g.applications.length,
        step: g.step,
      })),
    [stepGroups]
  );

  const activeKey = selectedStepKey ?? timelineItems[0]?.key ?? null;
  const activeGroup = stepGroups.find((g) => g.key === activeKey) ?? stepGroups[0];

  const [accordionExpanded, setAccordionExpanded] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!activeKey && timelineItems[0]) {
      onSelectStepKey(timelineItems[0].key);
    }
  }, [activeKey, timelineItems, onSelectStepKey]);

  const handleShowReport = () => {
    setShowReport(true);
    setAccordionExpanded(false);
    onClearExpandedApp();
  };

  const handleHideReport = () => {
    setShowReport(false);
    setAccordionExpanded(true);
  };

  const subtitle = `${applications.length} application${applications.length !== 1 ? 's' : ''} total`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={18} />
          All opportunities
        </button>
      </div>

      <OpportunityApplicationsAccordion
        title={opportunity.title}
        subtitle={subtitle}
        expanded={accordionExpanded}
        onToggleExpanded={() => {
          if (showReport) return;
          setAccordionExpanded((e) => !e);
        }}
        showReport={showReport}
        onShowReport={handleShowReport}
        onHideReport={handleHideReport}
      >
        <div className="px-4 py-5 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <OpportunityApplicationsStepTimeline
            items={timelineItems}
            selectedKey={activeKey ?? ''}
            onSelectStep={(key) => {
              onSelectStepKey(key);
              onClearExpandedApp();
            }}
            sectionTitle={opportunity.stepsSectionTitle}
          />
        </div>

        <div className="p-4 space-y-3">
          {activeGroup ? (
            <>
              <p className="text-sm font-medium text-slate-700">
                {activeGroup.stepIndex != null
                  ? `Step ${activeGroup.stepIndex + 1} · ${activeGroup.title}`
                  : activeGroup.title}
                <span className="text-slate-500 font-normal ml-2">
                  ({activeGroup.applications.length} application
                  {activeGroup.applications.length !== 1 ? 's' : ''})
                </span>
              </p>
              {activeGroup.applications.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-6 text-center">
                  No applications at this step
                </p>
              ) : (
                activeGroup.applications.map((app) => (
                  <ApplicationAccordion
                    key={app.id}
                    opportunity={opportunity}
                    application={app}
                    contextStepIndex={activeGroup.stepIndex}
                    expanded={expandedApp === app.id}
                    onToggle={() => onToggleApp(app.id)}
                    submissions={subsByApp.get(app.id) || []}
                    busy={busyId === app.id}
                    rejectComment={rejectComment}
                    onRejectCommentChange={onRejectCommentChange}
                    onAdvance={() => onAdvance(opportunity, app)}
                    onReject={() => onReject(app)}
                  />
                ))
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a step on the timeline</p>
          )}
        </div>
      </OpportunityApplicationsAccordion>

      {showReport ? (
        <OpportunityApplicationReportView opportunity={opportunity} applications={applications} />
      ) : null}
    </div>
  );
}

function defaultViewStepIndex(
  contextStepIndex: number | null,
  application: OpportunityApplication,
  stepCount: number
): number {
  if (contextStepIndex != null) return contextStepIndex;
  if (application.status === 'completed' && stepCount > 0) return stepCount - 1;
  if (application.status === 'rejected') {
    return application.rejectedAtStepIndex ?? application.currentStepIndex;
  }
  return application.currentStepIndex;
}

function stepButtonClass(
  status: OpportunityPipelineStepStatusUi,
  selected: boolean
): string {
  const base =
    'flex-1 min-w-0 px-2 py-2.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors text-center';
  const selectedRing = selected ? ' ring-2 ring-indigo-500 ring-offset-1' : '';
  switch (status) {
    case 'done':
      return `${base} bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100${selectedRing}`;
    case 'rejected':
      return `${base} bg-red-50 border-red-300 text-red-900 hover:bg-red-100${selectedRing}`;
    case 'in_progress':
      return `${base} bg-indigo-50 border-indigo-400 text-indigo-900 hover:bg-indigo-100${selectedRing}`;
    case 'waiting_review':
      return `${base} bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100${selectedRing}`;
    default:
      return `${base} bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100${selectedRing}`;
  }
}

function ApplicationAccordion({
  opportunity,
  application,
  contextStepIndex,
  expanded,
  onToggle,
  submissions,
  busy,
  rejectComment,
  onRejectCommentChange,
  onAdvance,
  onReject,
}: {
  opportunity: Opportunity;
  application: OpportunityApplication;
  contextStepIndex: number | null;
  expanded: boolean;
  onToggle: () => void;
  submissions: FormSubmission[];
  busy: boolean;
  rejectComment: string;
  onRejectCommentChange: (v: string) => void;
  onAdvance: () => void;
  onReject: () => void;
}) {
  const processSteps = sortedOpportunitySteps(opportunity);
  const timeline = buildOpportunityApplicationTimeline(opportunity, application, submissions);
  const lockedStepIndex = useMemo(
    () => defaultViewStepIndex(contextStepIndex, application, processSteps.length),
    [
      contextStepIndex,
      application.currentStepIndex,
      application.status,
      application.rejectedAtStepIndex,
      processSteps.length,
    ]
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState(lockedStepIndex);
  const [showPreviousSteps, setShowPreviousSteps] = useState(false);
  const [stepMenuOpen, setStepMenuOpen] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setShowPreviousSteps(false);
      setStepMenuOpen(false);
      return;
    }
    setSelectedStepIndex(lockedStepIndex);
  }, [expanded, lockedStepIndex, application.id]);

  const viewStepIndex = showPreviousSteps ? selectedStepIndex : lockedStepIndex;

  const firstSub = submissions.find((s) => s.opportunityStepIndex === 0) || submissions[0];
  const name =
    firstSub?.generalInfo?.name ||
    firstSub?.submittedBy ||
    `Participant ${application.participantUserId.slice(0, 8)}`;
  const email = firstSub?.generalInfo?.email || '';

  const submissionsForSelectedStep = submissions.filter(
    (s) => (s.opportunityStepIndex ?? 0) === viewStepIndex
  );
  const selectedStepName =
    processSteps[viewStepIndex]?.name?.trim() || `Step ${viewStepIndex + 1}`;

  const [canAdvance, setCanAdvance] = useState(false);
  useEffect(() => {
    if (application.status !== 'in_progress') {
      setCanAdvance(false);
      return;
    }
    hasSubmissionForStep(application.id, application.currentStepIndex).then(setCanAdvance);
  }, [application, submissions]);

  const statusBadge =
    application.status === 'rejected'
      ? 'bg-red-100 text-red-800'
      : application.status === 'completed'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-amber-100 text-amber-900';

  const showActionsAtCurrentStep =
    application.status === 'in_progress' &&
    viewStepIndex === application.currentStepIndex;

  const togglePreviousSteps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !showPreviousSteps;
    setShowPreviousSteps(next);
    setStepMenuOpen(false);
    if (next) {
      setSelectedStepIndex(lockedStepIndex);
      if (!expanded) onToggle();
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg">
      <div className="flex items-center gap-1 p-3 hover:bg-slate-50">
        <button type="button" className="flex-1 min-w-0 text-left text-sm" onClick={onToggle}>
          <span className="font-medium text-slate-900">{name}</span>
          {email && <span className="text-slate-500 ml-2 truncate">{email}</span>}
        </button>
        {timeline.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
              aria-label="Step options"
              aria-expanded={stepMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setStepMenuOpen((open) => !open);
              }}
            >
              <MoreVertical size={18} />
            </button>
            {stepMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setStepMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[11rem] py-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={togglePreviousSteps}
                  >
                    {showPreviousSteps ? 'Hide previous answers' : 'See previous answers'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <span
          className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge}`}
        >
          {application.status.replace('_', ' ')}
        </span>
      </div>
      {expanded && (
        <div className="p-4 border-t border-slate-100 space-y-4">
          {showPreviousSteps && timeline.length > 0 && (
            <div className="space-y-3">
              <OpportunityApplicationProgressBar steps={timeline} />
              <div className="flex w-full gap-2">
                {timeline.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    title={step.detail}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStepIndex(index);
                    }}
                    className={stepButtonClass(step.status, selectedStepIndex === index)}
                  >
                    <span className="block truncate">
                      {index + 1}. {step.title || `Step ${index + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Answers · Step {viewStepIndex + 1} — {selectedStepName}
              {contextStepIndex === viewStepIndex ? (
                <span className="ml-1 font-normal text-indigo-600">(current step)</span>
              ) : null}
            </p>
            <SubmissionAnswersList
              submissions={submissionsForSelectedStep}
              emptyMessage="No submission for this step yet."
            />
          </div>
          {showActionsAtCurrentStep && (
            <div className="flex flex-wrap gap-3 items-end pt-2 border-t">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-slate-500">Rejection comment (optional)</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
                  value={rejectComment}
                  onChange={(e) => onRejectCommentChange(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy || !canAdvance}
                onClick={onAdvance}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Move to next step
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionAnswersList({
  submissions,
  emptyMessage = 'No form submissions yet for this application.',
}: {
  submissions: FormSubmission[];
  emptyMessage?: string;
}) {
  const [forms, setForms] = useState<Map<string, Awaited<ReturnType<typeof getRegistrationForm>>>>(new Map());

  useEffect(() => {
    (async () => {
      const m = new Map();
      for (const sub of submissions) {
        if (!m.has(sub.formId)) {
          const f = await getRegistrationForm(sub.formId);
          m.set(sub.formId, f);
        }
      }
      setForms(m);
    })();
  }, [submissions]);

  if (!submissions.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <div key={sub.id} className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Step {(sub.opportunityStepIndex ?? 0) + 1} · {forms.get(sub.formId)?.title || 'Form'}
          </p>
          <ul className="text-sm space-y-1">
            {Object.entries(sub.answers || {}).map(([fieldId, value]) => {
              const form = forms.get(sub.formId);
              const field = form?.fields.find((f) => f.id === fieldId);
              const label = field?.label || fieldId;
              const display =
                value == null
                  ? '—'
                  : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value);
              return (
                <li key={fieldId}>
                  <span className="font-medium text-slate-700">{label}:</span>{' '}
                  <span className="text-slate-600">{display}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default OpportunityApplications;
