import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { getLatestPublishedEvents } from '../../services/eventService';
import type { Event } from '../../types';
import { PUBLIC_EVENTS_BROWSE_PATH } from '../Public/Events/publicEventListingUtils';
import LandingEventsCarousel from './LandingEventsCarousel';

const EVENT_LIMIT = 6;

const LandingEventsSection: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setEvents(await getLatestPublishedEvents(EVENT_LIMIT));
      } catch (err) {
        console.error('[LandingEventsSection] Failed to load events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && events.length === 0) {
    return null;
  }

  return (
    <section id="latest-events" className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-2">
            <Calendar size={18} />
            Conferences &amp; events
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Latest events</h2>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Discover the six most recently published events — browse three at a time.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <LandingEventsCarousel events={events} />
        )}

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => navigate(PUBLIC_EVENTS_BROWSE_PATH)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
          >
            View all events
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingEventsSection;
