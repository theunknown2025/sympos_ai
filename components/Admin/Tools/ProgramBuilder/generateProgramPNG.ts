import html2canvas from 'html2canvas';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

export async function generateProgramPNG(
  cards: ProgramCard[],
  venues: Venue[],
  timeSlots: string[],
  config: ProgramBuilderConfig,
  selectedDay: number
): Promise<void> {
  // Create a temporary container for the program
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  document.body.appendChild(container);

  try {
    // Create header
    const header = document.createElement('div');
    header.style.marginBottom = '30px';
    header.style.borderBottom = '2px solid #e2e8f0';
    header.style.paddingBottom = '20px';
    
    const title = document.createElement('h1');
    title.textContent = `Day ${selectedDay + 1} Program`;
    title.style.fontSize = '32px';
    title.style.fontWeight = 'bold';
    title.style.color = '#1e293b';
    title.style.marginBottom = '10px';
    header.appendChild(title);

    const dateInfo = document.createElement('p');
    dateInfo.textContent = `${config.startTime} - ${config.endTime}`;
    dateInfo.style.fontSize = '16px';
    dateInfo.style.color = '#64748b';
    header.appendChild(dateInfo);

    container.appendChild(header);

    // Create grid container (matching the actual grid structure)
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `120px repeat(${venues.length}, 1fr)`;
    gridContainer.style.gridTemplateRows = `auto repeat(${timeSlots.length}, minmax(40px, auto))`;
    gridContainer.style.gap = '2px';
    gridContainer.style.border = '1px solid #e2e8f0';

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

    // Header row
    const timeHeader = document.createElement('div');
    timeHeader.textContent = 'Time';
    timeHeader.style.gridRow = '1';
    timeHeader.style.gridColumn = '1';
    timeHeader.style.backgroundColor = '#f1f5f9';
    timeHeader.style.padding = '12px';
    timeHeader.style.border = '1px solid #e2e8f0';
    timeHeader.style.fontWeight = 'bold';
    timeHeader.style.fontSize = '14px';
    timeHeader.style.display = 'flex';
    timeHeader.style.alignItems = 'center';
    gridContainer.appendChild(timeHeader);

    venues.forEach((venue, index) => {
      const venueHeader = document.createElement('div');
      venueHeader.textContent = venue.name;
      venueHeader.style.gridRow = '1';
      venueHeader.style.gridColumn = `${index + 2}`;
      venueHeader.style.backgroundColor = '#f1f5f9';
      venueHeader.style.padding = '12px';
      venueHeader.style.border = '1px solid #e2e8f0';
      venueHeader.style.fontWeight = 'bold';
      venueHeader.style.fontSize = '14px';
      venueHeader.style.textAlign = 'center';
      venueHeader.style.display = 'flex';
      venueHeader.style.alignItems = 'center';
      venueHeader.style.justifyContent = 'center';
      gridContainer.appendChild(venueHeader);
    });

    // Time slots and cells
    timeSlots.forEach((time, rowIndex) => {
      const cellRow = rowIndex + 2;

      // Time cell
      const timeCell = document.createElement('div');
      timeCell.textContent = time;
      timeCell.style.gridRow = `${cellRow}`;
      timeCell.style.gridColumn = '1';
      timeCell.style.backgroundColor = '#f8fafc';
      timeCell.style.padding = '12px';
      timeCell.style.border = '1px solid #e2e8f0';
      timeCell.style.fontFamily = 'monospace';
      timeCell.style.fontSize = '12px';
      timeCell.style.display = 'flex';
      timeCell.style.alignItems = 'center';
      gridContainer.appendChild(timeCell);

      // Venue cells
      venues.forEach((venue, colIndex) => {
        const cellCol = colIndex + 2;
        const cell = document.createElement('div');
        cell.style.gridRow = `${cellRow}`;
        cell.style.gridColumn = `${cellCol}`;
        cell.style.minHeight = '40px';
        cell.style.border = '1px solid #e2e8f0';
        cell.style.backgroundColor = 'white';
        cell.style.position = 'relative';
        gridContainer.appendChild(cell);
      });
    });

    // Add cards (only once per card, spanning multiple cells)
    cards.forEach(card => {
      const rowStart = timeToRow(card.startTime);
      const rowSpan = calculateDuration(card.startTime, card.endTime);
      const colStart = card.colStart;
      const colSpan = card.colSpan;

      const cardDiv = document.createElement('div');
      cardDiv.style.gridRowStart = `${rowStart}`;
      cardDiv.style.gridRowEnd = `${rowStart + rowSpan}`;
      cardDiv.style.gridColumnStart = `${colStart}`;
      cardDiv.style.gridColumnEnd = `${colStart + colSpan}`;
      cardDiv.style.backgroundColor = card.color;
      cardDiv.style.color = 'white';
      cardDiv.style.padding = '12px';
      cardDiv.style.borderRadius = '8px';
      cardDiv.style.margin = '4px';
      cardDiv.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      cardDiv.style.display = 'flex';
      cardDiv.style.flexDirection = 'column';
      cardDiv.style.justifyContent = 'space-between';
      cardDiv.style.position = 'relative';
      cardDiv.style.zIndex = '10';

      const title = document.createElement('div');
      title.textContent = card.title;
      title.style.fontWeight = 'bold';
      title.style.fontSize = '14px';
      title.style.marginBottom = '6px';
      cardDiv.appendChild(title);

      const time = document.createElement('div');
      time.textContent = `${card.startTime} - ${card.endTime}`;
      time.style.fontSize = '12px';
      time.style.opacity = '0.9';
      time.style.marginBottom = '4px';
      cardDiv.appendChild(time);

      // Get venue names
      const startVenueIndex = colStart - 2;
      const endVenueIndex = Math.min(startVenueIndex + colSpan - 1, venues.length - 1);
      const spannedVenues = venues.slice(startVenueIndex, endVenueIndex + 1);
      const venueNames = spannedVenues.map(v => v.name).join(', ');

      const venue = document.createElement('div');
      venue.textContent = venueNames;
      venue.style.fontSize = '11px';
      venue.style.opacity = '0.75';
      cardDiv.appendChild(venue);

      gridContainer.appendChild(cardDiv);
    });

    container.appendChild(gridContainer);

    // Generate canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `program-day-${selectedDay + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } finally {
    document.body.removeChild(container);
  }
}
