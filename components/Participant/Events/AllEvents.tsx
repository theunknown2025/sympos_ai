import React, { useState } from 'react';
import { Event } from '../../../types';
import EventFilters from './EventFilters';
import ParticipantEventCard from './ParticipantEventCard';

interface AllEventsProps {
  events: Event[];
  onPreview: (event: Event) => void;
  onSubscribe: (event: Event) => void;
  onSubmitPaper: (event: Event) => void;
  onToggleFavorite: (eventId: string) => void;
  onShare: (event: Event) => void;
  isFavorite: (eventId: string) => boolean;
  isEventRegistered: (event: Event) => boolean;
  isEventConfirmed: (eventId: string) => boolean;
  myRegistrations: any[];
  mySubmissions: any[];
}

const AllEvents: React.FC<AllEventsProps> = ({
  events,
  onPreview,
  onSubscribe,
  onSubmitPaper,
  onToggleFavorite,
  onShare,
  isFavorite,
  isEventRegistered,
  isEventConfirmed,
  myRegistrations,
  mySubmissions,
}) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  React.useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  return (
    <div>
      <EventFilters events={events} onFilterChange={setFilteredEvents} />

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="font-medium">No events found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <ParticipantEventCard
              key={event.id}
              event={event}
              mySubmissions={mySubmissions}
              onPreview={onPreview}
              onSubscribe={onSubscribe}
              onSubmitPaper={onSubmitPaper}
              onToggleFavorite={onToggleFavorite}
              onShare={onShare}
              isFavorite={isFavorite(event.id)}
              isEventRegistered={isEventRegistered(event)}
              isEventConfirmed={isEventConfirmed(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEvents;
