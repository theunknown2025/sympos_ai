import React from 'react';
import { InvitationStatus } from '../../../../../types';
import { getInvitationStatusLabel } from './invitationUtils';

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  className?: string;
}

const InvitationStatusBadge: React.FC<InvitationStatusBadgeProps> = ({ status, className = '' }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  let colors = 'bg-slate-100 text-slate-700';

  if (status === InvitationStatus.PENDING) {
    colors = 'bg-amber-100 text-amber-800';
  } else if (status === InvitationStatus.ACCEPTED) {
    colors = 'bg-emerald-100 text-emerald-800';
  } else if (status === InvitationStatus.REJECTED) {
    colors = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`${base} ${colors} ${className}`}>
      {getInvitationStatusLabel(status)}
    </span>
  );
};

export default InvitationStatusBadge;
