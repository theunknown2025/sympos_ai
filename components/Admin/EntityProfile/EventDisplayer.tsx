import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, MapPin, Globe, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserEvents } from '../../../services/eventService';
import { Event } from '../../../types';

interface EventDisplayerProps {
  userId: string;
}

const EventDisplayer: React.FC<EventDisplayerProps> = ({ userId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUserEvents(userId);
        // Filter to show only published events
        const publishedEvents = data.filter(event => event.publishStatus === 'Published');
        // Events are already sorted by updated_at descending (latest first)
        setEvents(publishedEvents);
        setCurrentIndex(0); // Start with the latest event
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadEvents();
    }
  }, [userId]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : events.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < events.length - 1 ? prev + 1 : 0));
  };

  const goToEvent = (index: number) => {
    setCurrentIndex(index);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="text-red-600" size={20} />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Calendar className="mx-auto mb-2 text-slate-400" size={32} />
        <p>No events found</p>
      </div>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <div className="relative">
      {/* Event Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Event Banner/Header */}
        {currentEvent.banner && (
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
            {currentEvent.banner.imageUrl && (
              <img
                src={currentEvent.banner.imageUrl}
                alt={currentEvent.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentEvent.publishStatus)}`}>
                {currentEvent.publishStatus || 'Draft'}
              </span>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Event Name */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
            {currentEvent.name}
          </h3>

          {/* Description */}
          {currentEvent.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {currentEvent.description}
            </p>
          )}

          {/* Event Details */}
          <div className="space-y-2">
            {/* Dates */}
            {currentEvent.dates && currentEvent.dates.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <Clock className="text-slate-400 mt-0.5" size={16} />
                <div>
                  {currentEvent.dates.map((date, idx) => (
                    <div key={idx}>
                      {formatDate(date.startDate)}
                      {date.endDate !== date.startDate && ` - ${formatDate(date.endDate)}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {currentEvent.location && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="text-slate-400 mt-0.5" size={16} />
                <span className="line-clamp-1">{currentEvent.location}</span>
              </div>
            )}

            {/* Keywords */}
            {currentEvent.keywords && currentEvent.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {currentEvent.keywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
                {currentEvent.keywords.length > 3 && (
                  <span className="px-2 py-1 text-slate-500 text-xs">
                    +{currentEvent.keywords.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          {currentEvent.links && currentEvent.links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {currentEvent.links.slice(0, 2).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe size={12} />
                    {link.label || 'Link'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      {events.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous event"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Event Indicators/Dots */}
            <div className="flex items-center gap-2">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToEvent(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-indigo-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to event ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next event"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Event Counter */}
          <div className="text-center mt-2 text-xs text-slate-500">
            {currentIndex + 1} of {events.length}
          </div>
        </>
      )}
    </div>
  );
};

export default EventDisplayer;
