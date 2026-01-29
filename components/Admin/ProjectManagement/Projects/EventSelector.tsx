import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { Event } from '../../../../types';

interface EventSelectorProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ events, onSelectEvent }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Select an Event</h2>
        <p className="text-sm text-slate-500">Choose an event to manage its projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => onSelectEvent(event.id)}
            className="p-4 border-2 border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-indigo-600" size={20} />
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    {event.name}
                  </h3>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                )}
              </div>
              <ArrowRight className="text-slate-400 group-hover:text-indigo-600 ml-2" size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventSelector;

