import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { Event, RegistrationForm } from '../../../types';
import { getEvent } from '../../../services/eventService';
import { getRegistrationForm } from '../../../services/registrationFormService';
import {
  buildEventCertificateFields,
  buildRegistrationCertificateFields,
  buildSubmissionCertificateFields,
  type CertificateInsertableField,
} from '../../../services/certificateTemplateFields';
import { useOrganizerScopedEventId } from '../../../contexts/OrganizerEventScopeContext';

type IncludeTab = 'event' | 'registration' | 'submission';

interface CertificateIncludeElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInclude: (field: CertificateInsertableField) => void;
}

const CertificateIncludeElementsModal: React.FC<CertificateIncludeElementsModalProps> = ({
  isOpen,
  onClose,
  onInclude,
}) => {
  const scopedEventId = useOrganizerScopedEventId();
  const [activeTab, setActiveTab] = useState<IncludeTab>('event');
  const [event, setEvent] = useState<Event | null>(null);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      if (!scopedEventId) {
        setEvent(null);
        setForms([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const eventData = await getEvent(scopedEventId);
        if (!eventData) {
          setError('Event not found');
          return;
        }
        setEvent(eventData);

        const formIds = [
          ...(eventData.registrationFormIds || []),
          ...(eventData.submissionFormIds || []),
          ...(eventData.abstractSubmissionFormIds || []),
        ];
        const uniqueIds = [...new Set(formIds)];
        const loaded = await Promise.all(uniqueIds.map((id) => getRegistrationForm(id)));
        setForms(loaded.filter((f): f is RegistrationForm => f !== null));
      } catch (err) {
        console.error(err);
        setError('Failed to load event fields');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isOpen, scopedEventId]);

  const eventFields = useMemo(
    () => (event ? buildEventCertificateFields(event) : []),
    [event]
  );
  const registrationFields = useMemo(
    () => (event ? buildRegistrationCertificateFields(event, forms) : []),
    [event, forms]
  );
  const submissionFields = useMemo(
    () => (event ? buildSubmissionCertificateFields(event, forms) : []),
    [event, forms]
  );

  const activeFields =
    activeTab === 'event'
      ? eventFields
      : activeTab === 'registration'
        ? registrationFields
        : submissionFields;

  const fieldsByCategory = useMemo(() => {
    const map: Record<string, CertificateInsertableField[]> = {};
    for (const field of activeFields) {
      if (!map[field.category]) map[field.category] = [];
      map[field.category].push(field);
    }
    return map;
  }, [activeFields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Include elements</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Add dynamic fields from the current event, registration, or submission forms.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-slate-200">
          <nav className="flex gap-1" aria-label="Include elements tabs">
            {(
              [
                ['event', 'Event'],
                ['registration', 'Registration'],
                ['submission', 'Submission'],
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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!scopedEventId ? (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-900 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>Select an event from the workspace header to load available fields.</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              <span>Loading fields…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : activeFields.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              {activeTab === 'event' && 'No event information available.'}
              {activeTab === 'registration' &&
                'No registration forms are linked to this event. Configure them in Event → Tools → Registration.'}
              {activeTab === 'submission' &&
                'No submission forms are linked to this event. Configure them in Event → Tools → Submission.'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryFields.map((field) => (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => {
                          onInclude(field);
                          onClose();
                        }}
                        className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <span className="block text-sm font-medium text-slate-900">{field.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 truncate">{field.previewText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateIncludeElementsModal;
