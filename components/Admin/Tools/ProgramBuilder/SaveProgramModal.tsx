import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { saveProgram } from '../../../../services/programService';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

interface SaveProgramModalProps {
  onClose: () => void;
  onSave: () => void;
  config: ProgramBuilderConfig;
  venues: Venue[];
  cards: ProgramCard[];
  userId: string;
  initialTitle?: string;
  initialDescription?: string;
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
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when initial values change
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
  }, [initialTitle, initialDescription]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Program title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveProgram(userId, title.trim(), description.trim() || undefined, config, venues, cards);
      onSave();
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

