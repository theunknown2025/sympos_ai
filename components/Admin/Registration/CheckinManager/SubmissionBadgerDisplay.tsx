import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Info,
  FileText,
  ListChecks,
  MapPin,
} from 'lucide-react';
import { getBadgeByImageUrl } from '../../../../services/badgeGeneratorService';
import { setCheckinStatus } from '../../../../services/checkinService';
import { getEvent } from '../../../../services/eventService';
import { getProgramById } from '../../../../services/programService';
import {
  getSubmissionDisplayTitle,
  verifySubmissionBadgeForCheckin,
  type SubmissionBadgeVerification,
} from '../../../../services/submissionBadgeService';
import { useAuth } from '../../../../hooks/useAuth';
import type { Event, RegistrationForm } from '../../../../types';
import { useBadgeQrScanner, type BadgeQrScanStatus } from './shared/useBadgeQrScanner';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import { resolveCheckinDisplayFields } from '../../../../services/checkinDisplayFields';
import CheckinConfiguredFieldsPanel from './CheckinConfiguredFieldsPanel';

interface SubmissionBadgerDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  eventName?: string;
}

const SubmissionBadgerDisplay: React.FC<SubmissionBadgerDisplayProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName: propEventName,
}) => {
  const { currentUser } = useAuth();
  const [scanStatus, setScanStatus] = useState<BadgeQrScanStatus>('idle');
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState(propEventName || '');
  const [eventData, setEventData] = useState<Event | null>(null);
  const [verification, setVerification] = useState<SubmissionBadgeVerification | null>(null);
  const [eventForms, setEventForms] = useState<RegistrationForm[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !eventId) return;
    void getEvent(eventId).then(async (ev) => {
      if (!ev) return;
      setEventData(ev);
      setEventName(ev.name);
      const formIds = [
        ...(ev.submissionFormIds || []),
        ...(ev.abstractSubmissionFormIds || []),
      ];
      const uniqueIds = [...new Set(formIds)];
      if (uniqueIds.length === 0) {
        setEventForms([]);
        return;
      }
      const loaded = await Promise.all(uniqueIds.map((id) => getRegistrationForm(id)));
      setEventForms(loaded.filter((f): f is RegistrationForm => f !== null));
    });
  }, [isOpen, eventId]);

  const configuredDisplayFields = useMemo(() => {
    if (!eventData || !verification?.articleSubmission) return [];
    return resolveCheckinDisplayFields(
      eventData,
      eventForms,
      verification.articleSubmission,
      'submission'
    );
  }, [eventData, eventForms, verification?.articleSubmission]);

  const { videoRef, resetProcessed } = useBadgeQrScanner({
    isActive: isOpen,
    onCameraError: (msg) => {
      setError(msg);
      setScanStatus('error');
    },
    onScan: async (text) => {
      if (!eventId || !eventData) {
        setError('Select an event before scanning submission badges.');
        setScanStatus('error');
        resetProcessed();
        return;
      }
      if (!text.startsWith('http')) {
        setError('QR code does not contain a valid URL.');
        setScanStatus('error');
        resetProcessed();
        return;
      }
      if (!currentUser?.id) {
        setError('You must be logged in to verify check-in.');
        setScanStatus('error');
        resetProcessed();
        return;
      }

      try {
        setScanStatus('scanning');
        setError('');

        const badge = await getBadgeByImageUrl(text);
        if (!badge) throw new Error('No badge found for this QR code.');

        let publishedProgram = null;
        if (eventData.publishedProgramId) {
          publishedProgram = await getProgramById(eventData.publishedProgramId);
        }

        const result = await verifySubmissionBadgeForCheckin(badge, eventData, publishedProgram);
        setVerification(result);

        if (!result.valid) {
          throw new Error(result.error || 'Badge verification failed.');
        }

        setScanStatus('processing');
        await setCheckinStatus(
          currentUser.id,
          badge.eventId,
          badge.formSubmissionId,
          'done',
          currentUser.id,
          undefined,
          null,
          'All Days'
        );
        setScanStatus('success');
      } catch (err: unknown) {
        resetProcessed();
        setError(err instanceof Error ? err.message : 'Failed to process badge.');
        setScanStatus('error');
      }
    },
  });

  const resetState = useCallback(() => {
    setScanStatus('idle');
    setError('');
    setVerification(null);
    resetProcessed();
  }, [resetProcessed]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  const participantName =
    verification?.badge?.participantName ||
    verification?.articleSubmission?.generalInfo?.name ||
    '';
  const submissionTitle = verification?.articleSubmission
    ? getSubmissionDisplayTitle(verification.articleSubmission)
    : undefined;
  const verified = scanStatus === 'success';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900 flex flex-col"
    >
      <header className="bg-slate-900/95 border-b border-violet-800/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="text-violet-400" size={28} />
            {eventName || 'Submission presenter badger'}
          </h1>
          <p className="text-sm text-violet-200/80 mt-1">
            Verify presenters who completed the full submission program
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden min-h-0">
        <ScannerColumn
          videoRef={videoRef}
          scanStatus={scanStatus}
          error={error}
        />
        <VerificationColumn
          eventName={eventName}
          participantName={participantName}
          submissionTitle={submissionTitle}
          programSlot={verification?.programSlotSummary}
          pipelineComplete={verification?.pipelineComplete}
          programComplete={verification?.programComplete}
          configuredFields={configuredDisplayFields}
          verified={verified}
          scanStatus={scanStatus}
          onScanAnother={resetState}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

function ScannerColumn({
  videoRef,
  scanStatus,
  error,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  scanStatus: BadgeQrScanStatus;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="bg-violet-500/10 border border-violet-500/25 rounded-lg p-4">
        <PresenterScanInfo />
      </div>
      <div className="flex-1 min-h-[200px] rounded-lg overflow-hidden border-2 border-violet-700/60 bg-black relative">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        {(scanStatus === 'scanning' || scanStatus === 'processing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="animate-spin text-violet-300" size={32} />
          </div>
        )}
      </div>
      <ScanStatusBar scanStatus={scanStatus} error={error} />
    </div>
  );
}

function PresenterScanInfo() {
  return (
    <div className="flex items-start gap-3">
      <Info className="text-violet-400 shrink-0 mt-0.5" size={20} />
      <div>
        <h3 className="text-sm font-semibold text-violet-200 mb-2">Presenter verification</h3>
        <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
          <li>Scan the presenter&apos;s submission badge QR code</li>
          <li>Confirm pipeline and program placement</li>
          <li>Record check-in for the article submission</li>
        </ol>
      </div>
    </div>
  );
}

function ScanStatusBar({ scanStatus, error }: { scanStatus: BadgeQrScanStatus; error: string }) {
  return (
    <div className="rounded-lg p-4 border border-slate-700 bg-slate-800/50 flex items-center gap-3">
      {scanStatus === 'success' ? (
        <CheckCircle className="text-green-400" size={24} />
      ) : scanStatus === 'error' ? (
        <AlertCircle className="text-red-400" size={24} />
      ) : scanStatus === 'processing' || scanStatus === 'scanning' ? (
        <Loader2 className="text-violet-400 animate-spin" size={24} />
      ) : (
        <Camera className="text-slate-400" size={24} />
      )}
      <p className="text-sm text-white flex-1">
        {scanStatus === 'idle' && 'Ready — point camera at presenter badge'}
        {scanStatus === 'scanning' && 'Reading QR code…'}
        {scanStatus === 'processing' && 'Verifying submission & recording check-in…'}
        {scanStatus === 'success' && 'Presenter verified and checked in'}
        {scanStatus === 'error' && (error || 'Scan failed')}
      </p>
    </div>
  );
}

function VerificationColumn({
  eventName,
  participantName,
  submissionTitle,
  programSlot,
  pipelineComplete,
  programComplete,
  configuredFields = [],
  verified,
  scanStatus,
  onScanAnother,
  onClose,
}: {
  eventName: string;
  participantName: string;
  submissionTitle?: string;
  programSlot?: string;
  pipelineComplete?: boolean;
  programComplete?: boolean;
  configuredFields?: Array<{ key: string; label: string; value: string }>;
  verified: boolean;
  scanStatus: BadgeQrScanStatus;
  onScanAnother: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
      {eventName ? (
        <div className="rounded-lg border border-violet-800/40 bg-violet-950/40 p-4 flex items-center gap-3">
          <Calendar className="text-violet-400" size={20} />
          <div>
            <p className="text-xs text-violet-300/80 uppercase tracking-wide">Event</p>
            <p className="text-lg font-semibold text-white">{eventName}</p>
          </div>
        </div>
      ) : null}

      {participantName ? (
        <>
          <div
            className={`rounded-lg p-5 border ${
              verified
                ? 'bg-emerald-950/50 border-emerald-600/40'
                : 'bg-violet-900/30 border-violet-700/40'
            }`}
          >
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
            {submissionTitle ? (
              <p className="text-sm text-slate-300 mt-3 flex items-start gap-2">
                <FileText size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <span>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Paper</span>
                  {submissionTitle}
                </span>
              </p>
            ) : null}
            {programSlot ? (
              <p className="text-sm text-slate-300 mt-2 flex items-start gap-2">
                <MapPin size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <span>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Program slot</span>
                  {programSlot}
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
            <ChecklistRow ok={pipelineComplete} label="Full submission pipeline complete" />
            <ChecklistRow ok={programComplete} label="Listed on published program" />
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
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-violet-800/50 bg-slate-800/20 p-8">
          <div className="text-center">
            <Camera className="mx-auto text-slate-500 mb-3" size={40} />
            <h3 className="text-lg font-semibold text-slate-300">Waiting for scan</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              Scan a presenter submission badge to verify program completion and check in.
            </p>
          </div>
        </div>
      )}
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

export default SubmissionBadgerDisplay;


