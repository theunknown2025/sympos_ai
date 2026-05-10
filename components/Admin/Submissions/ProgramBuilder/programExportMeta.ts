import type { SavedProgram } from '../../../../services/programService';
import type { GenerateProgramPdfParams } from './generateProgramPDF';

export function formatDateRangeLabel(start?: string, end?: string): string | undefined {
  const s = start?.trim();
  const e = end?.trim();
  if (!s && !e) return undefined;
  const parse = (iso: string) => new Date(`${iso}T12:00:00`);
  if (s && e && s !== e) {
    const a = parse(s);
    const b = parse(e);
    const optsShort: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const optsYear: Intl.DateTimeFormatOptions = { ...optsShort, year: 'numeric' };
    return `${a.toLocaleDateString(undefined, optsShort)} – ${b.toLocaleDateString(undefined, optsYear)}`;
  }
  const d = parse(s || e!);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDayCalendarLabel(dateStart: string | undefined, dayIndex: number): string | undefined {
  if (!dateStart?.trim()) return undefined;
  const d = new Date(`${dateStart.trim()}T12:00:00`);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function generateTimeSlots(config: SavedProgram['config']): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);

    currentMin += config.timeSlotWidth;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }

  return slots;
}

function slugFileBase(title: string, dayIndex: number): string {
  const slug =
    title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 48) || 'program';
  return `${slug}-day-${dayIndex + 1}`;
}

export function buildProgramPdfParams(program: SavedProgram, dayIndex: number): GenerateProgramPdfParams {
  const timeSlots = generateTimeSlots(program.config);
  const dayCards = program.cards.filter((c) => c.dayIndex === dayIndex);
  const ds = program.config.display?.dateStart;
  const de = program.config.display?.dateEnd;

  return {
    cards: dayCards,
    venues: program.venues,
    timeSlots,
    config: program.config,
    selectedDay: dayIndex,
    programTitle: program.title.trim() || 'Program',
    programSubtitle: program.config.display?.subtitle,
    programDescription: program.description || '',
    dateRangeLabel: formatDateRangeLabel(ds, de),
    dayDateLabel: getDayCalendarLabel(ds, dayIndex),
    scheduleHoursLabel: `${program.config.startTime} – ${program.config.endTime}`,
    fileName: `${slugFileBase(program.title, dayIndex)}.pdf`,
  };
}
