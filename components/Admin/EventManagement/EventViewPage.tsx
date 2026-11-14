import React, { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  LogIn,
  MapPin,
  Send,
  UserPlus,
  X,
} from 'lucide-react';
import type { Event, EventBanner, FormSubmission } from '../../../types';
import {
  isEventRegistrationDeadlinePassed,
  isEventSubmissionDeadlinePassed,
} from '../../../services/eventService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getRegistrationSubmissions } from '../../../services/registrationSubmissionService';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import { tryLaunchParticipantSubmissionForm } from '../../../services/submissionPipelineService';
import { useAuth } from '../../../hooks/useAuth';
import PublicEventsLayout from '../../Public/Events/PublicEventsLayout';
import PublicEventBreadcrumbs, {
  type BreadcrumbItem,
} from '../../Public/Events/PublicEventBreadcrumbs';
import { PUBLIC_EVENTS_BROWSE_PATH } from '../../Public/Events/publicEventListingUtils';
import FormModal from '../Tools/FormBuilder/FormModal';
import { eventBannerHeaderStyle } from '../../LandingPage/landingEventUtils';

export interface EventViewPageProps {
  event: Event;
  mode: 'preview' | 'public';
  onBack?: () => void;
  backLabel?: string;
  /** When set, replaces the default public breadcrumbs (Home › Events › …). */
  breadcrumbItems?: BreadcrumbItem[];
  /** Override or hide the site Home crumb when using custom breadcrumbItems. */
  breadcrumbSiteHome?: { label: string; href: string } | null;
  /** Skip PublicEventsLayout wrapper (e.g. embedded in landing page builder preview). */
  embedded?: boolean;
}

function getBannerStyle(banner?: EventBanner): CSSProperties {
  const base = eventBannerHeaderStyle(banner);
  if (banner?.type === 'image' && banner.imageUrl) {
    return { ...base, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return base;
}

const EventViewPage: React.FC<EventViewPageProps> = ({
  event,
  mode,
  onBack,
  backLabel = 'Back',
  breadcrumbItems,
  breadcrumbSiteHome,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const actionsRef = useRef<HTMLElement>(null);
  const { currentUser, isLoading: authLoading } = useAuth();
  const [mySubmissions, setMySubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<{
    formId: string;
    pipelineContext?: {
      submissionPipelineKind: import('../../../types').SubmissionPipelineKind;
      submissionPipelineGroupId: string;
      parentSubmissionId?: string | null;
    } | null;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isPublic = mode === 'public';
  const isClosed = event.publishStatus === 'Closed';
  const isPublished = event.publishStatus === 'Published';
  const regDeadlinePassed = isEventRegistrationDeadlinePassed(event);
  const subDeadlinePassed = isEventSubmissionDeadlinePassed(event);
  const hasRegistration = (event.registrationFormIds?.length ?? 0) > 0;
  const hasSubmission = (event.submissionFormIds?.length ?? 0) > 0;

  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

  useEffect(() => {
    if (!currentUser?.id || !currentUser.email) {
      setMySubmissions([]);
      return;
    }
    (async () => {
      setLoadingSubs(true);
      try {
        const profile = await getJuryMemberProfile(currentUser.id);
        const all = await getRegistrationSubmissions(
          currentUser.email,
          currentUser.id,
          profile?.email
        );
        const submissionRows: FormSubmission[] = [];
        for (const sub of all) {
          if (sub.eventId !== event.id) continue;
          try {
            const form = await getRegistrationForm(sub.formId);
            if (!form) continue;
            const titleLower = form.title.toLowerCase();
            const isSubmissionForm =
              titleLower.startsWith('sub - ') ||
              titleLower.startsWith('sub-') ||
              titleLower.includes('submission') ||
              titleLower.includes('submit');
            if (isSubmissionForm) submissionRows.push(sub);
          } catch {
            /* skip */
          }
        }
        setMySubmissions(submissionRows);
      } catch {
        setMySubmissions([]);
      } finally {
        setLoadingSubs(false);
      }
    })();
  }, [currentUser?.id, currentUser?.email, event.id]);

  useEffect(() => {
    const param = searchParams.get('register') || searchParams.get('submit');
    if (param === '1' && actionsRef.current) {
      actionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  const requireAuth = (): boolean => {
    if (authLoading) return true;
    if (!currentUser) {
      setAuthRequiredOpen(true);
      return true;
    }
    return false;
  };

  const handleRegister = async () => {
    if (mode === 'preview' && !isPublished) {
      setNoticeOpen('Publish this event publicly before participants can register.');
      return;
    }
    if (isClosed) {
      setNoticeOpen('This event is closed.');
      return;
    }
    if (regDeadlinePassed) {
      setNoticeOpen('The registration deadline has passed.');
      return;
    }
    if (!hasRegistration) {
      setNoticeOpen('No registration form is configured for this event.');
      return;
    }
    if (requireAuth()) return;

    setFormModal({ formId: event.registrationFormIds![0] });
  };

  const handleSubmitCommunication = async () => {
    if (mode === 'preview' && !isPublished) {
      setNoticeOpen('Publish this event publicly before participants can submit.');
      return;
    }
    if (isClosed) {
      setNoticeOpen('This event is closed.');
      return;
    }
    if (subDeadlinePassed) {
      setNoticeOpen('The submission deadline has passed.');
      return;
    }
    if (!hasSubmission) {
      setNoticeOpen('No submission form is configured for this event.');
      return;
    }
    if (requireAuth()) return;

    setActionLoading(true);
    try {
      const launch = tryLaunchParticipantSubmissionForm(event, mySubmissions);
      if (launch.outcome === 'misconfigured') {
        setNoticeOpen(launch.message);
        return;
      }
      if (launch.outcome === 'complete') {
        setNoticeOpen('You have already completed the submission process for this event.');
        return;
      }
      if (launch.outcome === 'wait') {
        setNoticeOpen(launch.message);
        return;
      }
      setFormModal({
        formId: launch.formId,
        pipelineContext: launch.pipelineContext,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const registerDisabled =
    authLoading ||
    isClosed ||
    regDeadlinePassed ||
    !hasRegistration ||
    (isPublic && !isPublished) ||
    (mode === 'preview' && !isPublished);

  const submitDisabled =
    authLoading ||
    actionLoading ||
    loadingSubs ||
    isClosed ||
    subDeadlinePassed ||
    !hasSubmission ||
    (isPublic && !isPublished) ||
    (mode === 'preview' && !isPublished);

  const pageBody = (
    <div
      className={`mx-auto py-6 sm:py-8 space-y-6 ${
        isPublic ? 'max-w-7xl px-4 sm:px-6 lg:px-8' : 'max-w-3xl px-4 sm:px-6'
      }`}
    >
      {breadcrumbItems && breadcrumbItems.length > 0 ? (
        <PublicEventBreadcrumbs
          items={breadcrumbItems}
          siteHome={breadcrumbSiteHome === undefined ? undefined : breadcrumbSiteHome}
        />
      ) : isPublic ? (
        <PublicEventBreadcrumbs
          items={[
            { label: 'Events', href: PUBLIC_EVENTS_BROWSE_PATH },
            { label: event.name },
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

      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm text-white min-h-[12rem] flex items-end">
        <div className="w-full p-6 sm:p-8 relative" style={getBannerStyle(event.banner)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-md">{event.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {event.eventType && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/90 text-indigo-800">
                  {event.eventType}
                </span>
              )}
              {event.eventFormat && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-black/40 text-white">
                  {event.eventFormat}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
        {event.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5">
            <MapPin size={15} className="text-slate-400" />
            {event.location}
          </span>
        )}
        {event.dates?.[0]?.startDate && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5">
            <Calendar size={15} className="text-slate-400" />
            {new Date(event.dates[0].startDate).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      {event.description?.trim() && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
            <FileText size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Description</h2>
          </div>
          <div
            className="p-5 prose prose-slate max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </section>
      )}

      <section
        ref={actionsRef}
        className="rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden"
        aria-label="Event actions"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              Participate
            </p>
            <h3 className="text-lg font-bold text-slate-900">{event.name}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {isClosed
                ? 'This event is no longer open.'
                : !isPublished
                  ? 'This event is not published yet.'
                  : 'Register for the event or submit your communication (paper / abstract).'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {hasRegistration && (
              <button
                type="button"
                disabled={registerDisabled}
                onClick={handleRegister}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={18} />
                {regDeadlinePassed ? 'Registration closed' : 'Register'}
              </button>
            )}
            {hasSubmission && (
              <button
                type="button"
                disabled={submitDisabled}
                onClick={handleSubmitCommunication}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading || loadingSubs ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {subDeadlinePassed ? 'Submissions closed' : 'Submit communication'}
              </button>
            )}
            {!hasRegistration && !hasSubmission && (
              <p className="text-sm text-slate-500">
                No registration or submission forms are linked to this event yet.
              </p>
            )}
          </div>
          {hasRegistration && (
            <p className="text-xs text-slate-500 inline-flex items-center gap-1">
              <ClipboardList size={14} />
              Event registration
            </p>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="bg-slate-50">{pageBody}</div>
      ) : isPublic ? (
        <PublicEventsLayout>{pageBody}</PublicEventsLayout>
      ) : (
        <div className="min-h-screen bg-slate-50">{pageBody}</div>
      )}

      {authRequiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">SymposAI account required</h2>
              <button
                type="button"
                onClick={() => setAuthRequiredOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Sign in or create an account to register or submit to this event, then return here
                to continue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=${returnTo}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
                >
                  <LogIn size={18} />
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/register?redirect=${returnTo}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-indigo-600 text-indigo-700 font-semibold text-sm"
                >
                  <UserPlus size={18} />
                  Create account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {noticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
            <p className="text-sm text-slate-700">{noticeOpen}</p>
            <button
              type="button"
              onClick={() => setNoticeOpen(null)}
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-slate-100 font-medium text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {formModal && (
        <FormModal
          formId={formModal.formId}
          eventId={event.id}
          eventTitle={event.name}
          pipelineContext={formModal.pipelineContext ?? null}
          onClose={() => setFormModal(null)}
          onSuccess={() => setFormModal(null)}
        />
      )}
    </>
  );
};

export default EventViewPage;
