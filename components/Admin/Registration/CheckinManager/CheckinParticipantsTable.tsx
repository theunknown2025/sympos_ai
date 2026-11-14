import React from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';
import type { FormSubmission, EventDate } from '../../../../types';
import type { RegistrationCheckin } from '../../../../services/checkinService';
import CheckinSectionGearMenu from './CheckinSectionGearMenu';

export interface CheckinParticipantsTableProps {
  title: string;
  subtitle?: string;
  emptyMessage: string;
  rows: FormSubmission[];
  checkinMap: Map<string, RegistrationCheckin[]>;
  checkingIn: Set<string>;
  selectedIds: Set<string>;
  checkinMode: 'collective' | 'day-specific';
  eventDays: EventDate[];
  hasMultipleDays: boolean;
  selectedEventIsAll: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onCheckin: (submission: FormSubmission, dayId?: string | null, dayLabel?: string) => void;
  onCheckinModeChange: (mode: 'collective' | 'day-specific') => void;
  getCheckinStatus: (submissionId: string, dayId?: string | null) => 'done' | 'undone';
  formatDate: (date: Date) => string;
  formatDayLabel: (day: EventDate) => string;
  extraColumnHeader?: string;
  renderExtraCell?: (submission: FormSubmission) => React.ReactNode;
  displayColumns?: Array<{ key: string; label: string }>;
  getDisplayValue?: (submission: FormSubmission, fieldKey: string) => string;
  configureMenuLabel?: string;
  onConfigure?: () => void;
  configureDisabled?: boolean;
  configureDisabledHint?: string;
}

const CheckinParticipantsTable: React.FC<CheckinParticipantsTableProps> = ({
  title,
  subtitle,
  emptyMessage,
  rows,
  checkinMap,
  checkingIn,
  selectedIds,
  checkinMode,
  eventDays,
  hasMultipleDays,
  selectedEventIsAll,
  onToggleSelect,
  onToggleSelectAll,
  onCheckin,
  onCheckinModeChange,
  getCheckinStatus,
  formatDate,
  formatDayLabel,
  extraColumnHeader,
  renderExtraCell,
  displayColumns = [],
  getDisplayValue,
  configureMenuLabel,
  onConfigure,
  configureDisabled = false,
  configureDisabledHint,
}) => {
  const getRowBackgroundColor = (submissionId: string, dayId?: string | null): string => {
    if (getCheckinStatus(submissionId, dayId) === 'done') {
      return 'bg-green-50 hover:bg-green-100';
    }
    return 'bg-yellow-50 hover:bg-yellow-100';
  };

  return (
    <section className="space-y-3">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        configureMenuLabel={configureMenuLabel}
        onConfigure={onConfigure}
        configureDisabled={configureDisabled}
        configureDisabledHint={configureDisabledHint}
      />
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10">
                    <button type="button" onClick={onToggleSelectAll} className="flex items-center justify-center">
                      {selectedIds.size === rows.length && rows.length > 0 ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} className="text-slate-400 border-2 border-slate-300 rounded" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Participant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                  {extraColumnHeader ? (
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      {extraColumnHeader}
                    </th>
                  ) : null}
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
                  {checkinMode === 'collective' || !hasMultipleDays ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        <CheckinModeToggle
                          checkinMode={checkinMode}
                          hasMultipleDays={hasMultipleDays}
                          selectedEventIsAll={selectedEventIsAll}
                          onCheckinModeChange={onCheckinModeChange}
                        />
                      </th>
                    </>
                  ) : (
                    <>
                      {eventDays.map((day) => (
                        <th
                          key={day.id}
                          className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase"
                        >
                          {formatDayLabel(day)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                        <CheckinModeToggle
                          checkinMode={checkinMode}
                          hasMultipleDays={hasMultipleDays}
                          selectedEventIsAll={selectedEventIsAll}
                          onCheckinModeChange={onCheckinModeChange}
                        />
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {rows.map((submission) => {
                  const name = submission.generalInfo?.name || submission.submittedBy || 'Anonymous';
                  const email = (submission.generalInfo?.email ||
                    submission.answers['general_email'] ||
                    'N/A') as string;
                  const collectiveStatus = getCheckinStatus(submission.id, null);
                  const collectiveCheckins = checkinMap.get(submission.id) || [];
                  const collectiveCheckin = collectiveCheckins.find((c) => !c.eventDayId);
                  const rowClass =
                    checkinMode === 'collective' || !hasMultipleDays
                      ? getRowBackgroundColor(submission.id, null)
                      : eventDays.some((day) => getCheckinStatus(submission.id, day.id) === 'done')
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-yellow-50 hover:bg-yellow-100';

                  return (
                    <tr key={submission.id} className={rowClass}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => onToggleSelect(submission.id)}>
                          {selectedIds.has(submission.id) ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} className="text-slate-400 border-2 border-slate-300 rounded" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <NameCell name={name} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        <EmailCell email={email} />
                      </td>
                      {renderExtraCell ? (
                        <td className="px-4 py-3 text-sm text-slate-700">{renderExtraCell(submission)}</td>
                      ) : null}
                      {displayColumns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-slate-700 max-w-[12rem]">
                          <span className="line-clamp-2">
                            {getDisplayValue?.(submission, col.key) || '—'}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        <DateCell date={submission.submittedAt} formatDate={formatDate} />
                      </td>
                      {checkinMode === 'collective' || !hasMultipleDays ? (
                        <CollectiveCheckinCells
                          collectiveStatus={collectiveStatus}
                          collectiveCheckin={collectiveCheckin}
                          submission={submission}
                          checkingIn={checkingIn.has(submission.id)}
                          formatDate={formatDate}
                          onCheckin={onCheckin}
                        />
                      ) : (
                        <DailyCheckinCells
                          submission={submission}
                          eventDays={eventDays}
                          checkingIn={checkingIn.has(submission.id)}
                          getCheckinStatus={getCheckinStatus}
                          checkinMap={checkinMap}
                          formatDate={formatDate}
                          formatDayLabel={formatDayLabel}
                          onCheckin={onCheckin}
                        />
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

function SectionHeader({
  title,
  subtitle,
  configureMenuLabel,
  onConfigure,
  configureDisabled,
  configureDisabledHint,
}: {
  title: string;
  subtitle?: string;
  configureMenuLabel?: string;
  onConfigure?: () => void;
  configureDisabled?: boolean;
  configureDisabledHint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {configureMenuLabel && onConfigure ? (
        <CheckinSectionGearMenu
          menuLabel={configureMenuLabel}
          onConfigure={onConfigure}
          disabled={configureDisabled}
          disabledHint={configureDisabledHint}
        />
      ) : null}
    </div>
  );
}

function NameCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <User size={16} className="text-slate-400 shrink-0" />
      <span className="font-medium text-slate-900 truncate">{name}</span>
    </div>
  );
}

function EmailCell({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2">
      <Mail size={14} className="shrink-0" />
      <span className="truncate">{email}</span>
    </div>
  );
}

function DateCell({ date, formatDate }: { date: Date; formatDate: (d: Date) => string }) {
  return (
    <div className="flex items-center gap-1">
      <Calendar size={12} />
      <span>{formatDate(date)}</span>
    </div>
  );
}

function CheckinModeToggle({
  checkinMode,
  hasMultipleDays,
  selectedEventIsAll,
  onCheckinModeChange,
}: {
  checkinMode: 'collective' | 'day-specific';
  hasMultipleDays: boolean;
  selectedEventIsAll: boolean;
  onCheckinModeChange: (mode: 'collective' | 'day-specific') => void;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-[11px] text-slate-500">View</span>
      <div className="inline-flex rounded-full border border-slate-300 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => onCheckinModeChange('collective')}
          className={`px-3 py-1 text-[11px] font-medium ${
            checkinMode === 'collective' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onCheckinModeChange('day-specific')}
          disabled={!hasMultipleDays || selectedEventIsAll}
          className={`px-3 py-1 text-[11px] font-medium border-l border-slate-300 ${
            checkinMode === 'day-specific' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          } ${!hasMultipleDays || selectedEventIsAll ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Daily
        </button>
      </div>
    </div>
  );
}

function CollectiveCheckinCells({
  collectiveStatus,
  collectiveCheckin,
  submission,
  checkingIn,
  formatDate,
  onCheckin,
}: {
  collectiveStatus: 'done' | 'undone';
  collectiveCheckin?: RegistrationCheckin;
  submission: FormSubmission;
  checkingIn: boolean;
  formatDate: (d: Date) => string;
  onCheckin: CheckinParticipantsTableProps['onCheckin'];
}) {
  return (
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
        {collectiveCheckin?.checkedInAt ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Clock size={10} />
            <span>
              {formatDate(collectiveCheckin.checkedInAt)}
              {collectiveCheckin.eventDayLabel ? ` (${collectiveCheckin.eventDayLabel})` : ''}
            </span>
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3 text-right">
        <CheckinActionButton
          status={collectiveStatus}
          checkingIn={checkingIn}
          onClick={() => onCheckin(submission, null, 'All Days')}
        />
      </td>
    </>
  );
}

function DailyCheckinCells({
  submission,
  eventDays,
  checkingIn,
  getCheckinStatus,
  checkinMap,
  formatDate,
  formatDayLabel,
  onCheckin,
}: {
  submission: FormSubmission;
  eventDays: EventDate[];
  checkingIn: boolean;
  getCheckinStatus: CheckinParticipantsTableProps['getCheckinStatus'];
  checkinMap: Map<string, RegistrationCheckin[]>;
  formatDate: (d: Date) => string;
  formatDayLabel: (day: EventDate) => string;
  onCheckin: CheckinParticipantsTableProps['onCheckin'];
}) {
  return (
    <>
      {eventDays.map((day) => {
        const status = getCheckinStatus(submission.id, day.id);
        const dayCheckin = (checkinMap.get(submission.id) || []).find((c) => c.eventDayId === day.id);
        return (
          <td key={day.id} className="px-4 py-3 text-center">
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
              {dayCheckin?.checkedInAt ? (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock size={10} />
                  <span>{formatDate(dayCheckin.checkedInAt)}</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onCheckin(submission, day.id, formatDayLabel(day))}
                disabled={checkingIn}
                className={`mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  status === 'done'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } disabled:opacity-50`}
              >
                {checkingIn ? <Loader2 className="animate-spin" size={12} /> : status === 'done' ? <XCircle size={12} /> : <CheckSquare size={12} />}
              </button>
            </div>
          </td>
        );
      })}
      <td className="px-4 py-3" />
    </>
  );
}

function CheckinActionButton({
  status,
  checkingIn,
  onClick,
}: {
  status: 'done' | 'undone';
  checkingIn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={checkingIn}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
        status === 'done' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {checkingIn ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          Processing...
        </>
      ) : status === 'done' ? (
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
  );
}

export default CheckinParticipantsTable;
