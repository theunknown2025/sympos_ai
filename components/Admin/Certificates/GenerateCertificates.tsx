import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Event } from '../../../types';
import { getEvent } from '../../../services/eventService';
import {
  useOrganizerScopedEventId,
  useOrganizerEventScope,
} from '../../../contexts/OrganizerEventScopeContext';
import GenerateRegistrationCertificates from './GenerateRegistrationCertificates';
import GenerateSubmissionCertificates from './GenerateSubmissionCertificates';

type CertificateTab = 'registration' | 'submission';

const GenerateCertificates: React.FC = () => {
  const scopedEventId = useOrganizerScopedEventId();
  const { focusedEventName } = useOrganizerEventScope();
  const [activeTab, setActiveTab] = useState<CertificateTab>('registration');
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!scopedEventId) {
        setEvent(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const eventData = await getEvent(scopedEventId);
        if (!eventData) {
          setError('Event not found');
          setEvent(null);
          return;
        }
        setEvent(eventData);
      } catch (err) {
        console.error(err);
        setError('Failed to load event');
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [scopedEventId]);

  return (
    <div className="h-full flex flex-col p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Generate Certificates</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {focusedEventName
            ? `Certificates for ${focusedEventName}`
            : 'Manage registration and submission certificates for the current event'}
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-12">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading event…</span>
        </div>
      ) : !scopedEventId || !event ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm">
            Select an event from the workspace header to generate certificates.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 border-b border-slate-200">
            <nav className="flex gap-1" aria-label="Certificate generator tabs">
              <button
                type="button"
                onClick={() => setActiveTab('registration')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'registration'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Registration
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('submission')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'submission'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Submission
              </button>
            </nav>
          </div>

          {activeTab === 'registration' ? (
            <GenerateRegistrationCertificates event={event} />
          ) : (
            <GenerateSubmissionCertificates event={event} />
          )}
        </>
      )}
    </div>
  );
};

export default GenerateCertificates;
