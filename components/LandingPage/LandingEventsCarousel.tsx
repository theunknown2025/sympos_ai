import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../../types';
import LandingEventCard from './LandingEventCard';

const VISIBLE_COUNT = 3;

interface LandingEventsCarouselProps {
  events: Event[];
}

const LandingEventsCarousel: React.FC<LandingEventsCarouselProps> = ({ events }) => {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(events.length / VISIBLE_COUNT);
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;
  const visible = events.slice(
    page * VISIBLE_COUNT,
    page * VISIBLE_COUNT + VISIBLE_COUNT
  );

  if (events.length === 0) {
    return (
      <p className="text-center text-slate-500 py-12 bg-white rounded-xl border border-slate-200">
        No published events yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={!canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2 sm:-translate-x-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous events"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-0 sm:px-2">
          {visible.map((event) => (
            <LandingEventCard key={event.id} event={event} compact />
          ))}
        </div>

        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2 sm:translate-x-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next events"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-1.5 pt-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingEventsCarousel;
