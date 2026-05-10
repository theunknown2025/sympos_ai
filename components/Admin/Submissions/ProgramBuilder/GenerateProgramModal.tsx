import React from 'react';
import { X, FileImage, FileText } from 'lucide-react';
import { generateProgramPNG } from './generateProgramPNG';
import { generateProgramPDF } from './generateProgramPDF';
import ProgramFinalLayout from './ProgramFinalLayout';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

const EXPORT_ROOT_ID = 'program-export-root';

interface GenerateProgramModalProps {
  onClose: () => void;
  cards: ProgramCard[];
  venues: Venue[];
  timeSlots: string[];
  config: ProgramBuilderConfig;
  selectedDay: number;
  programTitle: string;
  programSubtitle?: string;
  programDescription: string;
  dateRangeLabel?: string;
  dayDateLabel?: string;
  scheduleHoursLabel: string;
}

const GenerateProgramModal: React.FC<GenerateProgramModalProps> = ({
  onClose,
  cards,
  venues,
  timeSlots,
  config,
  selectedDay,
  programTitle,
  programSubtitle,
  programDescription,
  dateRangeLabel,
  dayDateLabel,
  scheduleHoursLabel,
}) => {
  const baseFileName = () => {
    const slug = programTitle
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 48) || 'program';
    return `${slug}-day-${selectedDay + 1}`;
  };

  const handleGeneratePNG = async () => {
    try {
      const el = document.getElementById(EXPORT_ROOT_ID);
      if (!el) {
        alert('Preview is not ready. Please try again.');
        return;
      }
      await generateProgramPNG(el, `${baseFileName()}.png`);
      onClose();
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to generate PNG. Please try again.');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      await generateProgramPDF({
        cards,
        venues,
        timeSlots,
        config,
        selectedDay,
        programTitle,
        programSubtitle,
        programDescription,
        dateRangeLabel,
        dayDateLabel,
        scheduleHoursLabel,
        fileName: `${baseFileName()}.pdf`,
      });
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Preview & export</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Review the final layout, then download as PNG or PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={previewWrapRef}
          className="min-h-0 flex-1 overflow-y-auto bg-slate-200/60 px-4 py-6 md:px-8"
        >
          <ProgramFinalLayout
            id={EXPORT_ROOT_ID}
            title={programTitle}
            subtitle={programSubtitle}
            description={programDescription}
            dateRangeLabel={dateRangeLabel}
            selectedDay={selectedDay}
            numDays={config.numDays}
            dayDateLabel={dayDateLabel}
            scheduleHoursLabel={scheduleHoursLabel}
            venues={venues}
            timeSlots={timeSlots}
            cards={cards}
            config={config}
            className="pb-4"
          />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="mb-4 text-center text-sm text-slate-600">Export format</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleGeneratePNG}
              className="flex flex-1 items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 transition-all hover:border-indigo-400 hover:bg-indigo-50/80 sm:max-w-xs"
            >
              <div className="rounded-full bg-indigo-100 p-3">
                <FileImage size={26} className="text-indigo-600" />
              </div>
              <div className="text-left">
                <span className="block font-semibold text-slate-900">PNG</span>
                <span className="text-xs text-slate-500">Matches preview</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleGeneratePDF}
              className="flex flex-1 items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 transition-all hover:border-rose-400 hover:bg-rose-50/80 sm:max-w-xs"
            >
              <div className="rounded-full bg-rose-100 p-3">
                <FileText size={26} className="text-rose-600" />
              </div>
              <div className="text-left">
                <span className="block font-semibold text-slate-900">PDF</span>
                <span className="text-xs text-slate-500">Print-ready A4 landscape</span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200/80"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramModal;
