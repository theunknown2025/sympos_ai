import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { InvitationStatus } from '../../../../../types';
import InvitationStatusBadge from '../../ManageCommittee/Invitations/InvitationStatusBadge';
import type { ParticipantInvitationBatch, ParticipantInvitationStatusFilter } from './participantInvitationManagerUtils';
import {
  filterBatchRecipients,
  formatSentAt,
  getParticipantInviteeName,
  getStatusFilterLabel,
} from './participantInvitationManagerUtils';

interface ParticipantInvitationBatchDetailProps {
  batch: ParticipantInvitationBatch;
  onBack: () => void;
}

const STATUS_OPTIONS: ParticipantInvitationStatusFilter[] = [
  'all',
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
  InvitationStatus.REJECTED,
];

const ParticipantInvitationBatchDetail: React.FC<ParticipantInvitationBatchDetailProps> = ({
  batch,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipantInvitationStatusFilter>('all');

  const filteredRecipients = useMemo(
    () => filterBatchRecipients(batch, search, statusFilter),
    [batch, search, statusFilter]
  );

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <ArrowLeft size={16} />
        Back to invitation history
      </button>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{batch.subject}</h2>
        <p className="text-sm text-slate-500 mt-1">
          Sent {formatSentAt(batch.sentAt)} · {batch.totalCount} recipient
          {batch.totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ParticipantInvitationStatusFilter)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:min-w-[160px]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {getStatusFilterLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Full name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Sent at</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No recipients match your filters.
                </td>
              </tr>
            ) : (
              filteredRecipients.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {getParticipantInviteeName(inv)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.juryMemberEmail}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatSentAt(inv.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <InvitationStatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filteredRecipients.length} of {batch.totalCount} recipients
      </p>
    </div>
  );
};

export default ParticipantInvitationBatchDetail;
