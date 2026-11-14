import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getPublishedEventBySlug } from '../../../services/eventService';
import type { Event } from '../../../types';
import EventViewPage from './EventViewPage';
import PublicEventsLayout from '../../Public/Events/PublicEventsLayout';
import { PUBLIC_EVENTS_BROWSE_PATH } from '../../Public/Events/publicEventListingUtils';

function slugFromPathname(pathname: string): string {
  const segment = pathname.replace(/^\/e\/?/, '').split('/')[0];
  return segment ? decodeURIComponent(segment) : '';
}

interface PublicEventPageProps {
  slug?: string;
}

/** SymposAI public event route (`/e/:slug`) — separate from landing-page About view. */
const PublicEventPage: React.FC<PublicEventPageProps> = ({ slug: slugProp }) => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const slug = useMemo(
    () => slugProp || slugParam || slugFromPathname(pathname),
    [slugProp, slugParam, pathname]
  );
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!slug) {
        setError('Invalid link');
        setLoading(false);
        return;
      }
      try {
        const data = await getPublishedEventBySlug(slug);
        if (!data) setError('This event is not available or the link is invalid.');
        else setEvent(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <PublicEventsLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      </PublicEventsLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicEventsLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-700 mb-4">{error || 'Event not found'}</p>
          <button
            type="button"
            onClick={() => navigate(PUBLIC_EVENTS_BROWSE_PATH)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse events
          </button>
        </div>
      </PublicEventsLayout>
    );
  }

  return <EventViewPage event={event} mode="public" />;
};

export default PublicEventPage;
