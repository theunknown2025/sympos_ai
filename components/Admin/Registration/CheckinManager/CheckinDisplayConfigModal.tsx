import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckSquare, Loader2, Save, Square, X } from 'lucide-react';
import type { Event, RegistrationForm } from '../../../../types';
import { getEvent, updateEvent } from '../../../../services/eventService';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import { buildCheckinSelectableFields, type CheckinDisplayKind } from '../../../../services/checkinDisplayFields';

interface CheckinDisplayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  kind: CheckinDisplayKind;
  onSaved?: (event: Event) => void;
}

const MODAL_TITLES: Record<CheckinDisplayKind, string> = {
  registration: 'Configure check-in Registration',
  submission: 'Configure check-in Submission',
};

const CheckinDisplayConfigModal: React.FC<CheckinDisplayConfigModalProps> = ({
  isOpen,
  onClose,
  eventId,
  kind,
  onSaved,
}) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      if (!eventId) {
        setEvent(null);
        setForms([]);
        setSelectedKeys(new Set());
        return;
      }

      try {
        setLoading(true);
        setError('');
        const eventData = await getEvent(eventId);
        if (!eventData) {
          setError('Event not found');
          return;
        }
        setEvent(eventData);

        const formIds =
          kind === 'registration'
            ? eventData.registrationFormIds || []
            : [
                ...(eventData.submissionFormIds || []),
                ...(eventData.abstractSubmissionFormIds || []),
              ];
        const uniqueIds = [...new Set(formIds)];
        const loaded = await Promise.all(uniqueIds.map((id) => getRegistrationForm(id)));
        setForms(loaded.filter((f): f is RegistrationForm => f !== null));

        const existingKeys =
          kind === 'registration'
            ? eventData.registrationCheckinDisplayFieldKeys || []
            : eventData.submissionCheckinDisplayFieldKeys || [];
        setSelectedKeys(new Set(existingKeys));
      } catch (err) {
        console.error(err);
        setError('Failed to load form fields');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isOpen, eventId, kind]);

  const selectableFields = useMemo(
    () => (event ? buildCheckinSelectableFields(event, forms, kind) : []),
    [event, forms, kind]
  );

  const fieldsByCategory = useMemo(() => {
    const map: Record<string, typeof selectableFields> = {};
    for (const field of selectableFields) {
      if (!map[field.category]) map[field.category] = [];
      map[field.category].push(field);
    }
    return map;
  }, [selectableFields]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!eventId || !event) return;

    try {
      setSaving(true);
      setError('');
      const keys = selectableFields
        .map((f) => f.key)
        .filter((key) => selectedKeys.has(key));

      const patch =
        kind === 'registration'
          ? { registrationCheckinDisplayFieldKeys: keys }
          : { submissionCheckinDisplayFieldKeys: keys };

      await updateEvent(eventId, patch);
      const updated = { ...event, ...patch };
      setEvent(updated);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save check-in configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{MODAL_TITLES[kind]}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Choose which form fields to show during check-in and on the badger screen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!eventId ? (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-900 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>Select an event first to configure check-in display fields.</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              <span>Loading form fields…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : selectableFields.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              {kind === 'registration'
                ? 'No registration forms are linked to this event.'
                : 'No submission forms are linked to this event.'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryFields.map((field) => {
                      const checked = selectedKeys.has(field.key);
                      return (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => toggleKey(field.key)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-start gap-3 ${
                            checked
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square size={18} className="text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-900">{field.label}</span>
                            <span className="block text-xs text-slate-500 mt-0.5 truncate">
                              {field.previewText}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!eventId || loading || saving || selectableFields.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckinDisplayConfigModal;
