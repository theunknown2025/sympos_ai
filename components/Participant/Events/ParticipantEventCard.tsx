import React from 'react';
import EventCard from './EventCard';
import type { FormSubmission } from '../../../types';
import {
  getSubmitPaperButtonLabel,
  isParticipantPipelineComplete,
  isSubmitPaperDisabled,
} from '../../../services/submissionPipelineService';

type EventCardProps = React.ComponentProps<typeof EventCard>;

export interface ParticipantEventCardProps extends Omit<
  EventCardProps,
  'submitPaperLabel' | 'submitPaperComplete' | 'submitPaperActionDisabled'
> {
  mySubmissions: FormSubmission[];
}

/** Event card with submission actions; pipeline progress lives on My Submissions. */
const ParticipantEventCard: React.FC<ParticipantEventCardProps> = ({ mySubmissions, event, ...rest }) => {
  return (
    <EventCard
      {...rest}
      event={event}
      submitPaperLabel={getSubmitPaperButtonLabel(event, mySubmissions)}
      submitPaperComplete={isParticipantPipelineComplete(event, mySubmissions)}
      submitPaperActionDisabled={isSubmitPaperDisabled(event, mySubmissions)}
    />
  );
};

export default ParticipantEventCard;
