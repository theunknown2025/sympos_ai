import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Loader2,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserEvents } from '../../../../services/eventService';
import { getCommitteeMember } from '../../../../services/committeeMemberService';
import { getEvaluationForm } from '../../../../services/evaluationFormService';
import { updateSubmissionDecision } from '../../../../services/registrationSubmissionService';
import { supabase, TABLES } from '../../../../supabase';
import { Event, ParticipantReview, ReviewCommitteeMember, EvaluationForm, FormSubmission, DecisionStatus, ApprovalStatus } from '../../../../types';
import SubmissionApprovalModal from './SubmissionApprovalModal';

interface ReviewWithDetails extends ParticipantReview {
  reviewer?: ReviewCommitteeMember;
  submissionName?: string;
  eventName?: string;
  evaluationForm?: EvaluationForm;
  submission?: FormSubmission; // Add submission data to get decision status
}

const SubmissionsEvaluation: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [allReviews, setAllReviews] = useState<ReviewWithDetails[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedSubmissionForDecision, setSelectedSubmissionForDecision] = useState<{
    submissionId: string;
    reviewId: string;
    submission?: FormSubmission;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      // Load events for event name lookup
      const userEvents = await getUserEvents(currentUser.id);
      setEvents(userEvents);

      // Directly query all reviews from participant_reviews table
      const { data: reviewsData, error: reviewsError } = await supabase
        .from(TABLES.PARTICIPANT_REVIEWS)
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      if (!reviewsData) {
        setAllReviews([]);
        return;
      }

      // Convert database records to ParticipantReview format
      const allReviews: ParticipantReview[] = reviewsData.map(doc => {
        // Deserialize JSON fields
        const answers = typeof doc.answers === 'string' 
          ? JSON.parse(doc.answers) 
          : (doc.answers || {});
        
        return {
          id: doc.id,
          participantId: doc.participant_id,
          userId: doc.user_id,
          eventId: doc.event_id,
          formId: doc.form_id,
          submissionId: doc.submission_id,
          submissionType: doc.submission_type as 'submission' | 'evaluation',
          status: (doc.status as 'draft' | 'completed') || 'draft',
          answers: answers,
          createdAt: new Date(doc.created_at),
          updatedAt: new Date(doc.updated_at),
        };
      });

      // Enrich reviews with reviewer and submission information
      const reviewsWithDetails = await Promise.all(
        allReviews.map(async (review) => {
          try {
            // Get reviewer information
            const reviewer = await getCommitteeMember(review.participantId);
            
            // Get evaluation form
            let evaluationForm: EvaluationForm | undefined;
            try {
              evaluationForm = await getEvaluationForm(review.formId);
            } catch (err) {
              console.error('Error loading evaluation form:', err);
            }
            
            // Get submission information
            let submissionName = 'Unknown Submission';
            let eventName = 'Unknown Event';
            let submission: FormSubmission | undefined;
            
            try {
              const { data: submissionData } = await supabase
                .from(TABLES.FORM_SUBMISSIONS)
                .select('*')
                .eq('id', review.submissionId)
                .single();
              
              if (submissionData) {
                const generalInfo = typeof submissionData.general_info === 'string'
                  ? JSON.parse(submissionData.general_info)
                  : submissionData.general_info || {};
                submissionName = generalInfo.name || submissionData.submitted_by || 'Unknown Submission';
                
                // Deserialize submission data
                const answers = typeof submissionData.answers === 'string'
                  ? JSON.parse(submissionData.answers)
                  : submissionData.answers || {};
                
                submission = {
                  id: submissionData.id,
                  formId: submissionData.form_id,
                  eventId: submissionData.event_id,
                  eventTitle: submissionData.event_title,
                  userId: submissionData.user_id,
                  participantUserId: submissionData.participant_user_id || undefined,
                  submittedBy: submissionData.submitted_by,
                  subscriptionType: (submissionData.subscription_type as 'self' | 'entity') || 'self',
                  entityName: submissionData.entity_name || undefined,
                  role: (submissionData.role as 'Organizer' | 'Participant') || 'Participant',
                  generalInfo: generalInfo,
                  answers: answers,
                  submittedAt: new Date(submissionData.created_at),
                  decisionStatus: submissionData.decision_status as DecisionStatus | undefined,
                  decisionComment: submissionData.decision_comment || undefined,
                  decisionDate: submissionData.decision_date ? new Date(submissionData.decision_date) : undefined,
                  decidedBy: submissionData.decided_by || undefined,
                  acceptedEventId: submissionData.accepted_event_id || undefined,
                  dispatchingStatus: submissionData.dispatching_status || undefined,
                  approvalStatus: submissionData.approval_status as ApprovalStatus | undefined,
                };
              }
            } catch (err) {
              console.error('Error loading submission:', err);
            }

            // Get event name
            const event = userEvents.find(e => e.id === review.eventId);
            if (event) {
              eventName = event.name;
            }

            return {
              ...review,
              reviewer,
              submissionName,
              eventName,
              evaluationForm,
              submission,
            };
          } catch (err) {
            console.error('Error enriching review:', err);
            return {
              ...review,
              reviewer: undefined,
              submissionName: 'Unknown Submission',
              eventName: 'Unknown Event',
              evaluationForm: undefined,
            };
          }
        })
      );

      setAllReviews(reviewsWithDetails);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Filter reviews based on selected event
  const filteredReviews = selectedEvent === 'all'
    ? allReviews
    : allReviews.filter(review => review.eventId === selectedEvent);

  const toggleReviewExpanded = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleOpenDecisionModal = (submissionId: string, reviewId: string, submission?: FormSubmission) => {
    setSelectedSubmissionForDecision({
      submissionId,
      reviewId,
      submission
    });
    setDecisionModalOpen(true);
  };

  const handleApprovalSubmit = async (approval: ApprovalStatus, comment: string) => {
    if (!selectedSubmissionForDecision || !currentUser?.id) return;

    try {
      setError('');

      // Update approval_status column directly
      const { error: updateError } = await supabase
        .from(TABLES.FORM_SUBMISSIONS)
        .update({
          approval_status: approval,
          decision_comment: comment || null,
          decision_date: new Date().toISOString(),
          decided_by: currentUser.id,
        })
        .eq('id', selectedSubmissionForDecision.submissionId);

      if (updateError) {
        throw updateError;
      }

      // Reload data to reflect the update
      await loadData();
    } catch (err: any) {
      console.error('Error updating submission approval:', err);
      setError(err.message || 'Failed to update submission approval');
      throw err; // Re-throw to let modal handle the error
    }
  };

  const getApprovalStatusBadge = (status?: ApprovalStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Approved with Reserve
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <X className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            <Clock className="h-3 w-3" />
            Pending Approval
          </span>
        );
    }
  };

  const renderFieldValue = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        // SubFields array - format as table info
        return `${value.length} entry/entries`;
      }
      const filtered = value.filter(v => v !== null && v !== undefined && v !== '');
      return filtered.length > 0 ? filtered.join(', ') : 'N/A';
    }
    if (value instanceof Date) {
      return formatDate(value);
    }
    return String(value || 'N/A');
  };

  const getFieldLabel = (form: EvaluationForm | undefined, fieldId: string): string => {
    if (!form) return fieldId;

    // Check sections
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.id === fieldId) return field.label;
      }
      for (const subsection of section.subsections) {
        for (const field of subsection.fields) {
          if (field.id === fieldId) return field.label;
        }
      }
    }

    // Check legacy fields
    for (const field of form.fields) {
      if (field.id === fieldId) return field.label;
    }

    return fieldId;
  };

  const getSubFieldLabel = (form: EvaluationForm | undefined, fieldId: string, subFieldId: string): string => {
    if (!form) return subFieldId;

    // Check sections
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.id === fieldId && field.hasSubFields && field.subFields) {
          const subField = field.subFields.find(sf => sf.id === subFieldId);
          if (subField) return subField.label;
        }
      }
      for (const subsection of section.subsections) {
        for (const field of subsection.fields) {
          if (field.id === fieldId && field.hasSubFields && field.subFields) {
            const subField = field.subFields.find(sf => sf.id === subFieldId);
            if (subField) return subField.label;
          }
        }
      }
    }

    // Check legacy fields
    for (const field of form.fields) {
      if (field.id === fieldId && field.hasSubFields && field.subFields) {
        const subField = field.subFields.find(sf => sf.id === subFieldId);
        if (subField) return subField.label;
      }
    }

    return subFieldId;
  };

  const renderFieldValueDisplay = (value: any, form: EvaluationForm | undefined, fieldId: string) => {
    // Check if this is a sub-fields array (array of objects)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const filtered = value.filter(v => v !== null && v !== undefined);
      if (filtered.length === 0) {
        return <p className="text-sm text-slate-400 italic">No entries provided</p>;
      }

      // Get all column IDs from the first row
      const allSubFieldIds = Array.from(new Set(
        filtered.flatMap(row => Object.keys(row))
      ));

      return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                    #
                  </th>
                  {allSubFieldIds.map((colId) => (
                    <th
                      key={colId}
                      className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      {getSubFieldLabel(form, fieldId, colId)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      {rowIndex + 1}
                    </td>
                    {allSubFieldIds.map((colId) => {
                      const subValue = row[colId];
                      return (
                        <td key={colId} className="px-4 py-3 text-sm text-slate-900">
                          {subValue instanceof Date
                            ? formatDate(subValue)
                            : String(subValue || 'N/A')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== null && v !== undefined && v !== '');
      if (filtered.length === 0) {
        return <p className="text-sm text-slate-400 italic">No answers provided</p>;
      }
      return (
        <div className="space-y-2">
          {filtered.map((val, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-slate-900 flex-1">{String(val)}</p>
            </div>
          ))}
        </div>
      );
    }

    if (value instanceof Date) {
      return <p className="text-sm text-slate-900">{formatDate(value)}</p>;
    }
    return <p className="text-sm text-slate-900 break-words">{String(value || 'N/A')}</p>;
  };

  if (loading && allReviews.length === 0) {
    return (
      <div className="h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" />
            Submissions Evaluation
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            View all reviewer evaluations and answers for submissions
          </p>
        </header>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 mt-4">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" />
            Submissions Evaluation
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            View all reviewer evaluations and answers for submissions
          </p>
        </header>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading reviews</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText size={32} className="text-indigo-600" />
          Submissions Evaluation
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          View all reviewer evaluations and answers for submissions
        </p>
      </header>

      {/* Event Filter */}
      {events.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Filter by Event:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events ({allReviews.length})</option>
              {events.map((event) => {
                const count = allReviews.filter(r => r.eventId === event.id).length;
                return (
                  <option key={event.id} value={event.id}>
                    {event.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No reviews found</h3>
          <p className="text-slate-500">
            {selectedEvent === 'all'
              ? 'No reviews found in the participant_reviews table.'
              : `No reviews found for the selected event.${allReviews.length > 0 ? ' Try selecting "All Events".' : ''}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const reviewerName = review.reviewer
              ? `${review.reviewer.title || ''} ${review.reviewer.firstName} ${review.reviewer.lastName}`.trim()
              : 'Unknown Reviewer';
            const reviewerEmail = review.reviewer?.email || 'N/A';

            return (
              <div
                key={review.id}
                className={`bg-white border rounded-lg overflow-hidden ${
                  review.status === 'completed'
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-yellow-200 bg-yellow-50/30'
                }`}
              >
                {/* Review Header */}
                <div
                  className="px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleReviewExpanded(review.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-slate-900">{review.submissionName}</h3>
                        <span className="text-sm text-slate-500">({review.eventName})</span>
                        {review.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                        {review.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            <Clock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                        {review.submission && getApprovalStatusBadge(review.submission.approvalStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          <span>Reviewer: {reviewerName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail size={16} />
                          <span>{reviewerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Reviewed: {formatDate(review.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-slate-500">
                        <div>Submission ID:</div>
                        <div className="font-mono text-xs">{review.submissionId.substring(0, 8)}...</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Details */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-slate-50">
                    <div className="space-y-6">
                      {/* Admin Decision Section */}
                      {review.submission && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                            Admin Approval
                          </h4>
                          <div className="space-y-3">
                            {/* Current Status */}
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Current Approval Status
                              </p>
                              <div className="flex items-center gap-2">
                                {getApprovalStatusBadge(review.submission.approvalStatus)}
                                {review.submission.decisionDate && (
                                  <span className="text-xs text-slate-500">
                                    on {formatDate(review.submission.decisionDate)}
                                  </span>
                                )}
                              </div>
                              {review.submission.decisionComment && (
                                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                                  <p className="text-xs font-medium text-slate-600 mb-1">Comment:</p>
                                  <p className="text-sm text-slate-700">{review.submission.decisionComment}</p>
                                </div>
                              )}
                            </div>

                            {/* Approval Actions */}
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Approval Status
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDecisionModal(review.submissionId, review.id, review.submission);
                                }}
                                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {review.submission.approvalStatus ? 'Update Approval' : 'Make Approval'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submitted At */}
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Submitted At</p>
                        <p className="text-sm text-slate-900">{formatDate(review.createdAt)}</p>
                      </div>

                      {/* Review Answers */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Review Answers</h4>
                        {Object.keys(review.answers).length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No answers provided</p>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(review.answers).map(([fieldId, value]) => {
                              const fieldLabel = getFieldLabel(review.evaluationForm, fieldId);
                              return (
                                <div key={fieldId} className="border-b border-slate-200 pb-4 last:border-b-0">
                                  <p className="text-sm font-medium text-slate-700 mb-2">{fieldLabel}</p>
                                  {renderFieldValueDisplay(value, review.evaluationForm, fieldId)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      <SubmissionApprovalModal
        isOpen={decisionModalOpen}
        onClose={() => {
          setDecisionModalOpen(false);
          setSelectedSubmissionForDecision(null);
        }}
        onSubmit={handleApprovalSubmit}
        currentApproval={selectedSubmissionForDecision?.submission?.approvalStatus}
        currentComment={selectedSubmissionForDecision?.submission?.decisionComment}
      />
    </div>
  );
};

export default SubmissionsEvaluation;
