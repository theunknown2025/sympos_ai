import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserSubmissions, FormSubmission } from '../../../../services/registrationSubmissionService';
import { getUserEvents, getEvent } from '../../../../services/eventService';
import { Event, EventDate, RegistrationForm } from '../../../../types';
import { toggleCheckin, getCheckinStatusMap, bulkToggleCheckin, RegistrationCheckin } from '../../../../services/checkinService';
import BadgerDisplay from './BadgerDisplay';
import CheckinParticipantsTable from './CheckinParticipantsTable';
import CheckinDisplayConfigModal from './CheckinDisplayConfigModal';
import {
  isRegistrationCheckinRow,
  isSubmissionCheckinRow,
  resolveEventForSubmission,
} from '../../../../utils/checkinRowClassification';
import { getSubmissionDisplayTitle } from '../../../../services/submissionBadgeService';
import { useOrganizerScopedEventId } from '../../../../contexts/OrganizerEventScopeContext';
import { getRegistrationForm } from '../../../../services/registrationFormService';
import {
  buildCheckinSelectableFields,
  getCheckinDisplayFieldKeys,
  type CheckinDisplayKind,
} from '../../../../services/checkinDisplayFields';
import {
  findCertificateFieldLabel,
  resolveCertificateFieldValue,
} from '../../../../services/certificateTemplateFields';

interface AcceptedRegistrationListProps {
  eventId?: string;
}

const AcceptedRegistrationList: React.FC<AcceptedRegistrationListProps> = ({ eventId }) => {
  const { currentUser } = useAuth();
  const organizerScopedEventId = useOrganizerScopedEventId();
  const isEventScopeLocked = !!organizerScopedEventId;
  const [registrationRows, setRegistrationRows] = useState<FormSubmission[]>([]);
  const [submissionRows, setSubmissionRows] = useState<FormSubmission[]>([]);
  const [filteredRegistrationRows, setFilteredRegistrationRows] = useState<FormSubmission[]>([]);
  const [filteredSubmissionRows, setFilteredSubmissionRows] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || 'all');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventData, setSelectedEventData] = useState<Event | null>(null);
  const [checkinMap, setCheckinMap] = useState<Map<string, RegistrationCheckin[]>>(new Map());
  const [checkingIn, setCheckingIn] = useState<Set<string>>(new Set());
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<Set<string>>(new Set());
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [checkinMode, setCheckinMode] = useState<'collective' | 'day-specific'>('collective');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [badgerOpen, setBadgerOpen] = useState(false);
  const [eventForms, setEventForms] = useState<RegistrationForm[]>([]);
  const [configModalKind, setConfigModalKind] = useState<CheckinDisplayKind | null>(null);

  const deriveEventDays = (dates?: EventDate[] | null): EventDate[] => {
    if (!dates || dates.length === 0) return [];

    const dayMap = new Map<string, EventDate>();

    dates.forEach((range) => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate || range.startDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toISOString().slice(0, 10);
        if (!dayMap.has(isoDate)) {
          dayMap.set(isoDate, { id: isoDate, startDate: isoDate, endDate: isoDate });
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
    filterRows();
  }, [searchQuery, registrationRows, submissionRows]);

  useEffect(() => {
    if (organizerScopedEventId) {
      setSelectedEvent(organizerScopedEventId);
    }
  }, [organizerScopedEventId]);

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

  useEffect(() => {
    const loadForms = async () => {
      if (!selectedEventData) {
        setEventForms([]);
        return;
      }

      const formIds = [
        ...(selectedEventData.registrationFormIds || []),
        ...(selectedEventData.submissionFormIds || []),
        ...(selectedEventData.abstractSubmissionFormIds || []),
      ];
      const uniqueIds = [...new Set(formIds)];
      if (uniqueIds.length === 0) {
        setEventForms([]);
        return;
      }

      try {
        const loaded = await Promise.all(uniqueIds.map((id) => getRegistrationForm(id)));
        setEventForms(loaded.filter((f): f is RegistrationForm => f !== null));
      } catch (err) {
        console.error('Error loading event forms for check-in display:', err);
        setEventForms([]);
      }
    };

    void loadForms();
  }, [selectedEventData]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      const userEvents = await getUserEvents(userId);
      setEvents(userEvents);

      const allSubmissions = await getUserSubmissions(userId);
      const eventForFilter =
        selectedEvent !== 'all' ? userEvents.find((e) => e.id === selectedEvent) ?? null : null;

      const reg: FormSubmission[] = [];
      const sub: FormSubmission[] = [];

      for (const row of allSubmissions) {
        const ev =
          selectedEvent !== 'all' ? eventForFilter : resolveEventForSubmission(row, userEvents);
        if (!ev) continue;
        if (selectedEvent !== 'all' && ev.id !== selectedEvent) continue;
        if (isRegistrationCheckinRow(row, ev)) reg.push(row);
        if (isSubmissionCheckinRow(row, ev)) sub.push(row);
      }

      setRegistrationRows(reg);
      setSubmissionRows(sub);

      const allIds = [...reg, ...sub].map((s) => s.id);
      if (allIds.length > 0) {
        const checkins = await getCheckinStatusMap(allIds);
        setCheckinMap(checkins);
      } else {
        setCheckinMap(new Map());
      }
    } catch (err) {
      setError('Failed to load check-in list. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterBySearch = (list: FormSubmission[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter((submission) => {
      const name = (submission.generalInfo?.name || submission.submittedBy || '').toLowerCase();
      const email = (
        submission.generalInfo?.email ||
        (submission.answers['general_email'] as string) ||
        ''
      ).toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  };

  const filterRows = () => {
    setFilteredRegistrationRows(filterBySearch(registrationRows));
    setFilteredSubmissionRows(filterBySearch(submissionRows));
  };

  const handleCheckin = async (submission: FormSubmission, dayId?: string | null, dayLabel?: string) => {
    if (!currentUser?.id) return;

    try {
      setCheckingIn((prev) => new Set(prev).add(submission.id));

      const checkin = await toggleCheckin(
        currentUser.id,
        submission.eventId,
        submission.id,
        currentUser.id,
        dayId,
        dayLabel
      );

      const existingCheckins = checkinMap.get(submission.id) || [];
      const updatedCheckins = existingCheckins.filter((c) => (c.eventDayId || null) !== (dayId || null));
      updatedCheckins.push(checkin);
      setCheckinMap((prev) => new Map(prev).set(submission.id, updatedCheckins));

      const updatedMap = await getCheckinStatusMap([submission.id]);
      setCheckinMap((prev) => {
        const newMap = new Map(prev);
        updatedMap.forEach((checkins, id) => newMap.set(id, checkins));
        return newMap;
      });
    } catch (err: unknown) {
      console.error('Error toggling check-in:', err);
      const message = err instanceof Error ? err.message : 'Failed to update check-in status';
      setError(message);
    } finally {
      setCheckingIn((prev) => {
        const next = new Set(prev);
        next.delete(submission.id);
        return next;
      });
    }
  };

  const handleBulkCheckin = async (
    selectedIds: Set<string>,
    rows: FormSubmission[],
    clearSelection: () => void
  ) => {
    if (!currentUser?.id || selectedIds.size === 0) return;

    try {
      setBulkCheckingIn(true);
      setError('');

      const submissionIds = Array.from(selectedIds);
      const submissionsToCheckin = rows.filter((s) => submissionIds.includes(s.id));

      let dayId: string | null = null;
      let dayLabel: string | undefined;

      if (checkinMode === 'day-specific' && selectedDayId) {
        const day = selectedEventData?.dates?.find((d) => d.id === selectedDayId);
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

      const updatedMap = await getCheckinStatusMap(submissionIds);
      setCheckinMap((prev) => {
        const newMap = new Map(prev);
        updatedMap.forEach((checkins, id) => newMap.set(id, checkins));
        return newMap;
      });

      clearSelection();
    } catch (err: unknown) {
      console.error('Error bulk checking in:', err);
      const message = err instanceof Error ? err.message : 'Failed to bulk check-in';
      setError(message);
    } finally {
      setBulkCheckingIn(false);
    }
  };

  const toggleSelectId = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllInList = (
    selected: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    rows: FormSubmission[]
  ) => {
    if (selected.size === rows.length && rows.length > 0) {
      setter(new Set());
    } else {
      setter(new Set(rows.map((s) => s.id)));
    }
  };

  const getCheckinStatus = (submissionId: string, dayId?: string | null): 'done' | 'undone' => {
    const checkins = checkinMap.get(submissionId) || [];

    if (dayId === null || dayId === undefined) {
      const collectiveCheckin = checkins.find((c) => !c.eventDayId);
      return collectiveCheckin?.checkinStatus || 'undone';
    }

    const dayCheckin = checkins.find((c) => c.eventDayId === dayId);
    return dayCheckin?.checkinStatus || 'undone';
  };

  const formatDate = (date: Date): string =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDayLabel = (day: EventDate): string => {
    const startDate = new Date(day.startDate);
    const endDate = new Date(day.endDate);

    if (day.startDate === day.endDate) {
      return startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getCheckedInCount = (rows: FormSubmission[], days: EventDate[]): number => {
    let count = 0;
    rows.forEach((submission) => {
      const isDone =
        checkinMode === 'collective'
          ? getCheckinStatus(submission.id, null) === 'done'
          : days.some((day) => getCheckinStatus(submission.id, day.id) === 'done');
      if (isDone) count++;
    });
    return count;
  };

  const buildDisplayColumns = useCallback(
    (kind: CheckinDisplayKind) => {
      if (!selectedEventData) return [];
      const keys = getCheckinDisplayFieldKeys(selectedEventData, kind);
      const catalog = buildCheckinSelectableFields(selectedEventData, eventForms, kind);
      return keys.map((key) => ({
        key,
        label: findCertificateFieldLabel(key, undefined, catalog),
      }));
    },
    [selectedEventData, eventForms]
  );

  const registrationDisplayColumns = useMemo(
    () => buildDisplayColumns('registration'),
    [buildDisplayColumns]
  );
  const submissionDisplayColumns = useMemo(
    () => buildDisplayColumns('submission'),
    [buildDisplayColumns]
  );

  const getDisplayValue = useCallback(
    (submission: FormSubmission, fieldKey: string) =>
      resolveCertificateFieldValue(fieldKey, submission, selectedEventData),
    [selectedEventData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const eventDays = deriveEventDays(selectedEventData?.dates);
  const hasMultipleDays = eventDays.length > 1;
  const showSubmissionsTable = Boolean(selectedEventData?.submissionFormIds?.length);
  const eventSelected = selectedEvent !== 'all';
  const allFilteredRows = [...filteredRegistrationRows, ...filteredSubmissionRows];
  const totalRows = registrationRows.length + submissionRows.length;
  const checkedInTotal = getCheckedInCount(allFilteredRows, eventDays);

  const tableSharedProps = {
    checkinMap,
    checkingIn,
    checkinMode,
    eventDays,
    hasMultipleDays,
    selectedEventIsAll: selectedEvent === 'all',
    onCheckin: handleCheckin,
    onCheckinModeChange: setCheckinMode,
    getCheckinStatus,
    formatDate,
    formatDayLabel,
  };

  const renderBulkBar = (
    selectedIds: Set<string>,
    rows: FormSubmission[],
    clearSelection: () => void,
    label: string
  ) => {
    if (selectedIds.size === 0) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
        <span className="text-sm text-indigo-900">
          {selectedIds.size} {label} selected
        </span>
        <button
          type="button"
          disabled={bulkCheckingIn}
          onClick={() => handleBulkCheckin(selectedIds, rows, clearSelection)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {bulkCheckingIn ? <Loader2 className="animate-spin" size={14} /> : null}
          Bulk check-in
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check-in</h2>
          <p className="text-sm text-slate-600 mt-1">
            Registrations and submission presenters for the selected event
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBadgerOpen(true)}
          disabled={selectedEvent === 'all'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors shrink-0 ${
            selectedEvent === 'all'
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          title={selectedEvent === 'all' ? 'Select an event first' : 'Open QR scanner'}
        >
          <Camera size={16} />
          Use Badger
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">Event</label>
          {isEventScopeLocked ? (
            <p className="w-full text-sm text-slate-600 py-2">
              Showing only your selected event (change it from the header).
            </p>
          ) : (
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setSelectedRegistrationIds(new Set());
                setSelectedSubmissionIds(new Set());
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">Search by Name or Email</label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
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

      <BadgerDisplay
        isOpen={badgerOpen}
        onClose={() => setBadgerOpen(false)}
        eventId={eventSelected ? selectedEvent : undefined}
        eventName={selectedEventData?.name}
        eventData={selectedEventData}
        eventForms={eventForms}
      />

      <CheckinDisplayConfigModal
        isOpen={configModalKind === 'registration'}
        onClose={() => setConfigModalKind(null)}
        eventId={eventSelected ? selectedEvent : undefined}
        kind="registration"
        onSaved={setSelectedEventData}
      />
      <CheckinDisplayConfigModal
        isOpen={configModalKind === 'submission'}
        onClose={() => setConfigModalKind(null)}
        eventId={eventSelected ? selectedEvent : undefined}
        kind="submission"
        onSaved={setSelectedEventData}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-700 font-medium">Total</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">{totalRows}</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700 font-medium">Checked In</div>
          <div className="text-2xl font-bold text-green-900 mt-1">{checkedInTotal}</div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-sm text-slate-700 font-medium">Pending</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalRows - checkedInTotal}</div>
        </div>
      </div>

      <div className="space-y-3">
        {renderBulkBar(
          selectedRegistrationIds,
          filteredRegistrationRows,
          () => setSelectedRegistrationIds(new Set()),
          'registration'
        )}
        <CheckinParticipantsTable
          title="Registrations"
          subtitle="Simple event registrations"
          emptyMessage={
            searchQuery
              ? 'No registrations match your search.'
              : 'No accepted registrations for this event.'
          }
          rows={filteredRegistrationRows}
          selectedIds={selectedRegistrationIds}
          onToggleSelect={(id) => toggleSelectId(setSelectedRegistrationIds, id)}
          onToggleSelectAll={() =>
            toggleSelectAllInList(
              selectedRegistrationIds,
              setSelectedRegistrationIds,
              filteredRegistrationRows
            )
          }
          displayColumns={registrationDisplayColumns}
          getDisplayValue={getDisplayValue}
          configureMenuLabel="Configure check-in Registration"
          onConfigure={() => setConfigModalKind('registration')}
          configureDisabled={!eventSelected}
          configureDisabledHint="Select an event first"
          {...tableSharedProps}
        />
      </div>

      {showSubmissionsTable ? (
        <div className="space-y-3">
          {renderBulkBar(
            selectedSubmissionIds,
            filteredSubmissionRows,
            () => setSelectedSubmissionIds(new Set()),
            'presenter'
          )}
          <CheckinParticipantsTable
            title="Submissions"
            subtitle="Accepted article presenters"
            emptyMessage={
              searchQuery
                ? 'No submissions match your search.'
                : 'No accepted submission presenters for this event.'
            }
            rows={filteredSubmissionRows}
            selectedIds={selectedSubmissionIds}
            onToggleSelect={(id) => toggleSelectId(setSelectedSubmissionIds, id)}
            onToggleSelectAll={() =>
              toggleSelectAllInList(
                selectedSubmissionIds,
                setSelectedSubmissionIds,
                filteredSubmissionRows
              )
            }
            extraColumnHeader="Paper"
            renderExtraCell={(submission) => (
              <span className="line-clamp-2">{getSubmissionDisplayTitle(submission)}</span>
            )}
            displayColumns={submissionDisplayColumns}
            getDisplayValue={getDisplayValue}
            configureMenuLabel="Configure check-in Submission"
            onConfigure={() => setConfigModalKind('submission')}
            configureDisabled={!eventSelected}
            configureDisabledHint="Select an event first"
            {...tableSharedProps}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AcceptedRegistrationList;
