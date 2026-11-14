import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  KeyRound,
  Plus,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ParticipantDraft } from './types';
import {
  createEmptyParticipantDraft,
  generateStrongPassword,
  validateParticipantDraft,
} from './participantAccountUtils';
import {
  bulkRowsToDrafts,
  parseParticipantBulkFile,
} from './participantBulkUploadUtils';
import ParticipantBulkUploadPanel from './ParticipantBulkUploadPanel';

interface AccountManagerAddStepProps {
  drafts: ParticipantDraft[];
  onChange: (drafts: ParticipantDraft[]) => void;
  onContinue: () => void;
  error: string;
  onError: (message: string) => void;
}

const MAX_FORMS = 15;

const AccountManagerAddStep: React.FC<AccountManagerAddStepProps> = ({
  drafts,
  onChange,
  onContinue,
  error,
  onError,
}) => {
  const gearRef = useRef<HTMLDivElement>(null);
  const [addCount, setAddCount] = useState(1);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setShowGearMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateDraft = (id: string, patch: Partial<ParticipantDraft>) => {
    onChange(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeDraft = (id: string) => {
    if (drafts.length <= 1) return;
    onChange(drafts.filter((d) => d.id !== id));
  };

  const handleAddMore = () => {
    const count = Math.min(Math.max(1, addCount), MAX_FORMS);
    const available = MAX_FORMS - drafts.length;
    if (available <= 0) {
      onError(`Maximum ${MAX_FORMS} participants per batch.`);
      return;
    }
    const toAdd = Math.min(count, available);
    const newDrafts = Array.from({ length: toAdd }, () => createEmptyParticipantDraft());
    onChange([...drafts, ...newDrafts]);
    onError('');
  };

  const handleBulkFile = async (file: File) => {
    setBulkError('');
    try {
      const parsed = await parseParticipantBulkFile(file);
      const newDrafts = bulkRowsToDrafts(parsed.rows);
      const combined = [...drafts.filter((d) => d.fullName || d.email), ...newDrafts].slice(
        0,
        MAX_FORMS
      );
      if (combined.length === 0) {
        onChange([createEmptyParticipantDraft()]);
      } else {
        onChange(combined);
      }
      setBulkFileName(parsed.fileName);
      setShowBulkUpload(true);
      onError('');
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleContinue = () => {
    onError('');
    const emails = drafts.map((d) => d.email.trim().toLowerCase()).filter(Boolean);
    for (const draft of drafts) {
      const validationError = validateParticipantDraft(draft, emails);
      if (validationError) {
        onError(`${draft.fullName || draft.email || 'Participant'}: ${validationError}`);
        return;
      }
    }
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Step 1 — Add participants</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter details manually or upload a CSV from Excel (full name, email).
          </p>
        </div>
        <div className="relative" ref={gearRef}>
          <button
            type="button"
            onClick={() => setShowGearMenu((v) => !v)}
            className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
            title="Bulk upload"
          >
            <Settings size={18} />
          </button>
          {showGearMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              <button
                type="button"
                onClick={() => {
                  setShowGearMenu(false);
                  setShowBulkUpload(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Upload size={16} />
                Upload bulk (Excel/CSV)
              </button>
            </div>
          )}
        </div>
      </div>

      {showBulkUpload && (
        <ParticipantBulkUploadPanel
          fileName={bulkFileName}
          participantCount={drafts.length}
          error={bulkError}
          onFile={handleBulkFile}
          onClose={() => {
            setShowBulkUpload(false);
            setBulkFileName('');
            setBulkError('');
          }}
        />
      )}

      <div className="space-y-4">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Participant {index + 1}</span>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDraft(draft.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => updateDraft(draft.id, { fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => updateDraft(draft.id, { email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.password}
                    onChange={(e) =>
                      updateDraft(draft.id, {
                        password: e.target.value,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateStrongPassword();
                      updateDraft(draft.id, { password: pwd, confirmPassword: pwd });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-indigo-700"
                    title="Generate strong password"
                  >
                    <KeyRound size={14} />
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Confirm password
                </label>
                <input
                  type="text"
                  value={draft.confirmPassword}
                  onChange={(e) => updateDraft(draft.id, { confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Add more</label>
          <input
            type="number"
            min={1}
            max={MAX_FORMS}
            value={addCount}
            onChange={(e) => setAddCount(Number(e.target.value) || 1)}
            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
          />
          <button
            type="button"
            onClick={handleAddMore}
            disabled={drafts.length >= MAX_FORMS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
          >
            <Plus size={16} />
            Add forms
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {drafts.length} / {MAX_FORMS} max
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          Continue to Validate
        </button>
      </div>
    </div>
  );
};

export default AccountManagerAddStep;
