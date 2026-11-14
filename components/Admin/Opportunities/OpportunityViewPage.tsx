import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Briefcase,
  File,
  ExternalLink,
  Loader2,
  ListChecks,
  FileText,
  Paperclip,
  X,
  LogIn,
  UserPlus,
  Send,
} from 'lucide-react';
import type { Opportunity } from '../../../types';
import {
  getPublishedOpportunityNeighborsByKind,
  isOpportunityDeadlinePassed,
  type OpportunityNeighborLink,
} from '../../../services/opportunityService';
import PublicOpportunitiesLayout from '../../Public/Opportunities/PublicOpportunitiesLayout';
import PublicOpportunityBreadcrumbs from '../../Public/Opportunities/PublicOpportunityBreadcrumbs';
import { PUBLIC_OPPORTUNITIES_BROWSE_PATH } from '../../Public/Opportunities/PublicOpportunitiesHeader';
import OpportunityCategoryNavigation from '../../Public/Opportunities/OpportunityCategoryNavigation';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';
import RichTextHtmlContent from './RichTextHtmlContent';
import OpportunityProcessTimeline from './OpportunityProcessTimeline';
import OpportunityBannerDisplay from './OpportunityBannerDisplay';
import FormModal from '../Tools/FormBuilder/FormModal';
import { useAuth } from '../../../hooks/useAuth';
import {
  createOpportunityApplication,
  getParticipantApplicationForOpportunity,
} from '../../../services/opportunityApplicationService';
import { getFormIdForOpportunityStep } from '../../../services/opportunityService';
import type { OpportunityApplication } from '../../../types';

const locationLabel: Record<string, string> = {
  in_house: 'In house',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

export interface OpportunityViewPageProps {
  opportunity: Opportunity;
  mode: 'preview' | 'public';
  onBack?: () => void;
  backLabel?: string;
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
        <span className="text-indigo-600">{icon}</span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const OpportunityViewPage: React.FC<OpportunityViewPageProps> = ({
  opportunity,
  mode,
  onBack,
  backLabel = 'Back',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applySectionRef = useRef<HTMLElement>(null);
  const { currentUser, isLoading: authLoading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<{
    formId: string;
    applicationId: string;
    stepIndex: number;
  } | null>(null);
  const [neighbors, setNeighbors] = useState<{
    prev: OpportunityNeighborLink | null;
    next: OpportunityNeighborLink | null;
  }>({ prev: null, next: null });

  const isPublic = mode === 'public';

  const deadlinePassed = isOpportunityDeadlinePassed(opportunity);
  const isClosed = opportunity.publishStatus === 'Closed';
  const isPublished = opportunity.publishStatus === 'Published';
  const canApplyPublic =
    mode === 'public' && isPublished && !deadlinePassed && !isClosed;
  const canApplyPreview = mode === 'preview' && isPublished && !deadlinePassed && !isClosed;

  const startApplication = async () => {
    if (!currentUser) return;
    setApplying(true);
    try {
      let app: OpportunityApplication | null = await getParticipantApplicationForOpportunity(
        opportunity.id,
        currentUser.id
      );
      if (!app) {
        await createOpportunityApplication(opportunity.id, currentUser.id);
        app = await getParticipantApplicationForOpportunity(opportunity.id, currentUser.id);
      }
      if (!app) throw new Error('Could not start application');

      const formId = getFormIdForOpportunityStep(opportunity, app.currentStepIndex);
      if (!formId) {
        setNoticeOpen(
          'No application form is configured for the first step. Please contact the organizer.'
        );
        return;
      }
      setFormModal({
        formId,
        applicationId: app.id,
        stepIndex: app.currentStepIndex,
      });
    } catch (e: unknown) {
      setNoticeOpen(e instanceof Error ? e.message : 'Could not start application');
    } finally {
      setApplying(false);
    }
  };

  const handleApply = async () => {
    if (authLoading) return;

    if (mode === 'preview' && !isPublished) {
      setNoticeOpen('Publish this opportunity publicly before applicants can apply.');
      return;
    }

    if (deadlinePassed) {
      setNoticeOpen('The application deadline for this opportunity has passed.');
      return;
    }

    if (isClosed) {
      setNoticeOpen('This opportunity is closed and no longer accepts applications.');
      return;
    }

    if (!currentUser) {
      setAuthRequiredOpen(true);
      return;
    }

    if (mode === 'preview') {
      if (!canApplyPreview) return;
      await startApplication();
      return;
    }

    if (!canApplyPublic) return;
    await startApplication();
  };

  const applyDisabled =
    authLoading ||
    applying ||
    deadlinePassed ||
    isClosed ||
    (mode === 'public' && !isPublished) ||
    (mode === 'preview' && !isPublished);

  const applyLabel = applying
    ? 'Loading…'
    : deadlinePassed
      ? 'Deadline passed'
      : isClosed
        ? 'Closed'
        : !isPublished
          ? 'Not yet published'
          : 'Apply now';

  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

  useEffect(() => {
    if (searchParams.get('apply') === '1' && applySectionRef.current) {
      applySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isPublic || !opportunity.id) return;
    (async () => {
      try {
        const links = await getPublishedOpportunityNeighborsByKind(
          opportunity.id,
          opportunity.kind
        );
        setNeighbors(links);
      } catch {
        setNeighbors({ prev: null, next: null });
      }
    })();
  }, [isPublic, opportunity.id, opportunity.kind]);

  const pageBody = (
    <div
      className={`mx-auto py-6 sm:py-8 space-y-6 ${
        isPublic
          ? 'max-w-7xl px-4 sm:px-6 lg:px-8'
          : 'max-w-3xl px-4 sm:px-6'
      }`}
    >
        {isPublic ? (
          <PublicOpportunityBreadcrumbs
            items={[
              { label: 'Opportunities', href: PUBLIC_OPPORTUNITIES_BROWSE_PATH },
              { label: opportunity.title },
            ]}
          />
        ) : (
          <header className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft size={18} />
              {backLabel}
            </button>
            {mode === 'preview' && (
              <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                Organizer preview
              </span>
            )}
          </header>
        )}

        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <OpportunityBannerDisplay opportunity={opportunity} />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-1.5 text-sm font-medium">
            <Briefcase size={15} />
            {opportunityKindLabel[opportunity.kind]}
          </span>
          {opportunity.place && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
              <MapPin size={15} className="text-slate-400" />
              {opportunity.place}
            </span>
          )}
          {opportunity.deadline && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
              <Calendar size={15} className="text-slate-400" />
              Apply by{' '}
              {new Date(opportunity.deadline).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
            {locationLabel[opportunity.locationType] || opportunity.locationType}
          </span>
        </div>

        <SectionCard title="Description" icon={<FileText size={18} />}>
          {opportunity.description?.trim() ? (
            <RichTextHtmlContent html={opportunity.description} />
          ) : (
            <p className="text-sm text-slate-400 italic">No description provided.</p>
          )}
        </SectionCard>

        {opportunity.complementaryCriteria?.filter((c) => c.name.trim() || c.value.trim())
          .length > 0 && (
          <SectionCard title="Criteria" icon={<ListChecks size={18} />}>
            <ul className="space-y-3">
              {opportunity.complementaryCriteria.map((c, i) =>
                c.name.trim() || c.value.trim() ? (
                  <li
                    key={i}
                    className="text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0"
                  >
                    <span className="font-semibold text-slate-900 block">{c.name || '—'}</span>
                    <span className="text-slate-600 mt-0.5 block">{c.value || '—'}</span>
                  </li>
                ) : null
              )}
            </ul>
          </SectionCard>
        )}

        {opportunity.attachedFiles?.length > 0 && (
          <SectionCard title="Attachments" icon={<Paperclip size={18} />}>
            <ul className="space-y-2">
              {opportunity.attachedFiles.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    <File size={16} className="shrink-0" />
                    {f.fileName}
                    <ExternalLink size={14} className="opacity-60 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <OpportunityProcessTimeline
            steps={opportunity.steps ?? []}
            sectionTitle={opportunity.stepsSectionTitle}
            hideWhenEmpty={false}
          />
        </div>

        <section
          ref={applySectionRef}
          className="rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden"
          aria-label="Apply for this opportunity"
        >
          <div className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
                Application
              </p>
              <h3 className="text-lg font-bold text-slate-900">{opportunity.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {deadlinePassed
                  ? 'Submissions are closed — deadline has passed.'
                  : isClosed
                    ? 'This opportunity is no longer open.'
                    : !isPublished
                      ? 'This opportunity is not published yet.'
                      : 'Ready to apply? Start with the first step of the process.'}
              </p>
            </div>
            <button
              type="button"
              disabled={applyDisabled}
              onClick={handleApply}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
              {applyLabel}
            </button>
          </div>
        </section>

        {isPublic && (
          <OpportunityCategoryNavigation
            kind={opportunity.kind}
            prev={neighbors.prev}
            next={neighbors.next}
          />
        )}
      </div>
  );

  return (
    <>
      {isPublic ? (
        <PublicOpportunitiesLayout>{pageBody}</PublicOpportunitiesLayout>
      ) : (
        <div className="min-h-screen bg-slate-50">{pageBody}</div>
      )}

      {/* Account required */}
      {authRequiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            role="dialog"
            aria-labelledby="auth-required-title"
          >
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <UserPlus size={22} />
                </span>
                <h2 id="auth-required-title" className="text-lg font-bold text-slate-900">
                  Symposai account required
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAuthRequiredOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-sm text-slate-600 leading-relaxed">
                To apply for this opportunity, you must have an account inside{' '}
                <span className="font-semibold text-slate-900">Symposai</span>. Sign in to an
                existing account or create a new one, then return to this page to complete your
                application.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=${returnTo}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
                >
                  <LogIn size={18} />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/register?redirect=${returnTo}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-indigo-600 text-indigo-700 font-semibold text-sm hover:bg-indigo-50"
                >
                  <UserPlus size={18} />
                  Create account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General notice */}
      {noticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
            <p className="text-sm text-slate-700 leading-relaxed">{noticeOpen}</p>
            <button
              type="button"
              onClick={() => setNoticeOpen(null)}
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-medium text-sm hover:bg-slate-200"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {formModal && (
        <FormModal
          formId={formModal.formId}
          eventId={opportunity.id}
          eventTitle={opportunity.title}
          opportunityContext={{
            opportunityId: opportunity.id,
            opportunityApplicationId: formModal.applicationId,
            opportunityStepIndex: formModal.stepIndex,
          }}
          onClose={() => setFormModal(null)}
          onSuccess={() => setFormModal(null)}
        />
      )}
    </>
  );
};

export default OpportunityViewPage;
