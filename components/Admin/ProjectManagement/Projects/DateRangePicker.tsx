import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize to start date if available, otherwise current month
    if (startDate) {
      const date = new Date(startDate);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && buttonRef.current && calendarRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const calendarRect = calendarRef.current.getBoundingClientRect();
        const calendarHeight = calendarRect.height || 350;
        const calendarWidth = calendarRect.width || 300;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate position below button
        let top = rect.bottom + 8;
        let left = rect.left;
        
        // If calendar would overflow bottom, position it above the button
        if (top + calendarHeight > viewportHeight) {
          top = rect.top - calendarHeight - 8;
          // If still doesn't fit above, position at top of viewport
          if (top < 0) {
            top = 8;
          }
        }
        
        // If calendar would overflow right, align to right edge
        if (left + calendarWidth > viewportWidth) {
          left = viewportWidth - calendarWidth - 8;
        }
        
        // If calendar would overflow left, align to left edge
        if (left < 0) {
          left = 8;
        }
        
        setCalendarPosition({ top, left });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      // Initial position calculation
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const calendarHeight = 350; // Approximate calendar height
        const calendarWidth = 300; // Approximate calendar width
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top = rect.bottom + 8;
        let left = rect.left;
        
        // Check if calendar fits below
        if (top + calendarHeight > viewportHeight) {
          top = rect.top - calendarHeight - 8;
          // If still doesn't fit above, position at top with scroll
          if (top < 0) {
            top = 8;
          }
        }
        
        // Check horizontal overflow
        if (left + calendarWidth > viewportWidth) {
          left = viewportWidth - calendarWidth - 8;
        }
        if (left < 0) {
          left = 8;
        }
        
        setCalendarPosition({ top, left });
        
        // Recalculate after calendar is rendered to get actual dimensions
        setTimeout(() => {
          if (buttonRef.current && calendarRef.current) {
            const actualRect = buttonRef.current.getBoundingClientRect();
            const calendarRect = calendarRef.current.getBoundingClientRect();
            const actualHeight = calendarRect.height;
            const actualWidth = calendarRect.width;
            
            let newTop = actualRect.bottom + 8;
            let newLeft = actualRect.left;
            
            if (newTop + actualHeight > viewportHeight) {
              newTop = actualRect.top - actualHeight - 8;
              if (newTop < 0) {
                newTop = 8;
              }
            }
            
            if (newLeft + actualWidth > viewportWidth) {
              newLeft = viewportWidth - actualWidth - 8;
            }
            if (newLeft < 0) {
              newLeft = 8;
            }
            
            setCalendarPosition({ top: newTop, left: newLeft });
          }
        }, 0);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const isDateInRange = (date: Date): boolean => {
    const dateStr = formatDate(date);
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) return false;
    return dateStr >= formatDate(start) && dateStr <= formatDate(end);
  };

  const isStartDate = (date: Date): boolean => {
    return formatDate(date) === startDate;
  };

  const isEndDate = (date: Date): boolean => {
    return formatDate(date) === endDate;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const clickedDateStr = formatDate(clickedDate);

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onChange(clickedDateStr, '');
    } else if (startDate && !endDate) {
      // Complete the range
      if (clickedDateStr < startDate) {
        // If clicked date is before start, swap them
        onChange(clickedDateStr, startDate);
      } else {
        onChange(startDate, clickedDateStr);
      }
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('', '');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const displayText = startDate && endDate
    ? `${startDate} - ${endDate}`
    : startDate
    ? `${startDate} - ...`
    : 'Select date range';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white flex items-center justify-between hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <span className={startDate || endDate ? 'text-slate-900' : 'text-slate-400'}>
            {displayText}
          </span>
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-slate-200 rounded"
          >
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </button>

      {isOpen && (
        <div 
          ref={calendarRef}
          className="fixed z-[100] bg-white border border-slate-200 rounded-lg shadow-xl p-4 min-w-[300px]"
          style={{ 
            top: `${calendarPosition.top}px`,
            left: `${calendarPosition.left}px`,
            maxHeight: `${Math.min(400, window.innerHeight - calendarPosition.top - 8)}px`,
            overflowY: 'auto'
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="text-slate-600">‹</span>
            </button>
            <h3 className="text-sm font-semibold text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="text-slate-600">›</span>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-slate-500 text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dateStr = formatDate(date);
              const isInRange = isDateInRange(date);
              const isStart = isStartDate(date);
              const isEnd = isEndDate(date);
              const isToday = formatDate(new Date()) === dateStr;
              const isPast = date < new Date() && !isToday;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square text-sm rounded-lg transition-colors
                    ${isStart || isEnd
                      ? 'bg-indigo-600 text-white font-semibold'
                      : isInRange
                      ? 'bg-indigo-100 text-indigo-700'
                      : isToday
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : isPast
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                  disabled={isPast && !isStart && !isEnd}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              {!startDate
                ? 'Click a date to start the range'
                : !endDate
                ? 'Click a date to complete the range'
                : 'Click to select a new range'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

