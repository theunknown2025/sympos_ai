import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Project } from '../../../../services/projectService';
import { Personnel } from '../../../../services/personnelService';

interface ProjectPlanViewProps {
  projects: Project[];
  personnel: Personnel[];
  onClose: () => void;
  inline?: boolean;
}

type TimelineView = 'daily' | 'weekly' | 'monthly';

interface TaskWithProject {
  projectId: string;
  projectName: string;
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

const ProjectPlanView: React.FC<ProjectPlanViewProps> = ({ projects, personnel, onClose, inline = false }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [timelineView, setTimelineView] = useState<TimelineView>('monthly');
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(400);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  
  // Refs for scroll synchronization
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const timelineScrollbarRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Flatten all tasks from all projects with their project and axe info
  const allTasks: TaskWithProject[] = useMemo(() => {
    const tasks: TaskWithProject[] = [];
    projects.forEach((project) => {
      project.axes.forEach((axe) => {
        axe.tasks.forEach((task) => {
          tasks.push({
            projectId: project.id,
            projectName: project.name,
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
    });
    return tasks;
  }, [projects]);

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
        // Start from the beginning of the week (Monday)
        const weekStart = new Date(current);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        
        while (weekStart <= end) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          // Format label: "Jan 1 - 7" or "Jan 1 - Jan 7" if different months
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
    const contentElement = timelineContentRef.current;
    const scrollbarElement = timelineScrollbarRef.current;
    const headerElement = timelineHeaderRef.current;
    
    if (!contentElement || !scrollbarElement || !headerElement) return;
    
    // Prevent infinite scroll loops
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
  }, [timelineView, timelineUnits.length]);

  // Handle resize of left panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !leftPanelRef.current) return;
      
      const newWidth = e.clientX - leftPanelRef.current.getBoundingClientRect().left;
      // Constrain width between 250px and 800px
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
  }, [isResizing]);
  
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // Calculate task position and width in timeline
  const getTaskTimelineStyle = (task: TaskWithProject) => {
    if (!task.startDate || !task.endDate) return null;

    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get the timeline range
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
          // Get the last day of the last month
          timelineEnd = new Date(lastUnit.getFullYear(), lastUnit.getMonth() + 1, 0);
          timelineEnd.setHours(23, 59, 59, 999);
          break;
        default:
          timelineEnd = new Date(lastUnit);
          timelineEnd.setHours(23, 59, 59, 999);
      }
    }

    // Calculate total timeline duration in milliseconds
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    
    // Calculate task start and end positions relative to timeline start
    const taskStartPosition = startDate.getTime() - timelineStart.getTime();
    const taskEndPosition = endDate.getTime() - timelineStart.getTime();
    
    // Ensure positions are within timeline bounds
    const clampedStartPosition = Math.max(0, taskStartPosition);
    const clampedEndPosition = Math.min(totalDuration, taskEndPosition);
    
    // Calculate percentages
    const left = (clampedStartPosition / totalDuration) * 100;
    const width = ((clampedEndPosition - clampedStartPosition) / totalDuration) * 100;

    // Ensure minimum width for visibility
    const minWidth = timelineView === 'daily' ? 0.5 : timelineView === 'weekly' ? 1 : 2;
    const finalWidth = Math.max(width, minWidth);

    return { left: `${left}%`, width: `${finalWidth}%` };
  };

  // Scroll to task's start date
  const scrollToTaskStartDate = (task: TaskWithProject) => {
    if (!task.startDate || timelineUnits.length === 0) return;

    const startDate = new Date(task.startDate);
    startDate.setHours(0, 0, 0, 0);

    // Get the timeline range
    const timelineStart = new Date(timelineUnits[0].date);
    timelineStart.setHours(0, 0, 0, 0);

    const lastUnit = new Date(timelineUnits[timelineUnits.length - 1].date);
    let timelineEnd: Date;
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

    // Calculate total timeline duration
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    
    // Calculate task start position relative to timeline start
    const taskStartPosition = startDate.getTime() - timelineStart.getTime();
    
    // Calculate scroll position as percentage
    const scrollPercentage = Math.max(0, Math.min(1, taskStartPosition / totalDuration));
    
    // Get the scrollable elements
    const contentElement = timelineContentRef.current;
    const scrollbarElement = timelineScrollbarRef.current;
    const headerElement = timelineHeaderRef.current;
    
    if (!contentElement || !scrollbarElement || !headerElement) return;

    // Calculate the scroll position in pixels
    const maxScrollLeft = contentElement.scrollWidth - contentElement.clientWidth;
    const targetScrollLeft = scrollPercentage * maxScrollLeft;

    // Scroll all three elements to the target position
    contentElement.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
    scrollbarElement.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
    headerElement.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  };

  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find(p => p.id === personnelId);
    return person ? person.fullName : personnelId;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusColor = (task: TaskWithProject) => {
    if (!task.endDate) return 'bg-slate-300';
    const endDate = new Date(task.endDate);
    const today = new Date();
    if (endDate < today) return 'bg-red-500'; // Overdue
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      if (startDate <= today && endDate >= today) return 'bg-orange-500'; // In progress
    }
    return 'bg-green-500'; // Not started / Future
  };

  // Filter tasks by selected project
  const filteredTasks = selectedProjectId
    ? allTasks.filter(task => task.projectId === selectedProjectId)
    : allTasks;

  // Group tasks by project and axe
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: { projectName: string; axeName: string; tasks: TaskWithProject[] } } = {};
    filteredTasks.forEach(task => {
      const key = `${task.projectId}-${task.axeId}`;
      if (!groups[key]) {
        groups[key] = {
          projectName: task.projectName,
          axeName: task.axeName,
          tasks: [],
        };
      }
      groups[key].tasks.push(task);
    });
    return Object.values(groups);
  }, [filteredTasks]);

  const content = (
    <div className={`${inline ? 'bg-white rounded-xl border border-slate-200' : 'bg-white rounded-xl shadow-xl max-w-[95vw] w-full max-h-[90vh]'} overflow-hidden flex flex-col`} style={{ width: inline ? '100%' : '95vw', maxWidth: '95vw' }}>
      {/* Header */}
      <div className={`${inline ? 'px-4 py-3' : 'px-6 py-4'} sticky top-0 bg-white border-b border-slate-200 flex items-center justify-between z-10`}>
        <div className="flex items-center gap-3">
          <Calendar className="text-indigo-600" size={inline ? 20 : 24} />
          <h2 className={`${inline ? 'text-lg' : 'text-2xl'} font-bold text-slate-900`}>Project Plan View</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Timeline View Selector */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
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
          {projects.length > 1 && (
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          )}
          {!inline && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col ${inline ? 'p-4' : 'p-6'} overflow-hidden`}>
          {allTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">Add tasks with date ranges to see them in the timeline</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Gantt Chart Container */}
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
                    {/* Visual indicator line */}
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
                    {/* Spacer to match timeline scrollbar height */}
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
                          {group.projectName} - {group.axeName}
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
                  {/* Timeline Header - Fixed at top */}
                  <div 
                    ref={timelineHeaderRef}
                    className="flex-shrink-0 sticky top-0 bg-slate-50 border-b-2 border-slate-300 z-10 timeline-header" 
                    style={{ 
                      overflowX: 'auto', 
                      overflowY: 'hidden',
                      scrollbarWidth: 'none', /* Firefox */
                      msOverflowStyle: 'none', /* IE and Edge */
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
                    
                    {/* Dedicated Scrollbar under timeline header - Hidden but functional */}
                    <div 
                      ref={timelineScrollbarRef}
                      className="overflow-x-auto overflow-y-hidden timeline-scrollbar"
                      style={{ 
                        height: '12px',
                        width: '100%',
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none', /* IE and Edge */
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

                  {/* Timeline Content - Scrollable container */}
                  <div 
                    ref={timelineContentRef}
                    className="flex-1 timeline-content"
                    style={{ 
                      overflowY: 'auto',
                      overflowX: 'auto',
                      scrollbarWidth: 'none', /* Firefox */
                      msOverflowStyle: 'none', /* IE and Edge */
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
                          {/* Group Header Spacer - Must match fixed panel height exactly */}
                          <div 
                            className="bg-slate-100 rounded-lg px-4 py-2 font-semibold text-slate-900 mx-2 mt-2 opacity-0 pointer-events-none" 
                            style={{ 
                              minHeight: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {group.projectName} - {group.axeName}
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
                                {/* Timeline Bar Container */}
                                <div 
                                  className="relative h-full w-full" 
                                  style={{ 
                                    height: '100%'
                                  }}
                                >
                                  {timelineStyle ? (
                                    <div
                                      className={`absolute h-full ${getStatusColor(task)} hover:opacity-90 transition-opacity cursor-pointer rounded`}
                                      style={{
                                        ...timelineStyle,
                                        top: '2px',
                                        height: 'calc(100% - 4px)',
                                      }}
                                      title={`${task.startDate ? new Date(task.startDate).toLocaleDateString() : ''} - ${task.endDate ? new Date(task.endDate).toLocaleDateString() : ''} | Priority: ${task.priority}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        scrollToTaskStartDate(task);
                                      }}
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
            </div>
          )}
        </div>

      {/* Footer */}
      {!inline && (
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Not Started / Future</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Overdue</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}
      {inline && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Not Started / Future</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Overdue</span>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
};

export default ProjectPlanView;

