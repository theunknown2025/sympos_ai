import jsPDF from 'jspdf';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

export async function generateProgramPDF(
  cards: ProgramCard[],
  venues: Venue[],
  timeSlots: string[],
  config: ProgramBuilderConfig,
  selectedDay: number
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Set up colors
  const lightGray = [241, 245, 249]; // slate-100
  const borderGray = [226, 232, 240]; // slate-200
  const textDark = [30, 41, 59]; // slate-800
  const textGray = [100, 116, 139]; // slate-500
  const bgGray = [248, 250, 252]; // slate-50

  // Helper function to calculate row from time
  const timeToRow = (time: string): number => {
    const [hour, min] = time.split(':').map(Number);
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const timeMinutes = hour * 60 + min;
    const diffMinutes = timeMinutes - startMinutes;
    const slotIndex = Math.floor(diffMinutes / config.timeSlotWidth);
    return slotIndex + 2; // +2 for header row
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return Math.ceil(diffMinutes / config.timeSlotWidth);
  };

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text(`Day ${selectedDay + 1} Program`, 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(...textGray);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.startTime} - ${config.endTime}`, 20, 28);

  // Table setup
  const startY = 35;
  const rowHeight = 6;
  const timeColWidth = 25;
  const pageWidth = 297; // A4 landscape width
  const margin = 20;
  const venueColWidth = (pageWidth - margin * 2 - timeColWidth) / venues.length;
  const headerHeight = 10;

  // Draw header
  doc.setFillColor(...lightGray);
  doc.rect(margin, startY, timeColWidth, headerHeight, 'F');
  doc.setDrawColor(...borderGray);
  doc.rect(margin, startY, timeColWidth, headerHeight);

  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Time', margin + timeColWidth / 2, startY + headerHeight / 2 + 2, {
    align: 'center',
  });

  venues.forEach((venue, index) => {
    const x = margin + timeColWidth + index * venueColWidth;
    doc.setFillColor(...lightGray);
    doc.rect(x, startY, venueColWidth, headerHeight, 'F');
    doc.setDrawColor(...borderGray);
    doc.rect(x, startY, venueColWidth, headerHeight);

    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.text(venue.name, x + venueColWidth / 2, startY + headerHeight / 2 + 2, {
      align: 'center',
      maxWidth: venueColWidth - 4,
    });
  });

  // Draw grid cells
  timeSlots.forEach((time, rowIndex) => {
    const y = startY + headerHeight + rowIndex * rowHeight;

    // Time cell
    doc.setFillColor(...bgGray);
    doc.rect(margin, y, timeColWidth, rowHeight, 'F');
    doc.setDrawColor(...borderGray);
    doc.rect(margin, y, timeColWidth, rowHeight);

    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.setFont('courier', 'normal');
    doc.text(time, margin + timeColWidth / 2, y + rowHeight / 2 + 2, {
      align: 'center',
    });

    // Venue cells
    venues.forEach((venue, colIndex) => {
      const x = margin + timeColWidth + colIndex * venueColWidth;
      doc.setDrawColor(...borderGray);
      doc.rect(x, y, venueColWidth, rowHeight);
    });
  });

  // Draw cards (spanning multiple cells)
  cards.forEach(card => {
    const rowStart = timeToRow(card.startTime);
    const rowSpan = calculateDuration(card.startTime, card.endTime);
    const colStart = card.colStart;
    const colSpan = card.colSpan;

    // Calculate card position and size
    const cardStartY = startY + headerHeight + (rowStart - 2) * rowHeight;
    const cardHeight = rowSpan * rowHeight;
    const cardStartX = margin + timeColWidth + (colStart - 2) * venueColWidth;
    const cardWidth = colSpan * venueColWidth;

    // Draw card background
    const [r, g, b] = hexToRgb(card.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(cardStartX + 0.5, cardStartY + 0.5, cardWidth - 1, cardHeight - 1, 1, 1, 'F');

    // Draw card border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardStartX + 0.5, cardStartY + 0.5, cardWidth - 1, cardHeight - 1, 1, 1);

    // Card text
    const textX = cardStartX + 2;
    const textY = cardStartY + 3;

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(card.title, textX, textY, {
      maxWidth: cardWidth - 4,
    });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${card.startTime} - ${card.endTime}`, textX, textY + 3, {
      maxWidth: cardWidth - 4,
    });

    // Get venue names
    const startVenueIndex = colStart - 2;
    const endVenueIndex = Math.min(startVenueIndex + colSpan - 1, venues.length - 1);
    const spannedVenues = venues.slice(startVenueIndex, endVenueIndex + 1);
    const venueNames = spannedVenues.map(v => v.name).join(', ');

    doc.setFontSize(6);
    doc.text(venueNames, textX, textY + 5.5, {
      maxWidth: cardWidth - 4,
    });
  });

  // Save PDF
  doc.save(`program-day-${selectedDay + 1}.pdf`);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [59, 130, 246]; // Default to indigo
}
