import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  CheckSquare,
  AlertCircle,
  Square,
  Clock,
  Camera
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserSubmissions, FormSubmission } from '../../../../services/registrationSubmissionService';
import { getUserEvents, getEvent } from '../../../../services/eventService';
import { Event, EventDate } from '../../../../types';
import { toggleCheckin, getCheckinStatusMap, bulkToggleCheckin, RegistrationCheckin } from '../../../../services/checkinService';
import BadgerDisplay from './BadgerDisplay';

interface AcceptedRegistrationListProps {
  eventId?: string; // Optional: filter by specific event
}

const AcceptedRegistrationList: React.FC<AcceptedRegistrationListProps> = ({
  eventId
}) => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || 'all');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventData, setSelectedEventData] = useState<Event | null>(null);
  const [checkinMap, setCheckinMap] = useState<Map<string, RegistrationCheckin[]>>(new Map());
  const [checkingIn, setCheckingIn] = useState<Set<string>>(new Set());
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [checkinMode, setCheckinMode] = useState<'collective' | 'day-specific'>('collective');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [badgerOpen, setBadgerOpen] = useState(false);

  const deriveEventDays = (dates?: EventDate[] | null): EventDate[] => {
    if (!dates || dates.length === 0) return [];

    const dayMap = new Map<string, EventDate>();

    dates.forEach(range => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate || range.startDate);

      // Normalize times to midnight to avoid DST issues
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toISOString().slice(0, 10); // YYYY-MM-DD
        if (!dayMap.has(isoDate)) {
          dayMap.set(isoDate, {
            id: isoDate,
            startDate: isoDate,
            endDate: isoDate,
          });
        }
      }
    });

    return Array.from(dayMap.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser.id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedEvent && currentUser) {
      loadData(currentUser.id);
    }
  }, [selectedEvent]);

  useEffect(() => {
    filterSubmissions();
  }, [searchQuery, submissions, selectedEvent]);

  // Load selected event data when event changes
  useEffect(() => {
    const loadEventData = async () => {
      if (selectedEvent !== 'all' && currentUser) {
        try {
          const event = await getEvent(selectedEvent);
          if (!event) {
            setSelectedEventData(null);
            setCheckinMode('collective');
            setSelectedDayId(null);
            return;
          }
          setSelectedEventData(event);
          
          const days = deriveEventDays(event.dates);

          // If event has multiple days, default to day-specific mode
          if (days.length > 1) {
            setCheckinMode('day-specific');
            if (days.length > 0 && !selectedDayId) {
              setSelectedDayId(days[0].id);
            }
          } else {
            setCheckinMode('collective');
            setSelectedDayId(null);
          }
        } catch (err) {
          console.error('Error loading event data:', err);
        }
      } else {
        setSelectedEventData(null);
        setCheckinMode('collective');
        setSelectedDayId(null);
      }
    };

    loadEventData();
  }, [selectedEvent, currentUser]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      // Load events
      const userEvents = await getUserEvents(userId);
      setEvents(userEvents);

      // Load all submissions
      const allSubmissions = await getUserSubmissions(userId);

      // Filter to only accepted registrations
      const acceptedSubmissions = allSubmissions.filter(
        submission => submission.approvalStatus === 'accepted'
      );

      // Filter by event if specified
      let filtered = acceptedSubmissions;
      if (selectedEvent !== 'all') {
        filtered = acceptedSubmissions.filter(s => s.eventId === selectedEvent);
      }

      setSubmissions(filtered);

      // Load check-in statuses
      if (filtered.length > 0) {
        const submissionIds = filtered.map(s => s.id);
        const checkins = await getCheckinStatusMap(submissionIds);
        setCheckinMap(checkins);
      } else {
        setCheckinMap(new Map());
      }
    } catch (err: any) {
      setError('Failed to load registrations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Filter by search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(submission => {
        const name = (submission.generalInfo?.name || submission.submittedBy || '').toLowerCase();
        const email = (submission.generalInfo?.email || submission.answers['general_email'] as string || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    setFilteredSubmissions(filtered);
  };

  const handleCheckin = async (submission: FormSubmission, dayId?: string | null, dayLabel?: string) => {
    if (!currentUser?.id) return;

    try {
      setCheckingIn(prev => new Set(prev).add(submission.id));

      const checkin = await toggleCheckin(
        currentUser.id,
        submission.eventId,
        submission.id,
        currentUser.id,
        dayId,
        dayLabel
      );

      // Update check-in map
      const existingCheckins = checkinMap.get(submission.id) || [];
      const updatedCheckins = existingCheckins.filter(c => 
        (c.eventDayId || null) !== (dayId || null)
      );
      updatedCheckins.push(checkin);
      setCheckinMap(prev => new Map(prev).set(submission.id, updatedCheckins));

      // Reload check-in data to ensure consistency
      const submissionIds = [submission.id];
      const updatedMap = await getCheckinStatusMap(submissionIds);
      setCheckinMap(prev => {
        const newMap = new Map(prev);
        updatedMap.forEach((checkins, id) => {
          newMap.set(id, checkins);
        });
        return newMap;
      });
    } catch (err: any) {
      console.error('Error toggling check-in:', err);
      setError(err.message || 'Failed to update check-in status');
    } finally {
      setCheckingIn(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  const handleBulkCheckin = async () => {
    if (!currentUser?.id || selectedSubmissions.size === 0) return;

    try {
      setBulkCheckingIn(true);
      setError('');

      const submissionIds = Array.from(selectedSubmissions);
      const submissionsToCheckin = filteredSubmissions.filter(s => submissionIds.includes(s.id));

      let dayId: string | null = null;
      let dayLabel: string | undefined = undefined;

      if (checkinMode === 'day-specific' && selectedDayId) {
        const day = selectedEventData?.dates?.find(d => d.id === selectedDayId);
        dayId = selectedDayId;
        dayLabel = day ? formatDayLabel(day) : selectedDayId;
      }

      await bulkToggleCheckin(
        currentUser.id,
        selectedEvent !== 'all' ? selectedEvent : submissionsToCheckin[0]?.eventId || '',
        submissionIds,
        currentUser.id,
        dayId,
        dayLabel
      );

      // Reload check-in data
      const updatedMap = await getCheckinStatusMap(submissionIds);
      setCheckinMap(prev => {
        const newMap = new Map(prev);
        updatedMap.forEach((checkins, id) => {
          newMap.set(id, checkins);
        });
        return newMap;
      });

      // Clear selection
      setSelectedSubmissions(new Set());
    } catch (err: any) {
      console.error('Error bulk checking in:', err);
      setError(err.message || 'Failed to bulk check-in');
    } finally {
      setBulkCheckingIn(false);
    }
  };

  const toggleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const getCheckinStatus = (submissionId: string, dayId?: string | null): 'done' | 'undone' => {
    const checkins = checkinMap.get(submissionId) || [];
    
    if (dayId === null || dayId === undefined) {
      // Check for collective check-in (event_day_id is null)
      const collectiveCheckin = checkins.find(c => !c.eventDayId);
      return collectiveCheckin?.checkinStatus || 'undone';
    } else {
      // Check for day-specific check-in
      const dayCheckin = checkins.find(c => c.eventDayId === dayId);
      return dayCheckin?.checkinStatus || 'undone';
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDayLabel = (day: EventDate): string => {
    const startDate = new Date(day.startDate);
    const endDate = new Date(day.endDate);
    
    if (day.startDate === day.endDate) {
      return startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      return `${startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  };

  const getRowBackgroundColor = (submissionId: string, dayId?: string | null): string => {
    const status = getCheckinStatus(submissionId, dayId);
    if (status === 'done') {
      return 'bg-green-50 hover:bg-green-100';
    }
    return 'bg-yellow-50 hover:bg-yellow-100';
  };

  const getCheckedInCount = (): number => {
    let count = 0;
    filteredSubmissions.forEach(submission => {
      let isDone = false;

      if (checkinMode === 'collective') {
        // Count based on collective (all days) check-in
        isDone = getCheckinStatus(submission.id, null) === 'done';
      } else {
        // In daily mode, consider a registration checked in if any day has a done status
        const days = eventDays;
        isDone = days.some(day => getCheckinStatus(submission.id, day.id) === 'done');
      }

      if (isDone) {
        count++;
      }
    });
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const eventDays = deriveEventDays(selectedEventData?.dates);
  const hasMultipleDays = eventDays.length > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Accepted Registrations Check-in</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage check-in for accepted registrations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBadgerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
        >
          <Camera size={16} />
          Use Badger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Event Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setSelectedSubmissions(new Set());
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search by Name or Email
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      {/* Badger Display - Full Page QR Scanner */}
      <BadgerDisplay 
        isOpen={badgerOpen} 
        onClose={() => setBadgerOpen(false)}
        eventId={selectedEvent !== 'all' ? selectedEvent : undefined}
        eventName={selectedEventData?.name}
      />

      {/* (Check-in mode toggle and bulk actions moved into table header) */}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-700 font-medium">Total Accepted</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">{submissions.length}</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700 font-medium">Checked In</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {getCheckedInCount()}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-sm text-slate-700 font-medium">Pending Check-in</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {submissions.length - getCheckedInCount()}
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              {searchQuery ? 'No registrations found matching your search.' : 'No accepted registrations found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                    >
                      {selectedSubmissions.size === filteredSubmissions.length ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} className="text-slate-400 border-2 border-slate-300 rounded" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  {checkinMode === 'collective' || !hasMultipleDays ? (
                    <>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">View</span>
                          <div className="inline-flex rounded-full border border-slate-300 bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setCheckinMode('collective')}
                              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                                checkinMode === 'collective'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (hasMultipleDays && selectedEvent !== 'all') {
                                  setCheckinMode('day-specific');
                                }
                              }}
                              disabled={!hasMultipleDays || selectedEvent === 'all'}
                              className={`px-3 py-1 text-[11px] font-medium border-l border-slate-300 transition-colors ${
                                checkinMode === 'day-specific'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              } ${(!hasMultipleDays || selectedEvent === 'all') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Daily
                            </button>
                          </div>
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      {eventDays.map(day => (
                        <th
                          key={day.id}
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          {formatDayLabel(day)}
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">View</span>
                          <div className="inline-flex rounded-full border border-slate-300 bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setCheckinMode('collective')}
                              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                                checkinMode === 'collective'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (hasMultipleDays && selectedEvent !== 'all') {
                                  setCheckinMode('day-specific');
                                }
                              }}
                              disabled={!hasMultipleDays || selectedEvent === 'all'}
                              className={`px-3 py-1 text-[11px] font-medium border-l border-slate-300 transition-colors ${
                                checkinMode === 'day-specific'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              } ${(!hasMultipleDays || selectedEvent === 'all') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Daily
                            </button>
                          </div>
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredSubmissions.map(submission => {
                  const name = submission.generalInfo?.name || submission.submittedBy || 'Anonymous';
                  const email = (submission.generalInfo?.email || submission.answers['general_email'] as string || 'N/A') as string;
                  const isSelected = selectedSubmissions.has(submission.id);

                  const collectiveStatus = getCheckinStatus(submission.id, null);
                  const collectiveCheckins = checkinMap.get(submission.id) || [];
                  const collectiveCheckin = collectiveCheckins.find(c => !c.eventDayId);

                  const rowClass =
                    checkinMode === 'collective' || !hasMultipleDays
                      ? getRowBackgroundColor(submission.id, null)
                      : (() => {
                          const anyDayDone = eventDays.some(day => getCheckinStatus(submission.id, day.id) === 'done');
                          return anyDayDone ? 'bg-green-50 hover:bg-green-100' : 'bg-yellow-50 hover:bg-yellow-100';
                        })();

                  return (
                    <tr key={submission.id} className={rowClass}>
                      {/* Selection */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectSubmission(submission.id)}
                          className="flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} className="text-slate-400 border-2 border-slate-300 rounded" />
                          )}
                        </button>
                      </td>

                      {/* Participant */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-900 truncate">{name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="flex-shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatDate(submission.submittedAt)}</span>
                        </div>
                      </td>

                      {/* All mode: single status + button */}
                      {checkinMode === 'collective' || !hasMultipleDays ? (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {collectiveStatus === 'done' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={12} className="mr-1" />
                                Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                <XCircle size={12} className="mr-1" />
                                Not Checked In
                              </span>
                            )}
                            {collectiveCheckin?.checkedInAt && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock size={10} />
                                <span>
                                  {formatDate(collectiveCheckin.checkedInAt)}
                                  {collectiveCheckin.eventDayLabel && ` (${collectiveCheckin.eventDayLabel})`}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleCheckin(submission, null, 'All Days')}
                              disabled={checkingIn.has(submission.id)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                collectiveStatus === 'done'
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {checkingIn.has(submission.id) ? (
                                <>
                                  <Loader2 className="animate-spin" size={16} />
                                  Processing...
                                </>
                              ) : collectiveStatus === 'done' ? (
                                <>
                                  <XCircle size={16} />
                                  Undo Check-in
                                </>
                              ) : (
                                <>
                                  <CheckSquare size={16} />
                                  Check In
                                </>
                              )}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          {eventDays.map(day => {
                            const status = getCheckinStatus(submission.id, day.id);
                            const dayCheckins = checkinMap.get(submission.id) || [];
                            const dayCheckin = dayCheckins.find(c => c.eventDayId === day.id);
                            const isCheckingIn = checkingIn.has(submission.id);

                            return (
                              <td key={day.id} className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {status === 'done' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                                      <CheckCircle size={10} className="mr-1" />
                                      Done
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                      <XCircle size={10} className="mr-1" />
                                      Not Done
                                    </span>
                                  )}
                                  {dayCheckin?.checkedInAt && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                      <Clock size={10} />
                                      <span>{formatDate(dayCheckin.checkedInAt)}</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleCheckin(submission, day.id, formatDayLabel(day))}
                                    disabled={isCheckingIn}
                                    className={`mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                      status === 'done'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isCheckingIn ? (
                                      <Loader2 className="animate-spin" size={12} />
                                    ) : status === 'done' ? (
                                      <XCircle size={12} />
                                    ) : (
                                      <CheckSquare size={12} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                          {/* Empty cell to align toggle in header */}
                          <td className="px-4 py-3" />
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptedRegistrationList;
