import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  File,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  approveModificationsByReviewer,
  getRoundsForReviewer,
  hasBlockingActiveRound,
  ModificationQuestionDraft,
  submitModificationRound,
} from '../../../services/submissionModificationService';
import { getFileDownloadURL } from '../../../services/storageService';
import { STORAGE_BUCKETS } from '../../../supabase';
import { SubmissionModificationRound } from '../../../types';

interface ReviewModificationsPanelProps {
  submissionId: string;
  reviewerId: string;
  evaluationFormId: string;
  eventId: string;
  reviewCompleted: boolean;
  onRoundsChange: (rounds: SubmissionModificationRound[]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending_organizer: 'Pending organizer approval',
  awaiting_participant: 'Awaiting participant response',
  participant_submitted: 'Participant responded',
  reviewer_approved: 'Modifications approved',
  rejected_all: 'All questions rejected',
};

const ORGANIZER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const emptyDraft = (): ModificationQuestionDraft => ({
  concernedSection: '',
  questionText: '',
});

const ReviewModificationsPanel: React.FC<ReviewModificationsPanelProps> = ({
  submissionId,
  reviewerId,
  evaluationFormId,
  eventId,
  reviewCompleted,
  onRoundsChange,
}) => {
  const [rounds, setRounds] = useState<SubmissionModificationRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<ModificationQuestionDraft[]>([emptyDraft()]);
  const [showNewRoundEditor, setShowNewRoundEditor] = useState(false);

  const loadRounds = async () => {
    try {
      setLoading(true);
      const data = await getRoundsForReviewer(submissionId, reviewerId);
      setRounds(data);
      onRoundsChange(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load modifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId && reviewerId) {
      loadRounds();
    }
  }, [submissionId, reviewerId]);

  const blockingActive = hasBlockingActiveRound(rounds);
  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const canStartNewRound =
    !reviewCompleted &&
    (!blockingActive ||
      latestRound?.status === 'participant_submitted' ||
      latestRound?.status === 'reviewer_approved' ||
      latestRound?.status === 'rejected_all');

  const handleAddDraftQuestion = () => {
    setDraftQuestions([...draftQuestions, emptyDraft()]);
  };

  const handleRemoveDraftQuestion = (index: number) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions(draftQuestions.filter((_, i) => i !== index));
  };

  const handleDraftChange = (
    index: number,
    field: keyof ModificationQuestionDraft,
    value: string
  ) => {
    const updated = [...draftQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setDraftQuestions(updated);
  };

  const handleSubmitModifications = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await submitModificationRound({
        submissionId,
        reviewerId,
        evaluationFormId,
        eventId,
        questions: draftQuestions,
      });
      setDraftQuestions([emptyDraft()]);
      setShowNewRoundEditor(false);
      setSuccess('Modifications submitted to organizer.');
      await loadRounds();
    } catch (err: any) {
      setError(err.message || 'Failed to submit modifications');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveModifications = async (roundId: string) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await approveModificationsByReviewer(roundId);
      setSuccess('Modifications approved. You can now submit your evaluation.');
      await loadRounds();
    } catch (err: any) {
      setError(err.message || 'Failed to approve modifications');
    } finally {
      setSaving(false);
    }
  };

  const openFileLink = async (storagePath: string) => {
    try {
      const url = await getFileDownloadURL(STORAGE_BUCKETS.SUBMISSION_MODIFICATION_FILES, storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Failed to open file');
    }
  };

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading modifications…</span>
      </div>
    );
  }

  return (
    <div className="mb-6 border border-indigo-200 rounded-lg overflow-hidden">
      <div className="bg-indigo-50 px-4 py-3 flex items-center gap-2 border-b border-indigo-200">
        <MessageSquare size={18} className="text-indigo-600" />
        <h2 className="text-base font-semibold text-indigo-900">Modifications</h2>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {rounds.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">History</p>
            {rounds.map((round) => (
              <div key={round.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Round {round.roundNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {STATUS_LABELS[round.status] ?? round.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {(round.questions ?? []).map((q, idx) => (
                    <div key={q.id} className="text-sm border-l-2 border-indigo-200 pl-3 py-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-700">Q{idx + 1}</span>
                        {q.concernedSection && (
                          <span className="text-xs text-slate-500">
                            Section: {q.concernedSection}
                          </span>
                        )}
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${ORGANIZER_STATUS_STYLES[q.organizerStatus]}`}
                        >
                          {q.organizerStatus}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{q.questionText}</p>
                      {q.answerText && (
                        <div className="mt-1 p-2 bg-slate-50 rounded text-slate-600 text-xs">
                          <span className="font-medium">Participant answer: </span>
                          {q.answerText}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(round.files ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {round.files!.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => openFileLink(f.storagePath)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                      >
                        <File size={12} />
                        {f.fileName}
                      </button>
                    ))}
                  </div>
                )}

                {!reviewCompleted && round.status === 'participant_submitted' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveModifications(round.id)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve modifications
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewRoundEditor(true);
                        setDraftQuestions([emptyDraft()]);
                      }}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                      Request more modifications
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!reviewCompleted && blockingActive && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Clock size={16} />
            Submit Review is disabled until the current modification round is resolved.
          </div>
        )}

        {!reviewCompleted && canStartNewRound && (showNewRoundEditor || rounds.length === 0) && (
          <div className="border border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/30">
            <p className="text-sm font-medium text-slate-800 mb-3">New modification questions</p>
            <div className="space-y-3">
              {draftQuestions.map((q, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Q{index + 1}</span>
                    {draftQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Concerned section"
                    value={q.concernedSection}
                    onChange={(e) => handleDraftChange(index, 'concernedSection', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <textarea
                    placeholder="Question"
                    value={q.questionText}
                    onChange={(e) => handleDraftChange(index, 'questionText', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={handleAddDraftQuestion}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-white"
              >
                <Plus size={14} />
                Add question
              </button>
              <button
                type="button"
                onClick={handleSubmitModifications}
                disabled={saving}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                Submit modifications
              </button>
              {rounds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewRoundEditor(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {!reviewCompleted && canStartNewRound && rounds.length > 0 && !showNewRoundEditor && (
          <button
            type="button"
            onClick={() => {
              setShowNewRoundEditor(true);
              setDraftQuestions([emptyDraft()]);
            }}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Plus size={14} />
            Add modification questions
          </button>
        )}

        {reviewCompleted && rounds.length === 0 && (
          <p className="text-sm text-slate-500 italic">No modifications were requested for this submission.</p>
        )}
      </div>
    </div>
  );
};

export default ReviewModificationsPanel;
