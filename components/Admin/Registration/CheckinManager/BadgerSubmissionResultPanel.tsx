import React from 'react';
import { CheckCircle, AlertCircle, User, FileText, MapPin, ListChecks } from 'lucide-react';
import type { SubmissionBadgeVerification } from '../../../../services/submissionBadgeService';
import CheckinConfiguredFieldsPanel, {
  type CheckinConfiguredFieldRow,
} from './CheckinConfiguredFieldsPanel';

type ScanUiStatus = 'idle' | 'scanning' | 'error' | 'checking_in' | 'checked_in';

interface BadgerSubmissionResultPanelProps {
  scanStatus: ScanUiStatus;
  participantName: string;
  submissionTitle?: string;
  verification: SubmissionBadgeVerification | null;
  configuredFields?: CheckinConfiguredFieldRow[];
  onScanAnother: () => void;
  onClose: () => void;
}

const BadgerSubmissionResultPanel: React.FC<BadgerSubmissionResultPanelProps> = ({
  scanStatus,
  participantName,
  submissionTitle,
  verification,
  configuredFields = [],
  onScanAnother,
  onClose,
}) => {
  const verified = scanStatus === 'checked_in';

  return (
    <>
      <div
        className={`rounded-lg p-5 border ${
          verified ? 'bg-emerald-950/50 border-emerald-600/40' : 'bg-violet-900/30 border-violet-700/40'
        }`}
      >
        <PresenterHeader verified={verified} participantName={participantName} scanStatus={scanStatus} />
        {submissionTitle ? (
          <p className="text-sm text-slate-300 mt-3 flex items-start gap-2">
            <FileText size={16} className="text-violet-400 shrink-0 mt-0.5" />
            <span>
              <span className="text-slate-500 block text-xs uppercase tracking-wide">Paper</span>
              {submissionTitle}
            </span>
          </p>
        ) : null}
        {verification?.programSlotSummary ? (
          <p className="text-sm text-slate-300 mt-2 flex items-start gap-2">
            <MapPin size={16} className="text-violet-400 shrink-0 mt-0.5" />
            <span>
              <span className="text-slate-500 block text-xs uppercase tracking-wide">Program slot</span>
              {verification.programSlotSummary}
            </span>
          </p>
        ) : null}
      </div>

      {verified && configuredFields.length > 0 ? (
        <CheckinConfiguredFieldsPanel fields={configuredFields} variant="dark" />
      ) : null}

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ListChecks size={18} className="text-violet-400" />
          Verification checklist
        </h3>
        <ChecklistRow ok={verification?.pipelineComplete} label="Full submission pipeline complete" />
        <ChecklistRow ok={verification?.programComplete} label="Listed on published program" />
        <ChecklistRow ok={verified} label="Check-in recorded" />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onScanAnother}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
        >
          Scan another
        </button>
        {verified ? (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
          >
            Close
          </button>
        ) : null}
      </div>
    </>
  );
};

function PresenterHeader({
  verified,
  participantName,
  scanStatus,
}: {
  verified: boolean;
  participantName: string;
  scanStatus: ScanUiStatus;
}) {
  return (
    <div className="flex items-center gap-3">
      <User className="text-violet-300" size={22} />
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">Presenter</p>
        <p className="text-xl font-bold text-white">{participantName}</p>
        {verified ? (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-300">
            <CheckCircle size={14} />
            Verified presenter
          </span>
        ) : scanStatus === 'error' ? (
          <span className="text-xs text-red-300 mt-1 block">Not verified</span>
        ) : (
          <span className="text-xs text-amber-300 mt-1 block">Verifying…</span>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
      )}
      <span className={ok ? 'text-slate-200' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

export default BadgerSubmissionResultPanel;
