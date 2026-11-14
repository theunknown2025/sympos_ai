import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Compass, UserPlus, Send } from 'lucide-react';
import type { Event } from '../../types';
import {
  eventBannerHeaderStyle,
  eventDescriptionExcerpt,
  landingEventExploreUrl,
} from './landingEventUtils';
import {
  canPublicRegister,
  canPublicSubmit,
  publicEventRegisterUrl,
  publicEventSubmitUrl,
} from '../Public/Events/publicEventListingUtils';

interface LandingEventCardProps {
  event: Event;
  compact?: boolean;
}

const LandingEventCard: React.FC<LandingEventCardProps> = ({ event, compact = false }) => {
  const navigate = useNavigate();
  const exploreUrl = landingEventExploreUrl(event);
  const excerpt = eventDescriptionExcerpt(event.description, compact ? 90 : 140);
  const showRegister = canPublicRegister(event);
  const showSubmit = canPublicSubmit(event);
  const firstDate = event.dates?.[0];

  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div
        className={`relative ${compact ? 'h-28' : 'h-36'} bg-slate-200`}
        style={eventBannerHeaderStyle(event.banner)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
          {event.eventType && (
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/90 text-indigo-700">
              {event.eventType}
            </span>
          )}
          {event.eventFormat && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-black/40 text-white">
              {event.eventFormat}
            </span>
          )}
        </div>
      </div>

      <div className={`flex flex-col flex-1 ${compact ? 'p-4' : 'p-5'}`}>
        <h3
          className={`font-bold text-slate-900 ${compact ? 'text-base' : 'text-lg'} line-clamp-2`}
        >
          {event.name}
        </h3>
        {excerpt && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-3 flex-1">{excerpt}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} />
              {event.location}
            </span>
          )}
          {firstDate?.startDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />
              {new Date(firstDate.startDate).toLocaleDateString()}
              {firstDate.endDate &&
                firstDate.endDate !== firstDate.startDate && (
                  <> – {new Date(firstDate.endDate).toLocaleDateString()}</>
                )}
            </span>
          )}
        </div>
        <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(exploreUrl)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Compass size={16} />
            Explore
          </button>
          {showRegister ? (
            <button
              type="button"
              onClick={() => navigate(publicEventRegisterUrl(event))}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <UserPlus size={16} />
              Register
            </button>
          ) : showSubmit ? (
            <button
              type="button"
              onClick={() => navigate(publicEventSubmitUrl(event))}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              <Send size={16} />
              Submit
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default LandingEventCard;
