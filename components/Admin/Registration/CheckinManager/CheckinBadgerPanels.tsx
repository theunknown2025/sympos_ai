import React, { useState } from 'react';
import { Camera, FileText, Users } from 'lucide-react';
import BadgerDisplay from './BadgerDisplay';
import SubmissionBadgerDisplay from './SubmissionBadgerDisplay';

interface CheckinBadgerPanelsProps {
  eventId?: string;
  eventName?: string;
  eventHasSubmissions?: boolean;
}

/**
 * Two check-in scanners: registration badges vs submission presenter badges.
 */
const CheckinBadgerPanels: React.FC<CheckinBadgerPanelsProps> = ({
  eventId,
  eventName,
  eventHasSubmissions = true,
}) => {
  const [registrationBadgerOpen, setRegistrationBadgerOpen] = useState(false);
  const [submissionBadgerOpen, setSubmissionBadgerOpen] = useState(false);
  const eventSelected = Boolean(eventId);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BadgerPanelCard
          icon={Users}
          title="Registration check-in"
          description="Scan badges for accepted registrations. Standard welcome layout and quick check-in."
          buttonLabel="Use registration badger"
          accent="indigo"
          disabled={!eventSelected}
          disabledHint="Select an event first"
          onOpen={() => setRegistrationBadgerOpen(true)}
        />
        {eventHasSubmissions ? (
          <BadgerPanelCard
            icon={FileText}
            title="Submission presenters"
            description="Scan presenter badges after the full submission program. Shows paper title, program slot, and verification checklist."
            buttonLabel="Use submission badger"
            accent="violet"
            disabled={!eventSelected}
            disabledHint="Select an event first"
            onOpen={() => setSubmissionBadgerOpen(true)}
          />
        ) : null}
      </div>

      <BadgerDisplay
        isOpen={registrationBadgerOpen}
        onClose={() => setRegistrationBadgerOpen(false)}
        eventId={eventId}
        eventName={eventName}
      />
      <SubmissionBadgerDisplay
        isOpen={submissionBadgerOpen}
        onClose={() => setSubmissionBadgerOpen(false)}
        eventId={eventId}
        eventName={eventName}
      />
    </>
  );
};

function BadgerPanelCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  accent,
  disabled,
  disabledHint,
  onOpen,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  buttonLabel: string;
  accent: 'indigo' | 'violet';
  disabled: boolean;
  disabledHint: string;
  onOpen: () => void;
}) {
  const border = accent === 'violet' ? 'border-violet-200' : 'border-indigo-200';
  const bg = accent === 'violet' ? 'bg-violet-50/80' : 'bg-indigo-50/80';
  const iconCls = accent === 'violet' ? 'text-violet-600' : 'text-indigo-600';
  const btn =
    accent === 'violet'
      ? 'bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300'
      : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300';

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 flex flex-col gap-4`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 bg-white shadow-sm ${iconCls}`}>
          <Icon size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${btn} disabled:text-slate-500 disabled:cursor-not-allowed`}
      >
        <Camera size={16} />
        {buttonLabel}
      </button>
    </div>
  );
}

export default CheckinBadgerPanels;

