import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  GripVertical,
  Palette,
  Download,
  FileImage,
  FileText,
  List
} from 'lucide-react';
import GenerateProgramModal from './GenerateProgramModal';
import SaveProgramModal from './SaveProgramModal';
import ProgramList from './ProgramList';
import { useAuth } from '../../../../hooks/useAuth';
import { updateProgram } from '../../../../services/programService';
import type { SavedProgram } from '../../../../services/programService';

export interface Venue {
  id: string;
  name: string;
}

export interface ProgramCard {
  id: string;
  title: string;
  description?: string;
  startTime: string; // Time in HH:mm format
  endTime: string; // Time in HH:mm format
  venueId: string;
  dayIndex: number;
  color: string;
  rowStart: number; // Grid row start (calculated from time)
  rowSpan: number; // Number of time slots to span
  colStart: number; // Grid column start (venue index)
  colSpan: number; // Number of venues to span (default 1)
}

export interface ProgramBuilderConfig {
  numVenues: number;
  numDays: number;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timeSlotWidth: number; // Minutes (15, 30, 60, etc.)
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const ProgramBuilder: React.FC = () => {
  const [config, setConfig] = useState<ProgramBuilderConfig>({
    numVenues: 3,
    numDays: 3,
    startTime: '09:00',
    endTime: '18:00',
    timeSlotWidth: 30,
  });

  const [venues, setVenues] = useState<Venue[]>([
    { id: 'venue-1', name: 'Main Hall' },
    { id: 'venue-2', name: 'Room A' },
    { id: 'venue-3', name: 'Room B' },
  ]);

  const [cards, setCards] = useState<ProgramCard[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingCard, setEditingCard] = useState<ProgramCard | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [draggedCard, setDraggedCard] = useState<ProgramCard | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ row: 0, col: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingCard, setResizingCard] = useState<ProgramCard | null>(null);
  const [resizeDirection, setResizeDirection] = useState<'horizontal' | 'vertical' | 'both' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ row: 0, col: 0, rowSpan: 0, colSpan: 0 });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const { currentUser: user } = useAuth();
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate time slots based on config
  const generateTimeSlots = useCallback(() => {
    const slots: string[] = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin <= endMin)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += config.timeSlotWidth;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  }, [config.startTime, config.endTime, config.timeSlotWidth]);

  const timeSlots = generateTimeSlots();

  // Update venues when numVenues changes
  useEffect(() => {
    const newVenues: Venue[] = [];
    for (let i = 0; i < config.numVenues; i++) {
      if (venues[i]) {
        newVenues.push(venues[i]);
      } else {
        newVenues.push({ id: `venue-${i + 1}`, name: `Venue ${i + 1}` });
      }
    }
    setVenues(newVenues);
  }, [config.numVenues]);

  // Calculate grid position from time
  // Grid has: row 1 = header, row 2+ = time slots
  const timeToRow = (time: string): number => {
    const [hour, min] = time.split(':').map(Number);
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const timeMinutes = hour * 60 + min;
    const diffMinutes = timeMinutes - startMinutes;
    const slotIndex = Math.floor(diffMinutes / config.timeSlotWidth);
    return slotIndex + 2; // +2 for header row (row 1) and CSS grid 1-indexing
  };

  // Calculate time from grid row
  // Grid has: row 1 = header, row 2+ = time slots
  const rowToTime = (row: number): string => {
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const slotIndex = row - 2; // -2 for header row (row 1) and CSS grid 1-indexing
    const totalMinutes = startMinutes + slotIndex * config.timeSlotWidth;
    const hour = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  // Calculate duration in time slots
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return Math.ceil(diffMinutes / config.timeSlotWidth);
  };

  const handleAddCard = () => {
    const newCard: ProgramCard = {
      id: `card-${Date.now()}`,
      title: 'New Session',
      description: '',
      startTime: config.startTime,
      endTime: rowToTime(timeToRow(config.startTime) + 2),
      venueId: venues[0]?.id || '',
      dayIndex: selectedDay,
      color: DEFAULT_COLORS[0],
      rowStart: timeToRow(config.startTime),
      rowSpan: 2,
      colStart: 2, // Column 2 is first venue (column 1 is time column)
      colSpan: 1,
    };
    setEditingCard(newCard);
  };

  const handleSaveCard = (card: ProgramCard) => {
    const existingCardIndex = cards.findIndex(c => c.id === card.id);
    if (existingCardIndex >= 0) {
      // Update existing card
      const updatedCards = [...cards];
      updatedCards[existingCardIndex] = card;
      setCards(updatedCards);
    } else {
      // Add new card
      setCards([...cards, card]);
    }
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
    if (editingCard?.id === cardId) {
      setEditingCard(null);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    // Prevent clicks on time column (col 1)
    if (col === 1) return;
    
    if (isDragging && draggedCard) {
      // Place card at clicked position, preserving the original time
      const originalRow = timeToRow(draggedCard.startTime);
      placeCardAtPosition(originalRow, col, true);
    } else {
      // Create new card at clicked position
      // col is already colIndex + 2 (accounting for time column), so we need col - 2 to get venue index
      const venueIndex = col - 2;
      if (venueIndex < 0 || venueIndex >= venues.length) {
        console.warn('Invalid venue column:', col, 'venues:', venues.length);
        return;
      }
      
      const venue = venues[venueIndex];
      if (!venue) {
        console.warn('Venue not found at index:', venueIndex);
        return;
      }
      
      const startTime = rowToTime(row);
      const endTime = rowToTime(row + 2); // Default 2 slots
      
      const newCard: ProgramCard = {
        id: `card-${Date.now()}`,
        title: 'New Session',
        description: '',
        startTime,
        endTime,
        venueId: venue.id,
        dayIndex: selectedDay,
        color: DEFAULT_COLORS[0],
        rowStart: row,
        rowSpan: 2,
        colStart: col,
        colSpan: 1,
      };
      
      setEditingCard(newCard);
    }
  };

  const placeCardAtPosition = (row: number, col: number, preserveTime: boolean = true) => {
    if (!draggedCard) return;
    
    // Prevent placing on time column
    if (col === 1) {
      setDraggedCard(null);
      setIsDragging(false);
      setHoveredCell(null);
      return;
    }
    
    // col is already colIndex + 2 (accounting for time column), so we need col - 2 to get venue index
    const venueIndex = col - 2;
    if (venueIndex < 0 || venueIndex >= venues.length) {
      console.warn('Invalid venue column:', col, 'venues:', venues.length);
      setDraggedCard(null);
      setIsDragging(false);
      setHoveredCell(null);
      return;
    }
    
    const venue = venues[venueIndex];
    if (!venue) {
      console.warn('Venue not found at index:', venueIndex);
      setDraggedCard(null);
      setIsDragging(false);
      setHoveredCell(null);
      return;
    }
    
    // If preserving time, use the original times and calculate row from them
    // Otherwise, calculate new times from the grid position while preserving duration
    let finalStartTime = draggedCard.startTime;
    let finalEndTime = draggedCard.endTime;
    let finalRowStart = row;
    let finalRowSpan = draggedCard.rowSpan;
    
    if (preserveTime) {
      // Keep original times, calculate row position from times
      finalRowStart = timeToRow(draggedCard.startTime);
      finalRowSpan = calculateDuration(draggedCard.startTime, draggedCard.endTime);
    } else {
      // Calculate new start time from grid position
      finalStartTime = rowToTime(row);
      // Preserve the original duration by calculating end time from start time + duration
      const originalDuration = calculateDuration(draggedCard.startTime, draggedCard.endTime);
      finalEndTime = rowToTime(row + originalDuration);
      finalRowStart = row;
      // Recalculate rowSpan to ensure accuracy
      finalRowSpan = calculateDuration(finalStartTime, finalEndTime);
    }
    
    // Remove old card if it's a move (not a new card)
    const isExistingCard = cards.some(c => c.id === draggedCard.id);
    const filteredCards = isExistingCard 
      ? cards.filter(c => c.id !== draggedCard.id)
      : cards;
    
    const updatedCard: ProgramCard = {
      ...draggedCard,
      rowStart: finalRowStart,
      rowSpan: finalRowSpan,
      colStart: col,
      venueId: venue.id,
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayIndex: selectedDay,
    };
    
    setCards([...filteredCards, updatedCard]);
    setDraggedCard(null);
    setIsDragging(false);
    setHoveredCell(null);
  };

  const handleCardDragStart = (e: React.MouseEvent, card: ProgramCard) => {
    e.stopPropagation();
    e.preventDefault();
    // Only allow dragging from the card itself, not from buttons inside
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setDraggedCard(card);
    setIsDragging(true);
    setDragStartPos({ row: card.rowStart, col: card.colStart });
  };

  const handleCardDragEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (draggedCard && hoveredCell && hoveredCell.col !== 1) {
      // Place card at hovered position
      // If row changed, update time; if only col changed, preserve time
      const originalRow = timeToRow(draggedCard.startTime);
      const preserveTime = hoveredCell.row === originalRow;
      placeCardAtPosition(hoveredCell.row, hoveredCell.col, preserveTime);
    } else if (draggedCard) {
      // If dropped outside grid or on time column, cancel and restore original position
      setDraggedCard(null);
      setIsDragging(false);
      setHoveredCell(null);
    }
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    // Prevent hover on time column (col 1)
    if (col === 1) return;
    
    if (isDragging && draggedCard) {
      // Allow both horizontal (venue) and vertical (time) movement
      // Use the actual row being hovered, which allows time changes
      setHoveredCell({ row, col });
    }
  };

  const handleCellMouseLeave = () => {
    // Don't clear hoveredCell immediately - allow dragging to continue
    // It will be cleared when drag ends
  };

  // Global mouse up handler to ensure drag ends properly even if mouse leaves card
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging && draggedCard) {
        // If we have a valid hover position (not time column), place the card
        if (hoveredCell && hoveredCell.col !== 1) {
          const originalRow = timeToRow(draggedCard.startTime);
          const preserveTime = hoveredCell.row === originalRow;
          placeCardAtPosition(hoveredCell.row, hoveredCell.col, preserveTime);
        } else {
          // Cancel drag if no valid hover position or dropped on time column
          setDraggedCard(null);
          setIsDragging(false);
          setHoveredCell(null);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, draggedCard, hoveredCell]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, card: ProgramCard, direction: 'horizontal' | 'vertical' | 'both') => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCard(card);
    setIsResizing(true);
    setResizeDirection(direction);
    const rowStart = timeToRow(card.startTime);
    const colStart = card.colStart;
    setResizeStartPos({
      row: rowStart,
      col: colStart,
      rowSpan: card.rowSpan,
      colSpan: card.colSpan,
    });
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizingCard || !resizeDirection) return;

    if (!gridRef.current) return;

    // Get all grid cells
    const cells = gridRef.current.querySelectorAll('[data-cell-row][data-cell-col]');
    let targetCell: { row: number; col: number } | null = null;

    // Find which cell the mouse is over
    for (const cell of Array.from(cells)) {
      const rect = (cell as HTMLElement).getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const row = parseInt((cell as HTMLElement).dataset.cellRow || '0');
        const col = parseInt((cell as HTMLElement).dataset.cellCol || '0');
        if (row > 0 && col > 0 && col !== 1) { // Exclude time column
          targetCell = { row, col };
          break;
        }
      }
    }

    if (!targetCell) {
      // If we can't find a cell, try to calculate based on mouse position
      const gridRect = gridRef.current.getBoundingClientRect();
      const relativeX = e.clientX - gridRect.left;
      const relativeY = e.clientY - gridRect.top;
      
      // Approximate cell calculation as fallback
      const timeColWidth = 120;
      const gap = 2;
      const venueColWidth = (gridRect.width - timeColWidth - gap * (venues.length + 1)) / venues.length;
      
      if (resizeDirection === 'horizontal' || resizeDirection === 'both') {
        if (relativeX > timeColWidth) {
          const venueX = relativeX - timeColWidth;
          const colIndex = Math.floor(venueX / (venueColWidth + gap));
          const targetCol = Math.min(colIndex + 2, venues.length + 1); // +2 for time column
          targetCell = { row: resizeStartPos.row, col: targetCol };
        }
      }
      
      if (resizeDirection === 'vertical' || resizeDirection === 'both') {
        const headerHeight = 40;
        const rowHeight = 40;
        const relativeYAfterHeader = relativeY - headerHeight;
        if (relativeYAfterHeader > 0) {
          const rowIndex = Math.floor(relativeYAfterHeader / (rowHeight + gap));
          const targetRow = Math.min(rowIndex + 2, timeSlots.length + 1); // +2 for header
          if (!targetCell) {
            targetCell = { row: targetRow, col: resizeStartPos.col };
          } else {
            targetCell.row = targetRow;
          }
        }
      }
    }

    if (!targetCell) return;

    // Calculate new dimensions based on target cell
    let newColSpan = resizeStartPos.colSpan;
    if (resizeDirection === 'horizontal' || resizeDirection === 'both') {
      const startVenueIndex = resizeStartPos.col - 2; // -2 for time column
      const endVenueIndex = targetCell.col - 2; // -2 for time column
      if (endVenueIndex >= startVenueIndex && endVenueIndex < venues.length) {
        newColSpan = Math.max(1, endVenueIndex - startVenueIndex + 1);
      } else if (endVenueIndex < startVenueIndex) {
        newColSpan = 1; // Can't shrink below 1
      } else {
        // Clamp to maximum available venues
        newColSpan = Math.min(venues.length - startVenueIndex, newColSpan);
      }
    }

    let newRowSpan = resizeStartPos.rowSpan;
    if (resizeDirection === 'vertical' || resizeDirection === 'both') {
      const endRow = targetCell.row;
      const maxRow = timeSlots.length + 1; // +1 for header row
      if (endRow >= resizeStartPos.row && endRow <= maxRow) {
        newRowSpan = Math.max(1, endRow - resizeStartPos.row + 1);
      } else if (endRow < resizeStartPos.row) {
        newRowSpan = 1; // Can't shrink below 1
      } else {
        // Clamp to maximum available rows
        newRowSpan = Math.min(maxRow - resizeStartPos.row + 1, newRowSpan);
      }
    }

    // Update card with new dimensions
    const updatedCard: ProgramCard = {
      ...resizingCard,
      colSpan: newColSpan,
      rowSpan: newRowSpan,
    };

    // If resizing vertically, update endTime
    if (resizeDirection === 'vertical' || resizeDirection === 'both') {
      const newEndTime = rowToTime(resizeStartPos.row + newRowSpan - 1);
      updatedCard.endTime = newEndTime;
    }

    // Update the card in the cards array
    setCards(prevCards => 
      prevCards.map(c => c.id === resizingCard.id ? updatedCard : c)
    );
  }, [isResizing, resizingCard, resizeDirection, resizeStartPos, venues.length, timeSlots.length, rowToTime]);

  const handleResizeEnd = () => {
    if (isResizing && resizingCard) {
      // Finalize the resize by ensuring times are correct
      const finalCard = cards.find(c => c.id === resizingCard.id);
      if (finalCard) {
        const finalRowStart = timeToRow(finalCard.startTime);
        const finalRowSpan = calculateDuration(finalCard.startTime, finalCard.endTime);
        const updatedCard: ProgramCard = {
          ...finalCard,
          rowSpan: finalRowSpan,
        };
        setCards(prevCards => 
          prevCards.map(c => c.id === resizingCard.id ? updatedCard : c)
        );
      }
    }
    setIsResizing(false);
    setResizingCard(null);
    setResizeDirection(null);
  };

  // Global mouse move and up handlers for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove]);

  // Filter cards for current day
  const dayCards = cards.filter(c => c.dayIndex === selectedDay);

  const handleLoadProgram = (program: SavedProgram) => {
    setConfig(program.config);
    setVenues(program.venues);
    setCards(program.cards);
    setProgramName(program.title);
    setProgramDescription(program.description || '');
    setCurrentProgramId(program.id);
    setSelectedDay(0);
    setActiveTab('new');
  };

  const handleSaveSuccess = () => {
    setShowSaveModal(false);
    // Keep currentProgramId as null for new programs
    // Optionally switch to list tab to see the saved program
    // setActiveTab('list');
  };

  const handleSaveChanges = async () => {
    if (!user || !currentProgramId || !programName.trim()) {
      return;
    }

    try {
      await updateProgram(
        currentProgramId,
        programName.trim(),
        programDescription.trim() || undefined,
        config,
        venues,
        cards
      );
      
      // Show success message (you could add a toast notification here)
      alert('Program updated successfully!');
    } catch (err: any) {
      alert('Failed to update program: ' + (err.message || 'Unknown error'));
      console.error('Error updating program:', err);
    }
  };

  // Clear program ID when starting fresh
  const handleNewProgram = () => {
    if (confirm('Start a new program? Any unsaved changes will be lost.')) {
      setProgramName('');
      setProgramDescription('');
      setCards([]);
      setCurrentProgramId(null);
      setConfig({
        numVenues: 3,
        numDays: 3,
        startTime: '09:00',
        endTime: '18:00',
        timeSlotWidth: 30,
      });
      setVenues([
        { id: 'venue-1', name: 'Main Hall' },
        { id: 'venue-2', name: 'Room A' },
        { id: 'venue-3', name: 'Room B' },
      ]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Program Builder</h1>
          <p className="text-slate-500 mt-1 text-sm">Create and manage your conference program schedule</p>
        </div>
        {activeTab === 'new' && (
          <div className="flex gap-3">
            {currentProgramId && (
              <button
                onClick={handleNewProgram}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                title="Start New Program"
              >
                <Plus size={18} />
                New Program
              </button>
            )}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Settings size={18} />
              {showConfig ? 'Hide' : 'Show'} Settings
            </button>
            <button
              onClick={handleAddCard}
              className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Session
            </button>
            {currentProgramId ? (
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!user || !programName.trim()}
                title={!programName.trim() ? 'Please enter a program name in settings' : 'Save Changes'}
              >
                <Save size={18} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!user || !programName.trim()}
                title={!programName.trim() ? 'Please enter a program name in settings' : 'Save Program'}
              >
                <Save size={18} />
                Save Program
              </button>
            )}
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Download size={18} />
              Generate
            </button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={18} />
              New Program
            </div>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <List size={18} />
              List of Programs
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' ? (
        <div className="flex-1 overflow-auto">
          <ProgramList onLoadProgram={handleLoadProgram} />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Configuration Panel */}
        {showConfig && (
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g., Conference Program 2024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">This name will be used when saving the program</p>
              </div>

              <div className="pb-4 border-b border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Program Description
                </label>
                <textarea
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  placeholder="Add a description for this program..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Optional description for your program</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={config.numDays}
                  onChange={(e) => setConfig({ ...config, numDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Venues
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.numVenues}
                  onChange={(e) => setConfig({ ...config, numVenues: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Slot Width (minutes)
                </label>
                <select
                  value={config.timeSlotWidth}
                  onChange={(e) => setConfig({ ...config, timeSlotWidth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Venues
                </label>
                <div className="space-y-2">
                  {venues.map((venue, index) => (
                    <input
                      key={venue.id}
                      type="text"
                      value={venue.name}
                      onChange={(e) => {
                        const newVenues = [...venues];
                        newVenues[index].name = e.target.value;
                        setVenues(newVenues);
                      }}
                      placeholder={`Venue ${index + 1}`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Area */}
        <div className={`${showConfig ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`}>
          {/* Day Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
              disabled={selectedDay === 0}
              className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <span className="font-semibold text-slate-900">
                Day {selectedDay + 1} of {config.numDays}
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(Math.min(config.numDays - 1, selectedDay + 1))}
              disabled={selectedDay === config.numDays - 1}
              className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-auto p-6">
            <div
              ref={gridRef}
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: `120px repeat(${venues.length}, 1fr)`,
                gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(40px, auto))`,
                gap: '2px',
              }}
              onMouseUp={(e) => {
                if (isDragging && hoveredCell && draggedCard) {
                  // Validate hoveredCell has valid coordinates and not time column
                  if (hoveredCell.row >= 2 && hoveredCell.col >= 2 && hoveredCell.col !== 1) {
                    // Check if row changed to determine if time should be preserved
                    const originalRow = timeToRow(draggedCard.startTime);
                    const preserveTime = hoveredCell.row === originalRow;
                    placeCardAtPosition(hoveredCell.row, hoveredCell.col, preserveTime);
                  } else {
                    // Cancel drag if invalid position or time column
                    setDraggedCard(null);
                    setIsDragging(false);
                    setHoveredCell(null);
                  }
                }
              }}
            >
              {/* Header Row */}
              <div 
                className="sticky top-0 z-10 bg-slate-100 font-semibold text-slate-700 p-2 text-sm border border-slate-200"
                style={{
                  gridRow: 1,
                  gridColumn: 1,
                }}
              >
                Time
              </div>
              {venues.map((venue, index) => (
                <div
                  key={venue.id}
                  className="sticky top-0 z-10 bg-slate-100 font-semibold text-slate-700 p-2 text-sm border border-slate-200 text-center"
                  style={{
                    gridRow: 1,
                    gridColumn: index + 2, // +2 because column 1 is time column
                  }}
                >
                  <MapPin size={14} className="inline mr-1" />
                  {venue.name}
                </div>
              ))}

              {/* Time Slots and Cells */}
              {timeSlots.map((time, rowIndex) => {
                const cellRow = rowIndex + 2; // +2 for header row
                return (
                  <React.Fragment key={time}>
                    <div 
                      className="bg-slate-50 p-2 text-xs text-slate-600 border border-slate-200 font-mono"
                      style={{ 
                        pointerEvents: 'none',
                        gridRow: cellRow,
                        gridColumn: 1,
                      }}
                    >
                      {time}
                    </div>
                    {venues.map((venue, colIndex) => {
                      const cellCol = colIndex + 2; // +2 for time column
                      // Check if this cell is in the hovered position (allows vertical movement)
                      const isHovered = isDragging && draggedCard && 
                        hoveredCell?.col === cellCol && 
                        hoveredCell?.col !== 1 && // Never highlight time column
                        cellRow >= hoveredCell.row && 
                        cellRow < hoveredCell.row + draggedCard.rowSpan;
                      
                      return (
                        <div
                          key={`${time}-${venue.id}`}
                          data-cell-row={cellRow}
                          data-cell-col={cellCol}
                          style={{
                            gridRow: cellRow,
                            gridColumn: cellCol,
                          }}
                          onClick={() => handleCellClick(cellRow, cellCol)}
                          onMouseEnter={() => handleCellMouseEnter(cellRow, cellCol)}
                          onMouseLeave={handleCellMouseLeave}
                          className={`
                            min-h-[40px] border border-slate-200 bg-white cursor-pointer
                            hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-150
                            ${isHovered ? 'bg-indigo-100 border-indigo-400 border-2 ring-2 ring-indigo-300' : ''}
                          `}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Drag Preview - Shows where card will be placed */}
              {isDragging && draggedCard && hoveredCell && hoveredCell.col !== 1 && (
                (() => {
                  // Use hovered row for preview (allows vertical movement)
                  const previewRow = hoveredCell.row;
                  const previewRowSpan = draggedCard.rowSpan; // Keep same duration
                  const previewCol = hoveredCell.col;
                  
                  // Calculate preview times for display
                  const previewStartTime = rowToTime(previewRow);
                  const previewEndTime = rowToTime(previewRow + previewRowSpan);
                  
                  return (
                    <div
                      style={{
                        gridRowStart: previewRow,
                        gridRowEnd: previewRow + previewRowSpan,
                        gridColumnStart: previewCol,
                        gridColumnEnd: previewCol + draggedCard.colSpan,
                        backgroundColor: draggedCard.color,
                        opacity: 0.4,
                        zIndex: 15,
                        position: 'relative',
                        border: '2px dashed rgba(255, 255, 255, 0.9)',
                        transition: 'opacity 0.2s ease',
                      }}
                      className="m-1 rounded-lg pointer-events-none flex items-center justify-center"
                    >
                      <div className="text-white text-xs font-semibold opacity-90">
                        {previewStartTime} - {previewEndTime}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Program Cards */}
              {dayCards.map((card) => {
                const venueIndex = venues.findIndex(v => v.id === card.venueId);
                if (venueIndex === -1) {
                  console.warn(`Card ${card.id} has invalid venueId: ${card.venueId}`);
                  return null;
                }

                // Always recalculate grid position from stored times to ensure accuracy
                // This ensures the card position matches its actual times
                const calculatedRowStart = timeToRow(card.startTime);
                const calculatedRowSpan = calculateDuration(card.startTime, card.endTime);
                
                // Use calculated values, but ensure minimums
                const rowStart = Math.max(2, calculatedRowStart);
                const rowSpan = Math.max(1, calculatedRowSpan);
                const colStart = Math.max(2, card.colStart);
                const rowEnd = rowStart + rowSpan;
                const colEnd = colStart + Math.max(1, card.colSpan);
                const isBeingDragged = draggedCard?.id === card.id;
                const isBeingResized = resizingCard?.id === card.id;
                
                // Calculate which venues this card spans
                const startVenueIndex = colStart - 2; // -2 for time column
                const endVenueIndex = Math.min(startVenueIndex + card.colSpan - 1, venues.length - 1);
                const spannedVenues = venues.slice(startVenueIndex, endVenueIndex + 1);

                return (
                  <div
                    key={card.id}
                    style={{
                      gridRowStart: rowStart,
                      gridRowEnd: rowEnd,
                      gridColumnStart: colStart,
                      gridColumnEnd: colEnd,
                      backgroundColor: card.color,
                      opacity: isBeingDragged ? 0.6 : isBeingResized ? 0.9 : 1,
                      zIndex: isBeingDragged || isBeingResized ? 20 : 10,
                      position: 'relative',
                      transform: isBeingDragged ? 'scale(0.98)' : 'scale(1)',
                      transition: isBeingDragged || isBeingResized ? 'none' : 'all 0.2s ease',
                      pointerEvents: isBeingDragged ? 'none' : 'auto',
                    }}
                    className="m-1 rounded-lg p-3 text-white shadow-lg cursor-grab active:cursor-grabbing group"
                    onMouseDown={(e) => {
                      // Don't start drag if clicking on resize handles
                      if ((e.target as HTMLElement).classList.contains('resize-handle')) {
                        return;
                      }
                      handleCardDragStart(e, card);
                    }}
                    onMouseUp={(e) => handleCardDragEnd(e)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{card.title}</h4>
                        <p className="text-xs opacity-90">
                          {card.startTime} - {card.endTime}
                        </p>
                        <p className="text-xs opacity-75 mt-1 flex items-center gap-1 flex-wrap">
                          <MapPin size={12} className="flex-shrink-0" />
                          <span className="truncate">
                            {spannedVenues.length > 1 
                              ? spannedVenues.map(v => v.name).join(', ')
                              : spannedVenues[0]?.name || venues[venueIndex]?.name
                            }
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCard(card);
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {card.description && (
                      <p className="text-xs opacity-80 line-clamp-2 mt-1">{card.description}</p>
                    )}
                    
                    {/* Resize Handles */}
                    {/* Right edge - horizontal resize */}
                    <div
                      className="resize-handle absolute top-0 right-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-white/20"
                      onMouseDown={(e) => handleResizeStart(e, card, 'horizontal')}
                      style={{
                        cursor: 'ew-resize',
                      }}
                    />
                    
                    {/* Bottom edge - vertical resize */}
                    <div
                      className="resize-handle absolute bottom-0 left-0 w-full h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-white/20"
                      onMouseDown={(e) => handleResizeStart(e, card, 'vertical')}
                      style={{
                        cursor: 'ns-resize',
                      }}
                    />
                    
                    {/* Bottom-right corner - both directions */}
                    <div
                      className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-white/40 rounded-tl-lg hover:bg-white/60 border-2 border-white/50"
                      onMouseDown={(e) => handleResizeStart(e, card, 'both')}
                      style={{
                        cursor: 'nwse-resize',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Card Edit Modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          venues={venues}
          timeSlots={timeSlots}
          config={config}
          onSave={(updatedCard) => {
            // Recalculate grid positions
            const rowStart = timeToRow(updatedCard.startTime);
            const rowSpan = calculateDuration(updatedCard.startTime, updatedCard.endTime);
            const venueIndex = venues.findIndex(v => v.id === updatedCard.venueId);
            
            if (venueIndex === -1) {
              console.error('Invalid venue selected:', updatedCard.venueId);
              return;
            }
            
            const finalCard: ProgramCard = {
              ...updatedCard,
              rowStart,
              rowSpan: Math.max(1, rowSpan), // Ensure at least 1 slot
              colStart: venueIndex + 2, // +2 for time column (col 1) and CSS grid 1-indexing
              dayIndex: selectedDay,
            };
            
            handleSaveCard(finalCard);
          }}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateProgramModal
          onClose={() => setShowGenerateModal(false)}
          cards={dayCards}
          venues={venues}
          timeSlots={timeSlots}
          config={config}
          selectedDay={selectedDay}
        />
      )}

      {/* Save Program Modal */}
      {showSaveModal && user && (
        <SaveProgramModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveSuccess}
          config={config}
          venues={venues}
          cards={cards}
          userId={user.id}
          initialTitle={programName}
          initialDescription={programDescription}
        />
      )}

    </div>
  );
};

interface CardEditModalProps {
  card: ProgramCard;
  venues: Venue[];
  timeSlots: string[];
  config: ProgramBuilderConfig;
  onSave: (card: ProgramCard) => void;
  onClose: () => void;
}

const CardEditModal: React.FC<CardEditModalProps> = ({
  card,
  venues,
  timeSlots,
  config,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [startTime, setStartTime] = useState(card.startTime);
  const [endTime, setEndTime] = useState(card.endTime);
  const [venueId, setVenueId] = useState(card.venueId);
  const [color, setColor] = useState(card.color);
  const [colSpan, setColSpan] = useState(card.colSpan || 1);

  const handleSave = () => {
    const updatedCard: ProgramCard = {
      ...card,
      title,
      description,
      startTime,
      endTime,
      venueId,
      color,
      colSpan,
    };
    onSave(updatedCard);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Edit Session</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session title"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session description"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={config.startTime}
                max={config.endTime}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
                max={config.endTime}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Venue *
            </label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Span Across Venues
            </label>
            <select
              value={colSpan}
              onChange={(e) => setColSpan(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {venues.map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} {index === 0 ? 'venue' : 'venues'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    color === c ? 'border-slate-900 scale-110' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-slate-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !startTime || !endTime || !venueId}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilder;

