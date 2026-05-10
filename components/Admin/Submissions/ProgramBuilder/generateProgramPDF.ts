import jsPDF from 'jspdf';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

export interface GenerateProgramPdfParams {
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
  fileName: string;
}

const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_100: [number, number, number] = [241, 245, 249];
const SLATE_50: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const INDIGO_400: [number, number, number] = [129, 140, 248];

export async function generateProgramPDF(params: GenerateProgramPdfParams): Promise<void> {
  const {
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
    fileName,
  } = params;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 297;
  const pageH = 210;
  const margin = 11;

  const timeToRow = (time: string): number => {
    const [hour, min] = time.split(':').map(Number);
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const timeMinutes = hour * 60 + min;
    const diffMinutes = timeMinutes - startMinutes;
    const slotIndex = Math.floor(diffMinutes / config.timeSlotWidth);
    return slotIndex + 2;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return Math.ceil(diffMinutes / config.timeSlotWidth);
  };

  // —— Hero header ——
  let y = margin;
  const heroH = 42;
  doc.setFillColor(...SLATE_900);
  doc.rect(0, 0, pageW, heroH + margin - 2, 'F');

  doc.setTextColor(...INDIGO_400);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFERENCE PROGRAM', margin, y + 6);

  doc.setTextColor(...WHITE);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(programTitle || 'Program', pageW - margin * 2 - 40);
  doc.text(titleLines, margin, y + 14);

  let lineY = y + 14 + titleLines.length * 6.5;
  if (programSubtitle?.trim()) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const subLines = doc.splitTextToSize(programSubtitle.trim(), pageW - margin * 2 - 40);
    doc.text(subLines, margin, lineY + 4);
    lineY += 4 + subLines.length * 4.5;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  const metaParts: string[] = [];
  if (dateRangeLabel) metaParts.push(dateRangeLabel);
  metaParts.push(scheduleHoursLabel);
  doc.text(metaParts.join('   ·   '), margin, Math.max(lineY + 6, y + 32));

  if (programDescription?.trim()) {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const descLines = doc.splitTextToSize(programDescription.trim(), pageW - margin * 2);
    const descY = Math.min(y + 38, heroH - 2);
    doc.text(descLines.slice(0, 3), margin, descY);
  }

  // —— Day strip ——
  y = heroH + margin - 2;
  const stripH = 7;
  doc.setFillColor(...SLATE_100);
  doc.rect(margin, y, pageW - margin * 2, stripH, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.line(margin, y + stripH, pageW - margin, y + stripH);

  const dayLeft =
    config.numDays > 1
      ? `Day ${selectedDay + 1} of ${config.numDays}${dayDateLabel ? ` · ${dayDateLabel}` : ''}`
      : dayDateLabel || 'Program';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text(dayLeft, margin + 2, y + stripH / 2 + 2.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(
    `${venues.length} ${venues.length === 1 ? 'track' : 'tracks'}`,
    pageW - margin - 2,
    y + stripH / 2 + 2.2,
    { align: 'right' }
  );

  // —— Grid ——
  const startY = y + stripH + 4;
  const rowHeight = 5.2;
  const timeColW = 22;
  const gridBottom = pageH - margin;
  const availW = pageW - margin * 2 - timeColW;
  const venueColW = availW / Math.max(venues.length, 1);
  const headerRowH = 7;
  const maxRows = timeSlots.length;
  const gridH = Math.min(gridBottom - startY, maxRows * rowHeight + headerRowH);

  doc.setFillColor(...SLATE_50);
  doc.roundedRect(margin, startY, pageW - margin * 2, gridH, 1.2, 1.2, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.roundedRect(margin, startY, pageW - margin * 2, gridH, 1.2, 1.2);

  const headerY = startY;
  doc.setFillColor(...SLATE_100);
  doc.rect(margin, headerY, timeColW, headerRowH, 'F');
  doc.setDrawColor(...SLATE_200);
  doc.rect(margin, headerY, timeColW, headerRowH);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE_700);
  doc.text('TIME', margin + timeColW / 2, headerY + headerRowH / 2 + 1.5, { align: 'center' });

  venues.forEach((venue, index) => {
    const x = margin + timeColW + index * venueColW;
    doc.setFillColor(...SLATE_100);
    doc.rect(x, headerY, venueColW, headerRowH, 'F');
    doc.setDrawColor(...SLATE_200);
    doc.rect(x, headerY, venueColW, headerRowH);
    doc.setFontSize(7);
    doc.text(venue.name, x + venueColW / 2, headerY + headerRowH / 2 + 1.5, {
      align: 'center',
      maxWidth: venueColW - 2,
    });
  });

  const bodyTop = headerY + headerRowH;
  timeSlots.forEach((time, rowIndex) => {
    const rowY = bodyTop + rowIndex * rowHeight;
    doc.setFillColor(...WHITE);
    doc.rect(margin, rowY, timeColW, rowHeight, 'F');
    doc.setDrawColor(...SLATE_200);
    doc.rect(margin, rowY, timeColW, rowHeight);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_700);
    doc.text(time, margin + timeColW / 2, rowY + rowHeight / 2 + 1.2, { align: 'center' });

    venues.forEach((_, colIndex) => {
      const x = margin + timeColW + colIndex * venueColW;
      doc.setFillColor(...WHITE);
      doc.rect(x, rowY, venueColW, rowHeight, 'F');
      doc.setDrawColor(...SLATE_200);
      doc.rect(x, rowY, venueColW, rowHeight);
    });
  });

  // Session blocks
  cards.forEach((card) => {
    const rowStart = timeToRow(card.startTime);
    const rowSpan = calculateDuration(card.startTime, card.endTime);
    const colStart = card.colStart;
    const colSpan = card.colSpan;

    const cardY = bodyTop + (rowStart - 2) * rowHeight;
    const cardH = rowSpan * rowHeight;
    const cardX = margin + timeColW + (colStart - 2) * venueColW;
    const cardW = colSpan * venueColW;

    const [r, g, b] = hexToRgb(card.color);
    doc.setFillColor(...WHITE);
    doc.roundedRect(cardX + 0.35, cardY + 0.35, cardW - 0.7, cardH - 0.7, 0.8, 0.8, 'F');
    doc.setFillColor(r, g, b);
    doc.rect(cardX + 0.35, cardY + 0.35, 1.1, cardH - 0.7, 'F');
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.15);
    doc.roundedRect(cardX + 0.35, cardY + 0.35, cardW - 0.7, cardH - 0.7, 0.8, 0.8);

    const textX = cardX + 2.2;
    let ty = cardY + 3.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_900);
    const titleLines = doc.splitTextToSize(card.title, cardW - 4);
    doc.text(titleLines.slice(0, 2), textX, ty);
    ty += titleLines.length > 1 ? 7 : 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...SLATE_500);
    doc.text(`${card.startTime} – ${card.endTime}`, textX, ty + 2);
    ty += 4;

    const startVenueIndex = colStart - 2;
    const endVenueIndex = Math.min(startVenueIndex + colSpan - 1, venues.length - 1);
    const venueNames = venues.slice(startVenueIndex, endVenueIndex + 1).map((v) => v.name).join(' · ');
    doc.setFontSize(5.8);
    doc.setTextColor(...SLATE_700);
    doc.text(venueNames, textX, ty + 2, { maxWidth: cardW - 4 });

    if (card.description && cardH > 14) {
      doc.setFontSize(5.5);
      doc.setTextColor(...SLATE_500);
      const desc = doc.splitTextToSize(card.description, cardW - 4);
      doc.text(desc.slice(0, 2), textX, ty + 6.5, { maxWidth: cardW - 4 });
    }
  });

  doc.save(fileName);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246];
}
