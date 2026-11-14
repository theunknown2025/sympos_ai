import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  MessageSquare,
  User,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useOrganizerScopedEventId } from '../../../../contexts/OrganizerEventScopeContext';
import { getUserEvents } from '../../../../services/eventService';
import { getCommitteeMember } from '../../../../services/committeeMemberService';
import {
  bulkDecideModificationQuestions,
  decideModificationQuestion,
  finalizeOrganizerReview,
  getPendingOrganizerRounds,
} from '../../../../services/submissionModificationService';
import { supabase, TABLES } from '../../../../supabase';
import { Event, SubmissionModificationRound } from '../../../../types';

interface RoundWithDetails extends SubmissionModificationRound {
  submissionName?: string;
  eventName?: string;
  reviewerName?: string;
}

const SubmissionsModifications: React.FC = () => {
  const { currentUser } = useAuth();
  const organizerScopedEventId = useOrganizerScopedEventId();
  const isEventScopeLocked = !!organizerScopedEventId;

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rounds, setRounds] = useState<RoundWithDetails[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (organizerScopedEventId) {
      setSelectedEvent(organizerScopedEventId);
    }
  }, [organizerScopedEventId]);

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

      const userEvents = await getUserEvents(currentUser.id);
      setEvents(userEvents);

      const eventIds = userEvents.map((e) => e.id);
      const pendingRounds = await getPendingOrganizerRounds(eventIds);

      const enriched = await Promise.all(
        pendingRounds.map(async (round) => {
          let submissionName = 'Unknown Submission';
          let eventName = userEvents.find((e) => e.id === round.eventId)?.name ?? round.eventId;
          let reviewerName = 'Unknown Reviewer';

          try {
            const { data: submissionData } = await supabase
              .from(TABLES.FORM_SUBMISSIONS)
              .select('general_info, submitted_by')
              .eq('id', round.submissionId)
              .single();

            if (submissionData) {
              const generalInfo =
                typeof submissionData.general_info === 'string'
                  ? JSON.parse(submissionData.general_info)
                  : submissionData.general_info || {};
              submissionName =
                generalInfo.name || submissionData.submitted_by || 'Unknown Submission';
            }
          } catch {
            /* ignore */
          }

          try {
            const reviewer = await getCommitteeMember(round.reviewerId);
            if (reviewer) {
              reviewerName = `${reviewer.firstName} ${reviewer.lastName}`;
            }
          } catch {
            /* ignore */
          }

          return {
            ...round,
            submissionName,
            eventName,
            reviewerName,
          };
        })
      );

      setRounds(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to load modifications');
    } finally {
      setLoading(false);
    }
  };

  const filteredRounds = useMemo(
    () =>
      selectedEvent === 'all'
        ? rounds
        : rounds.filter((r) => r.eventId === selectedEvent),
    [rounds, selectedEvent]
  );

  const toggleExpanded = (roundId: string) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) next.delete(roundId);
      else next.add(roundId);
      return next;
    });
  };

  const handleDecideQuestion = async (
    roundId: string,
    questionId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (!currentUser?.id) return;
    try {
      setActionLoading(questionId);
      setError('');
      await decideModificationQuestion(questionId, status, currentUser.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update question');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDecide = async (roundId: string, status: 'approved' | 'rejected') => {
    if (!currentUser?.id) return;
    try {
      setActionLoading(roundId);
      setError('');
      await bulkDecideModificationQuestions(roundId, status, currentUser.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to bulk update questions');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalize = async (roundId: string) => {
    try {
      setActionLoading(`finalize-${roundId}`);
      setError('');
      setSuccess('');
      const status = await finalizeOrganizerReview(roundId);
      setSuccess(
        status === 'awaiting_participant'
          ? 'Sent to participant for modifications.'
          : 'All questions rejected. Reviewer will be notified.'
      );
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to finalize review');
    } finally {
      setActionLoading(null);
    }
  };

  const roundCanFinalize = (round: RoundWithDetails) => {
    const questions = round.questions ?? [];
    if (questions.length === 0) return false;
    const allDecided = questions.every((q) => q.organizerStatus !== 'pending');
    const hasApproved = questions.some((q) => q.organizerStatus === 'approved');
    return allDecided && hasApproved;
  };

  const roundAllDecided = (round: RoundWithDetails) => {
    return (round.questions ?? []).every((q) => q.organizerStatus !== 'pending');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-indigo-600" />
            Submission Modifications
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve modification questions from reviewers before sending to participants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          {isEventScopeLocked ? (
            <span className="text-sm text-slate-600">
              Event: {events.find((e) => e.id === organizerScopedEventId)?.name ?? 'Selected'}
            </span>
          ) : (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {filteredRounds.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No pending modification requests</p>
          <p className="text-sm text-slate-500 mt-1">
            When reviewers submit modification questions, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRounds.map((round) => {
            const isExpanded = expandedRounds.has(round.id);
            const questions = round.questions ?? [];
            const pendingCount = questions.filter((q) => q.organizerStatus === 'pending').length;

            return (
              <div
                key={round.id}
                className="border border-slate-200 rounded-lg bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(round.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {round.submissionName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{round.eventName}</span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {round.reviewerName}
                      </span>
                      <span>Round {round.roundNumber}</span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 py-3">
                      <button
                        type="button"
                        onClick={() => handleBulkDecide(round.id, 'approved')}
                        disabled={actionLoading === round.id || pendingCount === 0}
                        className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve all
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkDecide(round.id, 'rejected')}
                        disabled={actionLoading === round.id || pendingCount === 0}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject all
                      </button>
                    </div>

                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">
                                Q{idx + 1}
                                {q.concernedSection && (
                                  <span className="font-normal text-slate-500 ml-2">
                                    — {q.concernedSection}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-slate-700 mt-1">{q.questionText}</p>
                              <span
                                className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                                  q.organizerStatus === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : q.organizerStatus === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {q.organizerStatus}
                              </span>
                            </div>
                            {q.organizerStatus === 'pending' && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDecideQuestion(round.id, q.id, 'approved')}
                                  disabled={actionLoading === q.id}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecideQuestion(round.id, q.id, 'rejected')}
                                  disabled={actionLoading === q.id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleFinalize(round.id)}
                        disabled={
                          actionLoading === `finalize-${round.id}` ||
                          !roundAllDecided(round)
                        }
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {actionLoading === `finalize-${round.id}` ? (
                          <Loader2 size={14} className="animate-spin inline" />
                        ) : roundCanFinalize(round) ? (
                          'Finalize & send to participant'
                        ) : roundAllDecided(round) ? (
                          'Finalize (all rejected)'
                        ) : (
                          'Decide all questions first'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionsModifications;
