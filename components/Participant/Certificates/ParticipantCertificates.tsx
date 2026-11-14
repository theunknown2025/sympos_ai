import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Calendar, Eye, Loader2, MapPin, Tag } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getParticipantAccountCertificates,
  type ParticipantAccountCertificate,
} from '../../../services/certificateService';
import { getEvent } from '../../../services/eventService';
import type { Event } from '../../../types';
import ParticipantCertificatePreviewModal from './ParticipantCertificatePreviewModal';

type CertificateTab = 'registration' | 'submission';

const formatEventDates = (event: Event): string => {
  if (!event.dates?.length) return 'Dates to be announced';
  return event.dates
    .map((d) => {
      const start = new Date(d.startDate).toLocaleDateString();
      const end =
        d.endDate && d.endDate !== d.startDate
          ? new Date(d.endDate).toLocaleDateString()
          : '';
      return end ? `${start} – ${end}` : start;
    })
    .join('; ');
};

const ParticipantCertificates: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<CertificateTab>('registration');
  const [certificates, setCertificates] = useState<ParticipantAccountCertificate[]>([]);
  const [eventsById, setEventsById] = useState<Record<string, Event>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewCertificate, setPreviewCertificate] = useState<ParticipantAccountCertificate | null>(
    null
  );

  const loadCertificates = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      setError('');
      const all = await getParticipantAccountCertificates(currentUser.id);
      setCertificates(all);

      const uniqueEventIds = [...new Set(all.map((c) => c.eventId))];
      const eventEntries = await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          const event = await getEvent(eventId);
          return event ? ([eventId, event] as const) : null;
        })
      );
      const map: Record<string, Event> = {};
      for (const entry of eventEntries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setEventsById(map);
    } catch (err) {
      console.error(err);
      setError('Failed to load your certificates');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const filteredCertificates = useMemo(
    () => certificates.filter((c) => c.certificateScope === activeTab),
    [certificates, activeTab]
  );

  const previewEventName = previewCertificate
    ? eventsById[previewCertificate.eventId]?.name
    : undefined;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Award size={32} className="text-indigo-600" />
          My Certificates
        </h1>
        <p className="text-slate-500 mt-2">
          Certificates shared with your account by event organizers.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <nav className="flex gap-1 border-b border-slate-200 mb-6" aria-label="Certificate tabs">
        {(
          [
            ['registration', 'Registration'],
            ['submission', 'Submissions'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {filteredCertificates.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Award size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">No {activeTab} certificates yet</p>
          <p className="text-sm mt-1">
            When an organizer adds a certificate to your account, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCertificates.map((certificate) => {
            const event = eventsById[certificate.eventId];
            return (
              <article
                key={certificate.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
                    {certificate.certificateScope === 'registration'
                      ? 'Registration certificate'
                      : 'Submission certificate'}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {event?.name || 'Event'}
                  </h2>
                </div>

                {event && (
                  <div className="space-y-2 text-sm text-slate-600">
                    {event.eventType && (
                      <p className="flex items-center gap-2">
                        <Tag size={14} className="text-slate-400 shrink-0" />
                        <span>{event.eventType}</span>
                        {event.eventFormat && (
                          <span className="text-slate-400">· {event.eventFormat}</span>
                        )}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span>{event.location}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span>{formatEventDates(event)}</span>
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Issued {certificate.createdAt.toLocaleDateString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreviewCertificate(certificate)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    <Eye size={16} />
                    Preview Certificate
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ParticipantCertificatePreviewModal
        certificate={previewCertificate}
        eventName={previewEventName}
        onClose={() => setPreviewCertificate(null)}
      />
    </div>
  );
};

export default ParticipantCertificates;
