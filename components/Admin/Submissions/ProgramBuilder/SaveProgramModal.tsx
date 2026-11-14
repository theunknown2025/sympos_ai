import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { saveProgram } from '../../../../services/programService';
import { updateEvent } from '../../../../services/eventService';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

interface SaveProgramModalProps {
  onClose: () => void;
  /** Called with the new program id after a successful save. */
  onSave: (programId: string) => void;
  config: ProgramBuilderConfig;
  venues: Venue[];
  cards: ProgramCard[];
  userId: string;
  initialTitle?: string;
  initialDescription?: string;
  eventId?: string;
}

const SaveProgramModal: React.FC<SaveProgramModalProps> = ({
  onClose,
  onSave,
  config,
  venues,
  cards,
  userId,
  initialTitle = '',
  initialDescription = '',
  eventId,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishToParticipants, setPublishToParticipants] = useState(Boolean(eventId));

  // Update state when initial values change
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setPublishToParticipants(Boolean(eventId?.trim()));
  }, [initialTitle, initialDescription, eventId]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Program title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const programId = await saveProgram(
        userId,
        title.trim(),
        description.trim() || undefined,
        config,
        venues,
        cards,
        eventId
      );
      if (publishToParticipants && eventId?.trim()) {
        try {
          await updateEvent(eventId.trim(), { publishedProgramId: programId });
        } catch (pubErr: unknown) {
          const msg =
            pubErr instanceof Error
              ? pubErr.message
              : 'Program saved, but linking it on the event failed. Set Published program in Event management.';
          setError(msg);
          console.error('Error publishing program to event:', pubErr);
          return;
        }
      }
      onSave(programId);
    } catch (err: any) {
      setError(err.message || 'Failed to save program');
      console.error('Error saving program:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Save Program</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Program Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conference Program 2024"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this program..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {eventId?.trim() ? (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={publishToParticipants}
                onChange={(e) => setPublishToParticipants(e.target.checked)}
              />
              <span className="text-sm text-slate-700">
                <span className="font-medium">Publish to participants</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Links this program on the event so authors can see their slot and download the schedule as PNG.
                </span>
              </span>
            </label>
          ) : null}

          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            <div className="flex justify-between mb-2">
              <span>Venues:</span>
              <span className="font-semibold">{venues.length}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Sessions:</span>
              <span className="font-semibold">{cards.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Range:</span>
              <span className="font-semibold">{config.startTime} - {config.endTime}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Program
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveProgramModal;

