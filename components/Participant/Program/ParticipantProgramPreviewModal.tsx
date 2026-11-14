import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { SavedProgram } from '../../../services/programService';
import ProgramFinalLayout from '../../Admin/Submissions/ProgramBuilder/ProgramFinalLayout';
import { getDayCalendarLabel, getProgramDayViewProps } from '../../Admin/Submissions/ProgramBuilder/programExportMeta';

interface ParticipantProgramPreviewModalProps {
  program: SavedProgram;
  onClose: () => void;
}

const ParticipantProgramPreviewModal: React.FC<ParticipantProgramPreviewModalProps> = ({
  program,
  onClose,
}) => {
  const numDays = Math.max(1, program.config?.numDays ?? 1);
  const [selectedDay, setSelectedDay] = useState(0);

  const viewProps = useMemo(
    () => getProgramDayViewProps(program, selectedDay),
    [program, selectedDay]
  );

  const dateStart = program.config.display?.dateStart;
  const dayTabs = useMemo(() => {
    return Array.from({ length: numDays }, (_, index) => {
      const calendar = getDayCalendarLabel(dateStart, index);
      return {
        index,
        label: calendar ?? `Day ${index + 1}`,
        shortLabel: `Day ${index + 1}`,
      };
    });
  }, [numDays, dateStart]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-program-preview-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="participant-program-preview-title"
              className="truncate text-lg font-bold text-slate-900 sm:text-xl"
            >
              {program.title.trim() || 'Conference program'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Full schedule — browse by day</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        {numDays > 1 ? (
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
                disabled={selectedDay === 0}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-2">
                {dayTabs.map((tab) => (
                  <button
                    key={tab.index}
                    type="button"
                    onClick={() => setSelectedDay(tab.index)}
                    className={`max-w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      selectedDay === tab.index
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                    title={tab.label}
                  >
                    <span className="block sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden truncate sm:block">{tab.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSelectedDay((d) => Math.min(numDays - 1, d + 1))}
                disabled={selectedDay >= numDays - 1}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-200/60 px-3 py-4 sm:px-6 sm:py-6">
          <ProgramFinalLayout
            title={viewProps.title}
            subtitle={viewProps.subtitle}
            description={viewProps.description}
            dateRangeLabel={viewProps.dateRangeLabel}
            selectedDay={viewProps.selectedDay}
            numDays={viewProps.numDays}
            dayDateLabel={viewProps.dayDateLabel}
            scheduleHoursLabel={viewProps.scheduleHoursLabel}
            venues={viewProps.venues}
            timeSlots={viewProps.timeSlots}
            cards={viewProps.cards}
            config={viewProps.config}
            className="pb-2"
          />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantProgramPreviewModal;
