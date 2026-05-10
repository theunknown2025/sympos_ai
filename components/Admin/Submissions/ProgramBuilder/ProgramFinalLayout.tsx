import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

export interface ProgramFinalLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  /** e.g. "June 3–5, 2026" */
  dateRangeLabel?: string;
  selectedDay: number;
  numDays: number;
  /** e.g. "Monday, June 3, 2026" for this day */
  dayDateLabel?: string;
  /** Daily schedule window, e.g. "09:00 – 18:00" */
  scheduleHoursLabel: string;
  venues: Venue[];
  timeSlots: string[];
  cards: ProgramCard[];
  config: ProgramBuilderConfig;
  /** Set by parent for export root (html2canvas) */
  className?: string;
  id?: string;
}

const timeToRow = (time: string, cfg: ProgramBuilderConfig): number => {
  const [hour, min] = time.split(':').map(Number);
  const [startHour, startMin] = cfg.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const timeMinutes = hour * 60 + min;
  const diffMinutes = timeMinutes - startMinutes;
  const slotIndex = Math.floor(diffMinutes / cfg.timeSlotWidth);
  return slotIndex + 2;
};

const calculateDuration = (startTime: string, endTime: string, cfg: ProgramBuilderConfig): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const diffMinutes = endMinutes - startMinutes;
  return Math.ceil(diffMinutes / cfg.timeSlotWidth);
};

/**
 * Polished read-only program document for preview and PNG export.
 */
const ProgramFinalLayout: React.FC<ProgramFinalLayoutProps> = ({
  title,
  subtitle,
  description,
  dateRangeLabel,
  selectedDay,
  numDays,
  dayDateLabel,
  scheduleHoursLabel,
  venues,
  timeSlots,
  cards,
  config,
  className = '',
  id,
}) => {
  const dayTitle =
    numDays > 1
      ? `Day ${selectedDay + 1} of ${numDays}${dayDateLabel ? ` · ${dayDateLabel}` : ''}`
      : dayDateLabel || 'Program';

  return (
    <div
      id={id}
      className={`bg-[#f8fafc] text-slate-900 ${className}`}
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1100px] rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.12)] overflow-hidden">
        {/* Hero */}
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-10 py-11 text-white">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
            aria-hidden
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90">
            Conference program
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {title.trim() || 'Untitled program'}
          </h1>
          {subtitle?.trim() ? (
            <p className="mt-3 max-w-3xl text-lg font-medium text-slate-300/95">{subtitle.trim()}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {dateRangeLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm">
                <Calendar className="h-4 w-4 shrink-0 text-indigo-200" strokeWidth={2} />
                {dateRangeLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm">
              <Clock className="h-4 w-4 shrink-0 text-indigo-200" strokeWidth={2} />
              {scheduleHoursLabel}
            </span>
          </div>

          {description?.trim() ? (
            <p className="mt-8 max-w-3xl border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-300">
              {description.trim()}
            </p>
          ) : null}
        </header>

        {/* Day strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-8 py-3.5">
          <span className="text-sm font-semibold text-slate-800">{dayTitle}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {venues.length} {venues.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {/* Grid */}
        <div className="p-8 pb-10">
          <div
            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50"
            style={{
              display: 'grid',
              gridTemplateColumns: `112px repeat(${venues.length}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(44px, auto))`,
              gap: '1px',
            }}
          >
            <div
              className="flex items-center bg-slate-100 px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"
              style={{ gridRow: 1, gridColumn: 1 }}
            >
              Time
            </div>
            {venues.map((venue, index) => (
              <div
                key={venue.id}
                className="flex items-center justify-center gap-1.5 bg-slate-100 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
                style={{ gridRow: 1, gridColumn: index + 2 }}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
                <span className="line-clamp-2">{venue.name}</span>
              </div>
            ))}

            {timeSlots.map((time, rowIndex) => {
              const cellRow = rowIndex + 2;
              return (
                <React.Fragment key={time}>
                  <div
                    className="flex items-center bg-white px-3 py-2 font-mono text-xs font-medium tabular-nums text-slate-600"
                    style={{ gridRow: cellRow, gridColumn: 1 }}
                  >
                    {time}
                  </div>
                  {venues.map((venue, colIndex) => (
                    <div
                      key={`${time}-${venue.id}`}
                      className="bg-white"
                      style={{ gridRow: cellRow, gridColumn: colIndex + 2 }}
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {cards.map((card) => {
              const rowStart = timeToRow(card.startTime, config);
              const rowSpan = calculateDuration(card.startTime, card.endTime, config);
              const colStart = Math.max(2, card.colStart);
              const colEnd = colStart + Math.max(1, card.colSpan);
              const startVenueIndex = colStart - 2;
              const endVenueIndex = Math.min(startVenueIndex + card.colSpan - 1, venues.length - 1);
              const spannedVenues = venues.slice(startVenueIndex, endVenueIndex + 1);
              const venueNames = spannedVenues.map((v) => v.name).join(' · ');

              return (
                <div
                  key={card.id}
                  style={{
                    gridRowStart: rowStart,
                    gridRowEnd: rowStart + rowSpan,
                    gridColumnStart: colStart,
                    gridColumnEnd: colEnd,
                    borderLeftColor: card.color,
                  }}
                  className="z-[1] m-1.5 flex min-h-0 flex-col rounded-xl border border-slate-200/90 border-l-[4px] bg-white p-3.5 shadow-sm"
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-1">
                    <h3 className="text-sm font-bold leading-snug text-slate-900">{card.title}</h3>
                    <p className="text-xs font-medium tabular-nums text-slate-500">
                      {card.startTime} – {card.endTime}
                    </p>
                    <p className="flex items-start gap-1 text-xs text-slate-600">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
                      <span className="leading-snug">{venueNames}</span>
                    </p>
                    {card.description ? (
                      <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-slate-600">{card.description}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramFinalLayout;
