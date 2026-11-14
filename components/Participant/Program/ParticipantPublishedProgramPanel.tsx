import React, { useState } from 'react';
import { Calendar, Download, Eye, Loader2, MapPin } from 'lucide-react';
import type { Event, FormSubmission } from '../../../types';
import type { SavedProgram } from '../../../services/programService';
import { getParticipantPlanningSummaryLine } from '../../../services/participantProgramService';
import { downloadPublishedProgramAllDaysPng } from './participantProgramPngExport';
import ParticipantProgramPreviewModal from './ParticipantProgramPreviewModal';

interface ParticipantPublishedProgramPanelProps {
  event: Event;
  subsForEvent: FormSubmission[];
  publishedProgram: SavedProgram | null;
  programLoading: boolean;
}

/**
 * When an organizer has linked a saved program on the event, shows the participant’s slot (if any)
 * and a control to download the full program as PNG (one file per day).
 */
const ParticipantPublishedProgramPanel: React.FC<ParticipantPublishedProgramPanelProps> = ({
  event,
  subsForEvent,
  publishedProgram,
  programLoading,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  if (!event.publishedProgramId?.trim()) {
    return null;
  }

  const planningLine =
    publishedProgram && !programLoading
      ? getParticipantPlanningSummaryLine(event, subsForEvent, publishedProgram)
      : undefined;

  const handleDownloadPng = async () => {
    if (!publishedProgram) return;
    setDownloadError('');
    setDownloading(true);
    try {
      await downloadPublishedProgramAllDaysPng(publishedProgram);
    } catch (e: unknown) {
      console.error(e);
      setDownloadError(
        e instanceof Error ? e.message : 'Could not generate the program image. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Official program</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5">
            {programLoading
              ? 'Loading program…'
              : publishedProgram
                ? publishedProgram.title || 'Conference program'
                : 'Program could not be loaded'}
          </p>
        </div>
      </div>

      {programLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Fetching schedule…</span>
        </div>
      ) : publishedProgram ? (
        <>
          {planningLine ? (
            <div className="rounded-md border border-white/80 bg-white/90 px-3 py-2 text-sm text-slate-800">
              <p className="text-xs font-medium text-slate-500 mb-1">Your contribution</p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{planningLine}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Your paper is not yet placed on a program slot. If you believe this is an error, contact the
              organizer.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview program
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPng()}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? 'Preparing…' : 'Download full program (PNG)'}
            </button>
            <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              One image file per day ({Math.max(1, publishedProgram.config?.numDays ?? 1)} file
              {Math.max(1, publishedProgram.config?.numDays ?? 1) === 1 ? '' : 's'})
            </span>
          </div>

          {showPreview ? (
            <ParticipantProgramPreviewModal
              program={publishedProgram}
              onClose={() => setShowPreview(false)}
            />
          ) : null}

          {downloadError ? (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">{downloadError}</p>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
          The organizer has linked a program, but it could not be loaded. Try again later.
        </p>
      )}
    </div>
  );
};

export default ParticipantPublishedProgramPanel;
