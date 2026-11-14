import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Award, AlertCircle } from 'lucide-react';
import type { Event, FormSubmission } from '../../../types';
import type { SavedProgram } from '../../../services/programService';
import type { ParticipantBadge } from '../../../services/badgeGeneratorService';
import { getBadgeForSubmission } from '../../../services/badgeGeneratorService';
import {
  evaluateSubmissionBadgeEligibility,
  ensureSubmissionParticipantBadge,
} from '../../../services/submissionBadgeService';
import { downloadParticipantBadge } from '../../../utils/participantBadgeDownload';
import { useParticipantSubmissionTimeline } from '../../../hooks/useParticipantSubmissionTimeline';
import {
  getParticipantAbstractSubmission,
  getParticipantArticleSubmission,
  isParticipantProgramStepComplete,
} from '../../../services/submissionPipelineService';

interface ParticipantSubmissionBadgePanelProps {
  event: Event;
  subsForEvent: FormSubmission[];
  /** When provided, skips an internal program fetch (parent already loaded timeline). */
  publishedProgram?: SavedProgram | null;
  programLoading?: boolean;
}

const PanelHeader: React.FC = () => (
  <div className="flex items-center gap-2">
    <Award className="text-emerald-700" size={20} />
    <h3 className="text-sm font-semibold text-slate-900">Presenter badge</h3>
  </div>
);

const ParticipantSubmissionBadgePanel: React.FC<ParticipantSubmissionBadgePanelProps> = ({
  event,
  subsForEvent,
  publishedProgram: publishedProgramProp,
  programLoading: programLoadingProp,
}) => {
  const timelineFromHook = useParticipantSubmissionTimeline(
    event,
    subsForEvent,
    publishedProgramProp === undefined && programLoadingProp === undefined
  );
  const publishedProgram = publishedProgramProp ?? timelineFromHook.publishedProgram;
  const programLoading = programLoadingProp ?? timelineFromHook.programLoading;
  const programCtx = useMemo(
    () => ({ publishedProgram, programLoading }),
    [publishedProgram, programLoading]
  );

  const abstractSub = useMemo(
    () => getParticipantAbstractSubmission(event, subsForEvent),
    [event, subsForEvent]
  );
  const articleSub = useMemo(
    () => getParticipantArticleSubmission(event, subsForEvent, abstractSub?.submissionPipelineGroupId),
    [event, subsForEvent, abstractSub?.submissionPipelineGroupId]
  );

  const eligibility = useMemo(
    () => evaluateSubmissionBadgeEligibility(event, subsForEvent, programCtx),
    [event, subsForEvent, programCtx]
  );

  const programComplete = useMemo(
    () => isParticipantProgramStepComplete(event, subsForEvent, programCtx),
    [event, subsForEvent, programCtx]
  );

  const [badge, setBadge] = useState<ParticipantBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const loadBadge = useCallback(async () => {
    if (!articleSub?.id || !eligibility.eligible) {
      setBadge(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let b = await getBadgeForSubmission(articleSub.id);
      if (!b && eligibility.badgeTemplateId) {
        setGenerating(true);
        b = await ensureSubmissionParticipantBadge(event, articleSub, subsForEvent, programCtx);
        setGenerating(false);
      }
      setBadge(b);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load badge.');
      setBadge(null);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [articleSub, eligibility.eligible, eligibility.badgeTemplateId, event, subsForEvent, programCtx]);

  useEffect(() => {
    if (programLoading) return;
    void loadBadge();
  }, [loadBadge, programLoading]);

  if (!event.submissionFormIds?.length) return null;

  if (!programComplete && !eligibility.eligible) {
    return null;
  }

  if (!eligibility.eligible) {
    if (!eligibility.reason) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-2">
        <PanelHeader />
        <p className="text-sm text-slate-600">{eligibility.reason}</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!badge) return;
    setDownloading(true);
    setError('');
    try {
      await downloadParticipantBadge(badge);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
      <PanelHeader />
      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </p>
      ) : null}
      {loading || generating ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={18} className="animate-spin text-indigo-600" />
          {generating ? 'Preparing your badge…' : 'Loading badge…'}
        </div>
      ) : badge ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
            <img
              src={badge.badgeImageUrl}
              alt={`Badge for ${badge.participantName}`}
              className="h-24 w-auto max-w-[140px] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download badge
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Badge is not available yet. Try again in a moment.</p>
      )}
    </div>
  );
};

export default ParticipantSubmissionBadgePanel;
