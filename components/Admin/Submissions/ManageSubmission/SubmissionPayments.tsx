import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  AlertCircle,
  Filter,
  CreditCard,
  Mail,
  User,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { FormSubmission, updateSubmissionPaymentCompleted } from '../../../../services/registrationSubmissionService';
import { Event } from '../../../../types';
import { useOrganizerScopedEventId } from '../../../../contexts/OrganizerEventScopeContext';
import {
  eventSubmissionPreset,
  workflowNeedsPayment,
  workflowPresetLabel,
} from '../../../../services/submissionPipelineService';
import { fetchNormalizedSubmissionsForOrganizer } from './fetchOrganizerSubmissions';
import { submissionIsPaymentEligible, findPaymentFormSubmissionForArticle } from './receivedSubmissionsUtils';

function formatDate(iso: string | Date | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function formatAnswerPreview(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const SubmissionPayments: React.FC = () => {
  const { currentUser } = useAuth();
  const organizerScopedEventId = useOrganizerScopedEventId();
  const isEventScopeLocked = !!organizerScopedEventId;
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentBusyId, setPaymentBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (organizerScopedEventId) {
      setSelectedEvent(organizerScopedEventId);
    }
  }, [organizerScopedEventId]);

  const load = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      setError('');
      const { submissions: normalized, events: userEvents } =
        await fetchNormalizedSubmissionsForOrganizer(currentUser.id);
      setEvents(userEvents);
      setSubmissions(normalized);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      void load();
    }
  }, [currentUser]);

  const paymentEvents = useMemo(
    () => events.filter((e) => workflowNeedsPayment(eventSubmissionPreset(e))),
    [events]
  );

  const eventOptions = useMemo(() => {
    return paymentEvents.map((e) => ({ id: e.id, title: e.name }));
  }, [paymentEvents]);

  const totalPaymentRowCount = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((s) => {
      const ev = events.find((e) => e.id === s.eventId);
      if (!ev || !submissionIsPaymentEligible(s, ev, submissions)) return false;
      if (!q) return true;
      return (
        s.submittedBy?.toLowerCase().includes(q) ||
        s.eventTitle?.toLowerCase().includes(q) ||
        s.generalInfo?.name?.toLowerCase().includes(q) ||
        s.generalInfo?.email?.toLowerCase().includes(q)
      );
    }).length;
  }, [submissions, events, searchQuery]);

  const paymentRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = submissions.filter((s) => {
      const ev = events.find((e) => e.id === s.eventId);
      if (!ev || !submissionIsPaymentEligible(s, ev, submissions)) return false;
      if (selectedEvent !== 'all' && s.eventId !== selectedEvent) return false;
      if (!q) return true;
      return (
        s.submittedBy?.toLowerCase().includes(q) ||
        s.eventTitle?.toLowerCase().includes(q) ||
        s.generalInfo?.name?.toLowerCase().includes(q) ||
        s.generalInfo?.email?.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) => {
      const pa = a.submissionPaymentCompleted ? 1 : 0;
      const pb = b.submissionPaymentCompleted ? 1 : 0;
      return pa - pb;
    });
  }, [submissions, events, selectedEvent, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading payments…</p>
      </div>
    );
  }

  if (paymentEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={28} />
            Paiement
          </h2>
          <p className="text-slate-600 mt-1 text-sm">
            Track registration fees for accepted full papers when the event workflow includes payment (scenarios B
            and D).
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-600">
          <p className="font-medium text-slate-800">No event uses a payment step</p>
          <p className="mt-2 text-sm max-w-lg mx-auto">
            None of your events are configured with payment in the submission scenario. You can change this in event
            management (workflow preset B or D).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="text-indigo-600" size={28} />
          Paiement
        </h2>
        <p className="text-slate-600 mt-1 text-sm">
          Accepted articles only. Review the participant&apos;s payment form answers, then confirm when the fee is
          received (or mark not received if you need to reverse a confirmation).
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or event…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Event:</label>
            {isEventScopeLocked ? (
              <p className="text-sm text-slate-600 py-2">Showing only your selected event (change it from the header).</p>
            ) : (
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
              >
                <option value="all">All payment-enabled events ({totalPaymentRowCount})</option>
                {eventOptions.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {paymentRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-600">
          <CreditCard className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="font-medium text-slate-800">No accepted articles in this view</p>
          <p className="mt-2 text-sm">
            Either there are no accepted full papers yet, or none match your filters. Use Received Submission to
            accept articles first.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Participant</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Scenario</th>
                <th className="px-4 py-3 font-semibold min-w-[200px]">Payment form</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold w-[1%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentRows.map((s) => {
                const ev = events.find((e) => e.id === s.eventId);
                const preset = ev ? eventSubmissionPreset(ev) : 'A';
                const name = s.generalInfo?.name || s.submittedBy || '—';
                const email = s.generalInfo?.email || '—';
                const paid = Boolean(s.submissionPaymentCompleted);
                const paySub = ev ? findPaymentFormSubmissionForArticle(s, ev, submissions) : undefined;
                const payAnswers = paySub?.answers && typeof paySub.answers === 'object' ? paySub.answers : {};
                const payGen = paySub?.generalInfo;
                return (
                  <tr key={s.id} className={paid ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.eventTitle || '—'}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <User size={14} className="text-slate-400 shrink-0" />
                        {name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{email}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        {formatDate(s.submittedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{workflowPresetLabel(preset)}</td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      {!paySub ? (
                        <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">
                          Awaiting participant payment form
                        </span>
                      ) : (
                        <details className="text-xs max-w-[280px]">
                          <summary className="cursor-pointer text-indigo-600 font-medium hover:underline">
                            View responses ({Object.keys(payAnswers).length} field
                            {Object.keys(payAnswers).length === 1 ? '' : 's'})
                          </summary>
                          <div className="mt-2 space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50 max-h-48 overflow-y-auto">
                            {payGen && Object.keys(payGen).length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-600 mb-1">Contact</p>
                                <ul className="space-y-0.5 text-slate-700">
                                  {payGen.name != null && payGen.name !== '' && (
                                    <li>
                                      <span className="text-slate-500">Name:</span> {payGen.name}
                                    </li>
                                  )}
                                  {payGen.email != null && payGen.email !== '' && (
                                    <li>
                                      <span className="text-slate-500">Email:</span> {payGen.email}
                                    </li>
                                  )}
                                  {payGen.phone != null && payGen.phone !== '' && (
                                    <li>
                                      <span className="text-slate-500">Phone:</span> {payGen.phone}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {Object.keys(payAnswers).length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-600 mb-1">Answers</p>
                                <ul className="space-y-1 text-slate-700 break-words">
                                  {Object.entries(payAnswers).map(([fieldId, val]) => (
                                    <li key={fieldId}>
                                      <span className="text-slate-500 font-mono text-[10px]">{fieldId}</span>
                                      <span className="block text-slate-900">{formatAnswerPreview(val)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                              Submitted {formatDate(paySub.submittedAt)}
                            </p>
                          </div>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {paid ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                          Paiement reçu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {!paid && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setPaymentBusyId(s.id);
                                await updateSubmissionPaymentCompleted(s.id, true);
                                await load();
                              } catch (err) {
                                console.error(err);
                                setError('Failed to update payment status');
                              } finally {
                                setPaymentBusyId(null);
                              }
                            }}
                            disabled={paymentBusyId === s.id || !paySub}
                            title={!paySub ? 'Wait until the participant submits the payment form' : undefined}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 disabled:opacity-60"
                          >
                            {paymentBusyId === s.id ? 'Saving…' : 'Payment received'}
                          </button>
                        )}
                        {paid && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setPaymentBusyId(s.id);
                                await updateSubmissionPaymentCompleted(s.id, false);
                                await load();
                              } catch (err) {
                                console.error(err);
                                setError('Failed to update payment status');
                              } finally {
                                setPaymentBusyId(null);
                              }
                            }}
                            disabled={paymentBusyId === s.id}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-60"
                          >
                            {paymentBusyId === s.id ? 'Saving…' : 'Mark not received'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmissionPayments;
