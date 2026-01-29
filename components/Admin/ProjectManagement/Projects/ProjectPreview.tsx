import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Axe, Task } from '../../../../services/projectService';
import { Personnel } from '../../../../services/personnelService';

interface ProjectPreviewProps {
  projectName: string;
  axes: Axe[];
  personnel: Personnel[];
}

type TimelineView = 'daily' | 'weekly' | 'monthly';

interface TaskWithAxe {
  axeId: string;
  axeName: string;
  taskId: string;
  description: string;
  responsables: string[];
  priority: string;
  startDate: string;
  endDate: string;
  comment: string;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ projectName, axes, personnel }) => {
  const [timelineView, setTimelineView] = useState<TimelineView>('monthly');
  const [expanded, setExpanded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(400);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  
  // Refs for scroll synchronization
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const timelineScrollbarRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Flatten all tasks from all axes
  const allTasks: TaskWithAxe[] = useMemo(() => {
    const tasks: TaskWithAxe[] = [];
    axes.forEach((axe) => {
      axe.tasks.forEach((task) => {
        tasks.push({
          axeId: axe.id,
          axeName: axe.name,
          taskId: task.id,
          description: task.description,
          responsables: task.responsables,
          priority: task.priority,
          startDate: task.startDate || '',
          endDate: task.endDate || '',
          comment: task.comment || '',
        });
      });
    });
    return tasks;
  }, [axes]);

  // Generate time units based on view type
  const generateTimeUnits = (view: TimelineView, start: Date, end: Date) => {
    const units: { date: Date; label: string }[] = [];
    const current = new Date(start);

    switch (view) {
      case 'daily':
        while (current <= end) {
          units.push({
            date: new Date(current),
            label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          });
          current.setDate(current.getDate() + 1);
        }
        break;

      case 'weekly':
        const weekStart = new Date(current);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        
        while (weekStart <= end) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endLabel = weekEnd.getMonth() === weekStart.getMonth() 
            ? weekEnd.toLocaleDateString('en-US', { day: 'numeric' })
            : weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          units.push({
            date: new Date(weekStart),
            label: `${startLabel} - ${endLabel}`,
          });
          weekStart.setDate(weekStart.getDate() + 7);
        }
        break;

      case 'monthly':
        while (current <= end) {
          units.push({
            date: new Date(current),
            label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          });
          current.setMonth(current.getMonth() + 1);
        }
        break;
    }

    return units;
  };

  // Calculate date range for timeline
  const timelineUnits = useMemo(() => {
    const dates = allTasks
      .filter(task => task.startDate || task.endDate)
      .flatMap(task => {
        const dates: Date[] = [];
        if (task.startDate) dates.push(new Date(task.startDate));
        if (task.endDate) dates.push(new Date(task.endDate));
        return dates;
      });

    let start: Date;
    let end: Date;

    if (dates.length === 0) {
      const today = new Date();
      switch (timelineView) {
        case 'daily':
          start = new Date(today);
          start.setDate(start.getDate() - 7);
          end = new Date(today);
          end.setDate(end.getDate() + 30);
          break;
        case 'weekly':
          start = new Date(today);
          start.setDate(start.getDate() - 14);
          end = new Date(today);
          end.setDate(end.getDate() + 60);
          break;
        case 'monthly':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
          break;
      }
    } else {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      switch (timelineView) {
        case 'daily':
          start = new Date(minDate);
          start.setDate(start.getDate() - 7);
          end = new Date(maxDate);
          end.setDate(end.getDate() + 7);
          break;
        case 'weekly':
          start = new Date(minDate);
          start.setDate(start.getDate() - 14);
          end = new Date(maxDate);
          end.setDate(end.getDate() + 14);
          break;
        case 'monthly':
          start = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
          end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
          break;
      }
    }

    return generateTimeUnits(timelineView, start, end);
  }, [allTasks, timelineView]);

  // Synchronize scrolling between header, content, and scrollbar
  useEffect(() => {
    if (!expanded) return;
    
    const contentElement = timelineContentRef.current;
    const scrollbarElement = timelineScrollbarRef.current;
    const headerElement = timelineHeaderRef.current;
    
    if (!contentElement || !scrollbarElement || !headerElement) return;
    
    let isScrolling = false;
    
    const syncScroll = (source: HTMLDivElement, target1: HTMLDivElement, target2: HTMLDivElement) => {
      if (isScrolling) return;
      isScrolling = true;
      requestAnimationFrame(() => {
        target1.scrollLeft = source.scrollLeft;
        target2.scrollLeft = source.scrollLeft;
        isScrolling = false;
      });
    };
    
    const handleScrollbarScroll = () => {
      if (!isScrolling && contentElement && headerElement) {
        isScrolling = true;
        requestAnimationFrame(() => {
          contentElement.scrollLeft = scrollbarElement.scrollLeft;
          headerElement.scrollLeft = scrollbarElement.scrollLeft;
          isScrolling = false;
        });
      }
    };
    
    const handleContentScroll = () => {
      if (!isScrolling && scrollbarElement && headerElement) {
        isScrolling = true;
        requestAnimationFrame(() => {
          scrollbarElement.scrollLeft = contentElement.scrollLeft;
          headerElement.scrollLeft = contentElement.scrollLeft;
          isScrolling = false;
        });
      }
    };
    
    const handleHeaderScroll = () => {
      if (!isScrolling && scrollbarElement && contentElement) {
        isScrolling = true;
        requestAnimationFrame(() => {
          scrollbarElement.scrollLeft = headerElement.scrollLeft;
          contentElement.scrollLeft = headerElement.scrollLeft;
          isScrolling = false;
        });
      }
    };
    
    scrollbarElement.addEventListener('scroll', handleScrollbarScroll, { passive: true });
    contentElement.addEventListener('scroll', handleContentScroll, { passive: true });
    headerElement.addEventListener('scroll', handleHeaderScroll, { passive: true });
    
    return () => {
      scrollbarElement.removeEventListener('scroll', handleScrollbarScroll);
      contentElement.removeEventListener('scroll', handleContentScroll);
      headerElement.removeEventListener('scroll', handleHeaderScroll);
    };
  }, [timelineView, timelineUnits.length, expanded]);

  // Handle resize of left panel
  useEffect(() => {
    if (!expanded) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !leftPanelRef.current) return;
      
      const newWidth = e.clientX - leftPanelRef.current.getBoundingClientRect().left;
      const constrainedWidth = Math.max(250, Math.min(800, newWidth));
      
      requestAnimationFrame(() => {
        setLeftPanelWidth(constrainedWidth);
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, expanded]);
  
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // Calculate task position and width in timeline
  const getTaskTimelineStyle = (task: TaskWithAxe) => {
    if (!task.startDate || !task.endDate) return null;

    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    let timelineStart: Date;
    let timelineEnd: Date;
    
    if (timelineUnits.length === 0) {
      timelineStart = new Date();
      timelineEnd = new Date();
    } else {
      timelineStart = new Date(timelineUnits[0].date);
      timelineStart.setHours(0, 0, 0, 0);
      
      const lastUnit = new Date(timelineUnits[timelineUnits.length - 1].date);
      switch (timelineView) {
        case 'daily':
          timelineEnd = new Date(lastUnit);
          timelineEnd.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          timelineEnd = new Date(lastUnit);
          timelineEnd.setDate(timelineEnd.getDate() + 6);
          timelineEnd.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          timelineEnd = new Date(lastUnit.getFullYear(), lastUnit.getMonth() + 1, 0);
          timelineEnd.setHours(23, 59, 59, 999);
          break;
        default:
          timelineEnd = new Date(lastUnit);
          timelineEnd.setHours(23, 59, 59, 999);
      }
    }

    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const taskStartPosition = startDate.getTime() - timelineStart.getTime();
    const taskEndPosition = endDate.getTime() - timelineStart.getTime();
    
    const clampedStartPosition = Math.max(0, taskStartPosition);
    const clampedEndPosition = Math.min(totalDuration, taskEndPosition);
    
    const left = (clampedStartPosition / totalDuration) * 100;
    const width = ((clampedEndPosition - clampedStartPosition) / totalDuration) * 100;

    const minWidth = timelineView === 'daily' ? 0.5 : timelineView === 'weekly' ? 1 : 2;
    const finalWidth = Math.max(width, minWidth);

    return { left: `${left}%`, width: `${finalWidth}%` };
  };

  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find(p => p.id === personnelId);
    return person ? person.fullName : personnelId;
  };

  const getStatusColor = (task: TaskWithAxe) => {
    if (!task.endDate) return 'bg-slate-300';
    const endDate = new Date(task.endDate);
    const today = new Date();
    if (endDate < today) return 'bg-red-500';
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      if (startDate <= today && endDate >= today) return 'bg-orange-500';
    }
    return 'bg-green-500';
  };

  // Group tasks by axe
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: { axeName: string; tasks: TaskWithAxe[] } } = {};
    allTasks.forEach(task => {
      if (!groups[task.axeId]) {
        groups[task.axeId] = {
          axeName: task.axeName,
          tasks: [],
        };
      }
      groups[task.axeId].tasks.push(task);
    });
    return Object.values(groups);
  }, [allTasks]);

  if (axes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-200"
      >
        <div className="flex items-center gap-3">
          <Calendar className="text-indigo-600" size={20} />
          <h3 className="text-lg font-semibold text-slate-900">Project Preview</h3>
          <span className="text-sm text-slate-500">({projectName || 'Untitled Project'})</span>
        </div>
        {expanded ? (
          <ChevronUp className="text-slate-600" size={20} />
        ) : (
          <ChevronDown className="text-slate-600" size={20} />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col overflow-hidden" style={{ maxHeight: '600px' }}>
          {/* Header Controls */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTimelineView('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  timelineView === 'daily'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTimelineView('weekly')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  timelineView === 'weekly'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimelineView('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  timelineView === 'monthly'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Not Started / Future</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Overdue</span>
              </div>
            </div>
          </div>

          {/* Gantt Chart Container */}
          {allTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Add tasks with date ranges to see them in the timeline</p>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
              {/* Fixed Left Panel */}
              <div 
                ref={leftPanelRef}
                className="flex-shrink-0 bg-white border-r border-slate-300 flex flex-col relative"
                style={{ 
                  width: `${leftPanelWidth}px`,
                  transition: isResizing ? 'none' : 'width 0.2s ease-out'
                }}
              >
                {/* Resize Handle */}
                <div
                  ref={resizeHandleRef}
                  onMouseDown={handleResizeStart}
                  className={`absolute right-0 top-0 bottom-0 z-30 flex items-center justify-center group cursor-col-resize ${
                    isResizing ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-100'
                  } transition-colors`}
                  style={{ 
                    width: '8px',
                    marginRight: '-4px',
                    userSelect: 'none',
                    touchAction: 'none'
                  }}
                  title="Drag to resize"
                >
                  <div 
                    className={`w-0.5 h-full ${
                      isResizing ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-500'
                    } transition-colors`}
                    style={{ width: '2px' }}
                  />
                </div>

                {/* Fixed Header */}
                <div className="flex-shrink-0 sticky top-0 bg-slate-50 border-b-2 border-slate-300 z-10">
                  <div className="flex gap-4 px-2 py-2">
                    <div 
                      className="font-semibold text-slate-700 text-sm flex-shrink-0" 
                      style={{ width: `${Math.max(200, leftPanelWidth * 0.6)}px` }}
                    >
                      Task
                    </div>
                    <div 
                      className="font-semibold text-slate-700 text-sm flex-shrink-0" 
                      style={{ width: `${Math.max(120, leftPanelWidth * 0.35)}px` }}
                    >
                      Responsible
                    </div>
                  </div>
                  <div style={{ height: '8px', width: '100%' }} />
                </div>

                {/* Fixed Content - Scrollable vertically */}
                <div className="flex-1 overflow-y-auto">
                  {groupedTasks.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-2">
                      {/* Group Header */}
                      <div 
                        className="bg-slate-100 rounded-lg px-4 py-2 font-semibold text-slate-900 mx-2 mt-2"
                        style={{ minHeight: '40px', height: '40px', display: 'flex', alignItems: 'center' }}
                      >
                        {group.axeName}
                      </div>

                      {/* Tasks in Group */}
                      {group.tasks.map((task) => {
                        const responsablesText = task.responsables.length > 0
                          ? task.responsables.map(id => getPersonnelName(id)).join(', ')
                          : 'None assigned';

                        return (
                          <div
                            key={task.taskId}
                            className="flex gap-4 items-center border-b border-slate-100 hover:bg-slate-50 bg-white"
                            style={{ 
                              minHeight: '32px', 
                              height: '32px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Task Description */}
                            <div 
                              className="text-sm text-slate-900 truncate flex-shrink-0" 
                              style={{ width: `${Math.max(200, leftPanelWidth * 0.6)}px` }}
                              title={task.description}
                            >
                              {task.description}
                            </div>

                            {/* Responsible */}
                            <div 
                              className="text-xs text-slate-600 truncate flex-shrink-0" 
                              style={{ width: `${Math.max(120, leftPanelWidth * 0.35)}px` }}
                              title={responsablesText}
                            >
                              {responsablesText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable Timeline Panel */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0, width: 0, maxWidth: '100%' }}>
                {/* Timeline Header */}
                <div 
                  ref={timelineHeaderRef}
                  className="flex-shrink-0 sticky top-0 bg-slate-50 border-b-2 border-slate-300 z-10 timeline-header" 
                  style={{ 
                    overflowX: 'auto', 
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <div 
                    className="grid gap-0" 
                    style={{ 
                      gridTemplateColumns: `repeat(${timelineUnits.length}, ${timelineView === 'daily' ? '70px' : timelineView === 'weekly' ? '100px' : '110px'})`,
                      width: `${timelineUnits.length * (timelineView === 'daily' ? 70 : timelineView === 'weekly' ? 100 : 110)}px`,
                      minWidth: `${timelineUnits.length * (timelineView === 'daily' ? 70 : timelineView === 'weekly' ? 100 : 110)}px`
                    }}
                  >
                    {timelineUnits.map((unit, index) => (
                      <div
                        key={index}
                        className="text-xs font-semibold text-slate-600 text-center border-r border-slate-300 px-1 py-2 bg-white whitespace-nowrap"
                        title={unit.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      >
                        {unit.label}
                      </div>
                    ))}
                  </div>
                  
                  {/* Scrollbar */}
                  <div 
                    ref={timelineScrollbarRef}
                    className="overflow-x-auto overflow-y-hidden timeline-scrollbar"
                    style={{ 
                      height: '12px',
                      width: '100%',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    <style>{`
                      .timeline-scrollbar::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div 
                      style={{ 
                        width: `${timelineUnits.length * (timelineView === 'daily' ? 70 : timelineView === 'weekly' ? 100 : 110)}px`,
                        height: '1px'
                      }}
                    />
                  </div>
                </div>

                {/* Timeline Content */}
                <div 
                  ref={timelineContentRef}
                  className="flex-1 timeline-content"
                  style={{ 
                    overflowY: 'auto',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <style>{`
                    .timeline-content::-webkit-scrollbar {
                      display: none;
                    }
                    .timeline-header::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  <div style={{ 
                    width: `${timelineUnits.length * (timelineView === 'daily' ? 70 : timelineView === 'weekly' ? 100 : 110)}px`,
                    minWidth: `${timelineUnits.length * (timelineView === 'daily' ? 70 : timelineView === 'weekly' ? 100 : 110)}px`
                  }}>
                    {groupedTasks.map((group, groupIndex) => (
                      <div key={groupIndex} className="space-y-2">
                        {/* Group Header Spacer */}
                        <div 
                          className="bg-slate-100 rounded-lg px-4 py-2 font-semibold text-slate-900 mx-2 mt-2 opacity-0 pointer-events-none" 
                          style={{ 
                            minHeight: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {group.axeName}
                        </div>

                        {/* Tasks in Group */}
                        {group.tasks.map((task) => {
                          const timelineStyle = getTaskTimelineStyle(task);

                          return (
                            <div
                              key={task.taskId}
                              className="relative border-b border-slate-100 hover:bg-slate-50 bg-white"
                              style={{ 
                                minHeight: '32px', 
                                height: '32px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div 
                                className="relative h-full w-full" 
                                style={{ height: '100%' }}
                              >
                                {timelineStyle ? (
                                  <div
                                    className={`absolute h-full ${getStatusColor(task)} hover:opacity-90 transition-opacity rounded`}
                                    style={{
                                      ...timelineStyle,
                                      top: '2px',
                                      height: 'calc(100% - 4px)',
                                    }}
                                    title={`${task.startDate ? new Date(task.startDate).toLocaleDateString() : ''} - ${task.endDate ? new Date(task.endDate).toLocaleDateString() : ''} | Priority: ${task.priority}`}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-slate-400 px-2">
                                    No date range
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPreview;

