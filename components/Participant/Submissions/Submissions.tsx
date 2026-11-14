import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Send, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { loadParticipantSubmissionsPage } from '../../../services/participantRegistrationService';
import { deleteFormSubmission } from '../../../services/registrationSubmissionService';
import { FormSubmission, Event } from '../../../types';
import { supabase, TABLES } from '../../../supabase';
import type { ParticipantSubmissionFormLaunchContext } from '../../../services/submissionPipelineService';
import { filterSubmissionsForEvent } from '../../../services/submissionPipelineService';
import FormModal from '../../Admin/Tools/FormBuilder/FormModal';
import EditSubmission from './EditSubmission';
import PreviewSubmission from './PreviewSubmission';
import ParticipantSubmissionsEventSection from './ParticipantSubmissionsEventSection';

const Submissions: React.FC = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [previewSubmission, setPreviewSubmission] = useState<FormSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<{
    event: Event;
    formId: string;
    pipelineContext: ParticipantSubmissionFormLaunchContext | null;
  } | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      loadSubmissions();
    }
  }, [currentUser]);

  /**
   * Get submission status badge based on priority:
   * 1. If approved (approval_status exists): Show approval status
   * 2. Else if dispatched (dispatching_status exists): Show "Under Review"
   * 3. Else if accepted (decision_status = 'accepted'): Show "Accepted", "Not Accepted", or "Accepted under reserve"
   * 4. Else: Show "Under Review"
   */
  const getStatusBadge = (submission: FormSubmission) => {
    // Priority 1: If approved, show approval status
    if (submission.approvalStatus) {
      switch (submission.approvalStatus) {
        case 'accepted':
          return {
            label: 'Approved',
            icon: CheckCircle2,
            className: 'bg-emerald-100 text-emerald-700',
          };
        case 'reserved':
          return {
            label: 'Approved with Reserve',
            icon: Clock,
            className: 'bg-amber-100 text-amber-700',
          };
        case 'rejected':
          return {
            label: 'Rejected',
            icon: XCircle,
            className: 'bg-red-100 text-red-700',
          };
      }
    }

    // Priority 2: If dispatched, show "Under Review"
    if (submission.dispatchingStatus) {
      return {
        label: 'Under Review',
        icon: AlertCircle,
        className: 'bg-blue-100 text-blue-700',
      };
    }

    // Priority 3: If accepted (decision_status), show acceptance status
    if (submission.decisionStatus) {
      switch (submission.decisionStatus) {
        case 'accepted':
          return {
            label: 'Accepted',
            icon: CheckCircle2,
            className: 'bg-emerald-100 text-emerald-700',
          };
        case 'reserved':
          return {
            label: 'Accepted under Reserve',
            icon: Clock,
            className: 'bg-amber-100 text-amber-700',
          };
        case 'rejected':
          return {
            label: 'Not Accepted',
            icon: XCircle,
            className: 'bg-red-100 text-red-700',
          };
      }
    }

    // Default: Under Review
    return {
      label: 'Under Review',
      icon: AlertCircle,
      className: 'bg-slate-100 text-slate-600',
    };
  };

  const loadSubmissions = async () => {
    if (!currentUser?.email || !currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      const { submissions: submissionRows, events: eventRows } =
        await loadParticipantSubmissionsPage(currentUser.email, currentUser.id);

      setEvents(eventRows);
      setSubmissions(submissionRows);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(submissionId);
      await deleteFormSubmission(submissionId);
      await loadSubmissions();
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      setError(err.message || 'Failed to delete submission');
    } finally {
      setDeletingId(null);
    }
  };

  const isCampusBlockedForEvent = useCallback(
    async (campusId?: string): Promise<boolean> => {
      if (!campusId || !currentUser?.id) return false;
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEMBERSHIPS)
        .select('subscription_status')
        .eq('participant_user_id', currentUser.id)
        .eq('campus_id', campusId)
        .maybeSingle();
      if (error) return false;
      return data?.subscription_status === 'blocked';
    },
    [currentUser?.id]
  );

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const eventsWithSubmissionRows = useMemo(() => {
    return [...events]
      .filter((e) => filterSubmissionsForEvent(submissions, e).length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [events, submissions]);

  const orphanSubmissions = useMemo(() => {
    return submissions.filter((s) => !eventById.has(s.eventId));
  }, [submissions, eventById]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">Error loading submissions</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Send size={32} className="text-indigo-600" />
          My Submissions
        </h1>
        <p className="text-slate-500 mt-1 text-sm">View and manage your paper submissions</p>
      </header>

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Send size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm">Start from Events — pick an event and use Submit paper. Your progress will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {eventsWithSubmissionRows.map((event) => (
            <ParticipantSubmissionsEventSection
              key={event.id}
              event={event}
              allUserSubmissionRows={submissions}
              onOpenSubmitModal={setSubmitModal}
              isCampusBlocked={() => isCampusBlockedForEvent(event.campusId)}
            />
          ))}

          {orphanSubmissions.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 bg-amber-50">
                <h2 className="text-sm font-semibold text-amber-950">Submissions without a matching event</h2>
                <p className="text-xs text-amber-900 mt-1">
                  These rows could not be matched to your published events list. The pipeline above is per event.
                </p>
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Event title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Form</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orphanSubmissions.map((submission) => {
                      const statusBadge = getStatusBadge(submission);
                      const StatusIcon = statusBadge.icon;
                      const isDeleting = deletingId === submission.id;
                      return (
                        <tr key={submission.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {submission.eventTitle || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {((submission as FormSubmission & { formTitle?: string }).formTitle || '').replace(
                              /^Sub\s*-?\s*/i,
                              ''
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                            >
                              <StatusIcon size={12} />
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => setPreviewSubmission(submission)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Eye size={16} />
                              </button>
                              {!submission.decisionStatus && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmission(submission)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(submission.id)}
                                disabled={isDeleting}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {submitModal && (
        <FormModal
          formId={submitModal.formId}
          eventId={submitModal.event.id}
          eventTitle={submitModal.event.name}
          pipelineContext={submitModal.pipelineContext ?? undefined}
          onClose={() => setSubmitModal(null)}
          onSuccess={() => {
            setSubmitModal(null);
            void loadSubmissions();
          }}
        />
      )}

      {/* Preview Submission Modal */}
      {previewSubmission && (
        <PreviewSubmission
          submission={previewSubmission}
          onClose={() => setPreviewSubmission(null)}
          onEdit={() => {
            setPreviewSubmission(null);
            setSelectedSubmission(previewSubmission);
          }}
        />
      )}

      {/* Edit Submission Modal */}
      {selectedSubmission && (
        <EditSubmission
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onSuccess={() => {
            setSelectedSubmission(null);
            loadSubmissions();
          }}
          onDelete={() => {
            setSelectedSubmission(null);
            loadSubmissions();
          }}
        />
      )}
    </div>
  );
};

export default Submissions;
