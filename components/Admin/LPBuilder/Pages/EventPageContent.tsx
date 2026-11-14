import React, { type CSSProperties } from 'react';
import { Calendar, FileText, MapPin } from 'lucide-react';
import type { Event, EventBanner } from '../../../../types';
import { eventBannerHeaderStyle } from '../../../LandingPage/landingEventUtils';
import LandingPageBreadcrumbs from './LandingPageBreadcrumbs';

function getBannerStyle(banner?: EventBanner): CSSProperties {
  const base = eventBannerHeaderStyle(banner);
  if (banner?.type === 'image' && banner.imageUrl) {
    return { ...base, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return base;
}

export interface EventPageContentProps {
  event: Event;
  homeLabel: string;
  onNavigateHome: () => void;
}

/**
 * Event body shown inside the landing page (not the SymposAI public event layout).
 * Breadcrumbs: Home → event name
 */
const EventPageContent: React.FC<EventPageContentProps> = ({
  event,
  homeLabel,
  onNavigateHome,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <LandingPageBreadcrumbs
        items={[
          { label: homeLabel, onClick: onNavigateHome },
          { label: event.name },
        ]}
      />

      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm text-white min-h-[12rem] flex items-end">
        <div className="w-full p-6 sm:p-8 relative" style={getBannerStyle(event.banner)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-md">{event.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {event.eventType && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/90 text-indigo-800">
                  {event.eventType}
                </span>
              )}
              {event.eventFormat && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-black/40 text-white">
                  {event.eventFormat}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
        {event.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5">
            <MapPin size={15} className="text-slate-400" />
            {event.location}
          </span>
        )}
        {event.dates?.[0]?.startDate && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5">
            <Calendar size={15} className="text-slate-400" />
            {new Date(event.dates[0].startDate).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      {event.description?.trim() && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
            <FileText size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Description</h2>
          </div>
          <div
            className="p-5 prose prose-slate max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </section>
      )}
    </div>
  );
};

export default EventPageContent;
