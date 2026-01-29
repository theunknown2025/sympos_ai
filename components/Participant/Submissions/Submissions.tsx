import React, { useState, useEffect } from 'react';
import { Loader2, Send, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getRegistrationSubmissions, deleteFormSubmission } from '../../../services/registrationSubmissionService';
import { FormSubmission, DecisionStatus, ApprovalStatus, DispatchingStatus } from '../../../types';
import { getRegistrationForm } from '../../../services/registrationFormService';
import { getJuryMemberProfile } from '../../../services/juryMemberService';
import EditSubmission from './EditSubmission';
import PreviewSubmission from './PreviewSubmission';

const Submissions: React.FC = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [previewSubmission, setPreviewSubmission] = useState<FormSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      
      // Get jury member profile to get their email
      let juryMemberEmail: string | undefined;
      try {
        const juryProfile = await getJuryMemberProfile(currentUser.id);
        if (juryProfile) {
          juryMemberEmail = juryProfile.email;
        }
      } catch (err) {
        console.error('Error loading jury member profile:', err);
      }
      
      // Load all submissions for the current user by email(s)
      const allSubmissions = await getRegistrationSubmissions(
        currentUser.email,
        currentUser.id,
        juryMemberEmail
      );
      
      // Filter for submission forms (forms that start with "Sub" or contain "submission")
      const submissionForms = [];
      for (const submission of allSubmissions) {
        try {
          const form = await getRegistrationForm(submission.formId);
          if (form) {
            const titleLower = form.title.toLowerCase();
            const isSubmissionForm = titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || 
                                     titleLower.includes('submission') || titleLower.includes('submit');
            if (isSubmissionForm) {
              submissionForms.push({
                ...submission,
                formTitle: form.title,
              });
            }
          }
        } catch (err) {
          // If form not found, skip this submission
          console.error('Error loading form:', err);
        }
      }
      
      setSubmissions(submissionForms);
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
          <p className="text-sm">You haven't submitted any papers yet</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Badge Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {submissions.map((submission) => {
                const statusBadge = getStatusBadge(submission);
                const StatusIcon = statusBadge.icon;
                const isDeleting = deletingId === submission.id;
                
                return (
                  <tr
                    key={submission.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {submission.eventTitle || 'Paper Submission'}
                      </div>
                      {(submission as any).formTitle && (
                        <div className="text-xs text-slate-500 mt-1">
                          {((submission as any).formTitle || '').replace(/^Sub\s*-?\s*/i, '')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{statusBadge.label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusBadge.className}`}>
                        <StatusIcon size={12} />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSubmission(submission);
                          }}
                          className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                          title="Preview submission"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                          title="Edit submission"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(submission.id);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete submission"
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
