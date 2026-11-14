import React from 'react';
import { AlertCircle, CheckCircle2, Clock, File, MessageSquare } from 'lucide-react';
import { getFileDownloadURL } from '../../../services/storageService';
import { STORAGE_BUCKETS } from '../../../supabase';
import { SubmissionModificationRound } from '../../../types';

interface ArticleModificationsPanelProps {
  rounds: SubmissionModificationRound[];
  onRespond?: () => void;
  showActionButton?: boolean;
}

const ROUND_STATUS_LABELS: Record<string, string> = {
  pending_organizer: 'Organizer is reviewing reviewer requests',
  awaiting_participant: 'Your response is required',
  participant_submitted: 'Waiting for reviewer to review your response',
  reviewer_approved: 'Modifications accepted by reviewer',
  rejected_all: 'Modification requests were not approved',
};

const ArticleModificationsPanel: React.FC<ArticleModificationsPanelProps> = ({
  rounds,
  onRespond,
  showActionButton = false,
}) => {
  const visibleRounds = rounds.filter(
    (r) =>
      r.status !== 'pending_organizer' ||
      (r.questions ?? []).some((q) => q.organizerStatus === 'approved')
  );

  const participantVisibleRounds = rounds.filter((r) => {
    if (r.status === 'pending_organizer') return false;
    if (r.status === 'awaiting_participant') return true;
    return (r.questions ?? []).some((q) => q.organizerStatus === 'approved');
  });

  const displayRounds = participantVisibleRounds.length > 0 ? participantVisibleRounds : visibleRounds;
  const needsAction = rounds.some((r) => r.status === 'awaiting_participant');

  const openFile = async (storagePath: string) => {
    try {
      const url = await getFileDownloadURL(
        STORAGE_BUCKETS.SUBMISSION_MODIFICATION_FILES,
        storagePath
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      /* ignore */
    }
  };

  if (rounds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800 mb-1">No modification requests yet</p>
        <p className="text-xs text-slate-500">
          If reviewers request changes to your article, they will appear here before evaluation is
          finalized.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-600" />
            Modification requests
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Questions from reviewers, approved by the organizer, and your responses.
          </p>
        </div>
        {needsAction && showActionButton && onRespond ? (
          <button
            type="button"
            onClick={onRespond}
            className="shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Respond
          </button>
        ) : null}
      </div>

      {needsAction ? (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          You have modification requests waiting for your answers.
        </div>
      ) : null}

      {displayRounds.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Clock size={14} />
          Reviewer modification requests are being reviewed by the organizer.
        </div>
      ) : (
        <div className="space-y-3">
          {displayRounds.map((round) => {
            const approvedQuestions = (round.questions ?? []).filter(
              (q) => q.organizerStatus === 'approved'
            );

            return (
              <div key={round.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Round {round.roundNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {ROUND_STATUS_LABELS[round.status] ?? round.status}
                  </span>
                </div>

                {approvedQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No approved questions in this round.</p>
                ) : (
                  <div className="space-y-3">
                    {approvedQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-800">
                          Q{idx + 1}
                          {q.concernedSection ? (
                            <span className="font-normal text-slate-500 ml-1">
                              — {q.concernedSection}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">{q.questionText}</p>
                        {q.answerText ? (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                              Your answer
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{q.answerText}</p>
                            {q.participantAnsweredAt ? (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Answered {q.participantAnsweredAt.toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        ) : round.status === 'awaiting_participant' ? (
                          <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                            <Clock size={12} />
                            Awaiting your answer
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {(round.files ?? []).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <p className="w-full text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Revised document
                    </p>
                    {round.files!.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => openFile(f.storagePath)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                      >
                        <File size={12} />
                        {f.fileName}
                      </button>
                    ))}
                  </div>
                ) : null}

                {round.status === 'reviewer_approved' ? (
                  <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Reviewer accepted your modifications
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArticleModificationsPanel;
