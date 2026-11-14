import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  File,
  Loader2,
  MessageSquare,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getAwaitingParticipantRounds,
  getRoundsForSubmission,
  submitParticipantModifications,
} from '../../../services/submissionModificationService';
import { getFileDownloadURL } from '../../../services/storageService';
import { STORAGE_BUCKETS } from '../../../supabase';
import { FormSubmission, SubmissionModificationRound } from '../../../types';

interface SubmissionModificationsModalProps {
  submission: FormSubmission;
  onClose: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const SubmissionModificationsModal: React.FC<SubmissionModificationsModalProps> = ({
  submission,
  onClose,
  onSuccess,
  readOnly = false,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rounds, setRounds] = useState<SubmissionModificationRound[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    loadRounds();
  }, [submission.id]);

  const loadRounds = async () => {
    try {
      setLoading(true);
      const data = readOnly
        ? await getRoundsForSubmission(submission.id)
        : await getAwaitingParticipantRounds(submission.id);

      const visible = readOnly
        ? data.filter(
            (r) =>
              r.status === 'awaiting_participant' ||
              r.status === 'participant_submitted' ||
              r.status === 'reviewer_approved'
          )
        : data;

      setRounds(visible);

      const initialAnswers: Record<string, string> = {};
      for (const round of visible) {
        for (const q of round.questions ?? []) {
          if (q.organizerStatus === 'approved') {
            initialAnswers[q.id] = q.answerText ?? '';
          }
        }
      }
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'Failed to load modifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRound = async (round: SubmissionModificationRound) => {
    if (!currentUser?.id) return;

    const approvedQuestions = (round.questions ?? []).filter(
      (q) => q.organizerStatus === 'approved'
    );

    const answerPayload = approvedQuestions.map((q) => ({
      questionId: q.id,
      answerText: answers[q.id] ?? '',
    }));

    const missing = answerPayload.some((a) => !a.answerText.trim());
    if (missing) {
      setError('Please provide an answer for each question.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await submitParticipantModifications({
        roundId: round.id,
        submissionId: submission.id,
        userId: currentUser.id,
        answers: answerPayload,
        file: uploadFiles[round.id] ?? undefined,
      });
      setSuccess('Modifications submitted successfully.');
      onSuccess?.();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit modifications');
    } finally {
      setSaving(false);
    }
  };

  const openFile = async (storagePath: string) => {
    try {
      const url = await getFileDownloadURL(
        STORAGE_BUCKETS.SUBMISSION_MODIFICATION_FILES,
        storagePath
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Failed to open file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            Submission Modifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : rounds.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No modification requests at this time.
            </p>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              {rounds.map((round) => {
                const approvedQuestions = (round.questions ?? []).filter(
                  (q) => q.organizerStatus === 'approved'
                );
                const isEditable = !readOnly && round.status === 'awaiting_participant';

                return (
                  <div key={round.id} className="border border-slate-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">
                      Round {round.roundNumber}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        ({round.status.replace(/_/g, ' ')})
                      </span>
                    </p>

                    <div className="space-y-4">
                      {approvedQuestions.map((q, idx) => (
                        <div key={q.id}>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Q{idx + 1}
                            {q.concernedSection && (
                              <span className="font-normal text-slate-500 ml-1">
                                — {q.concernedSection}
                              </span>
                            )}
                          </label>
                          <p className="text-sm text-slate-600 mb-2 bg-slate-50 p-2 rounded">
                            {q.questionText}
                          </p>
                          {isEditable ? (
                            <textarea
                              value={answers[q.id] ?? ''}
                              onChange={(e) =>
                                setAnswers({ ...answers, [q.id]: e.target.value })
                              }
                              rows={3}
                              placeholder="Your answer…"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : q.answerText ? (
                            <p className="text-sm text-slate-700 bg-white border border-slate-200 p-2 rounded">
                              {q.answerText}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {isEditable && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Upload revised document (PDF, DOC, DOCX)
                        </label>
                        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
                          <Upload size={16} />
                          {uploadFiles[round.id]?.name ?? 'Choose file'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setUploadFiles({ ...uploadFiles, [round.id]: file });
                            }}
                          />
                        </label>
                      </div>
                    )}

                    {(round.files ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {round.files!.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => openFile(f.storagePath)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <File size={12} />
                            {f.fileName}
                          </button>
                        ))}
                      </div>
                    )}

                    {isEditable && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSubmitRound(round)}
                          disabled={saving}
                          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Submit modifications
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModificationsModal;
