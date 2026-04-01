import React, { useState, useEffect } from 'react';
import { Event } from '../../../types';
import { getAvailableEvents } from '../../../services/juryMemberService';
import EventFilters from './EventFilters';
import EventCard from './EventCard';
import { Loader2, AlertCircle } from 'lucide-react';

interface AllEventsProps {
  onPreview: (event: Event) => void;
  onSubscribe: (event: Event) => void;
  onSubmitPaper: (event: Event) => void;
  onToggleFavorite: (eventId: string) => void;
  onShare: (event: Event) => void;
  isFavorite: (eventId: string) => boolean;
  isEventRegistered: (event: Event) => boolean;
  isEventSubmitted: (event: Event) => boolean;
  isEventConfirmed: (eventId: string) => boolean;
  myRegistrations: any[];
  mySubmissions: any[];
}

const AllEvents: React.FC<AllEventsProps> = ({
  onPreview,
  onSubscribe,
  onSubmitPaper,
  onToggleFavorite,
  onShare,
  isFavorite,
  isEventRegistered,
  isEventSubmitted,
  isEventConfirmed,
  myRegistrations,
  mySubmissions,
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const eventsData = await getAvailableEvents();
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading events</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadEvents}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <EventCard
              key={event.id}
              event={event}
              onPreview={onPreview}
              onSubscribe={onSubscribe}
              onSubmitPaper={onSubmitPaper}
              onToggleFavorite={onToggleFavorite}
              onShare={onShare}
              isFavorite={isFavorite(event.id)}
              isEventRegistered={isEventRegistered(event)}
              isEventSubmitted={isEventSubmitted(event)}
              isEventConfirmed={isEventConfirmed(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEvents;
