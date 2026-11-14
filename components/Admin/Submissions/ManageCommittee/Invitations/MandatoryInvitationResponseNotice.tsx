import React from 'react';
import { Lock } from 'lucide-react';
import { getMandatoryInvitationResponseSectionPlain } from './invitationEmailMandatory';

interface MandatoryInvitationResponseNoticeProps {
  /** Preview with a sample or the actual invitee email */
  recipientEmail?: string;
  className?: string;
}

/**
 * Read-only preview of the block always appended to committee invitation emails.
 */
const MandatoryInvitationResponseNotice: React.FC<MandatoryInvitationResponseNoticeProps> = ({
  recipientEmail,
  className = '',
}) => {
  const text = getMandatoryInvitationResponseSectionPlain(
    recipientEmail || '{{email}}'
  );

  return (
    <div className={`rounded-lg border border-indigo-200 bg-indigo-50/80 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-indigo-200 bg-indigo-100/60 rounded-t-lg">
        <Lock size={16} className="text-indigo-700 flex-shrink-0" />
        <span className="text-sm font-medium text-indigo-900">
          Required notice (always included — not editable)
        </span>
      </div>
      <pre className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
        {text}
      </pre>
    </div>
  );
};

export default MandatoryInvitationResponseNotice;
