import React, { useEffect, useState } from 'react';
import { CalendarDays, Layers } from 'lucide-react';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizerEventScope } from '../../../contexts/OrganizerEventScopeContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import { getUserEventsForDashboard } from '../../../services/eventService';
import { getApprovedProEventAllowance } from '../../../services/organizerEventQuota';
import { isFreePlan, isSubscriptionAccessAllowed } from '../../../services/organizerPlatformSubscriptionService';

/**
 * Event title and paid pack, shown on every organizer page once an event exists.
 */
const OrganizerEventPackHeader: React.FC = () => {
  const { t } = useAdminTranslation('eventResources');
  const { currentUser, userRole } = useAuth();
  const scope = useOrganizerEventScope();
  const { subscription } = useOrganizerPlatformSubscription();
  const [fallbackName, setFallbackName] = useState<string | null>(null);
  const [proEventSlots, setProEventSlots] = useState<number | null>(null);

  const isOrganizer = userRole === 'Organizer' && scope.isOrganizerWorkspaceEnabled;

  useEffect(() => {
    if (!isOrganizer || !currentUser?.id) {
      setFallbackName(null);
      return;
    }
    if (scope.focusedEventName) {
      setFallbackName(scope.focusedEventName);
      return;
    }
    let cancelled = false;
    void getUserEventsForDashboard(currentUser.id, userRole)
      .then((events) => {
        if (cancelled) return;
        if (scope.focusedEventId) {
          const match = events.find((event) => event.id === scope.focusedEventId);
          setFallbackName(match?.name || null);
          return;
        }
        setFallbackName(events.length === 1 ? events[0].name : null);
      })
      .catch(() => {
        if (!cancelled) setFallbackName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOrganizer, currentUser?.id, userRole, scope.focusedEventId, scope.focusedEventName]);

  useEffect(() => {
    if (!isOrganizer || !currentUser?.id) {
      setProEventSlots(null);
      return;
    }
    if (subscription?.plan_code !== 'pro' || subscription.status !== 'active') {
      setProEventSlots(null);
      return;
    }
    let cancelled = false;
    void getApprovedProEventAllowance(currentUser.id)
      .then((count) => {
        if (!cancelled) setProEventSlots(count);
      })
      .catch(() => {
        if (!cancelled) setProEventSlots(1);
      });
    return () => {
      cancelled = true;
    };
  }, [isOrganizer, currentUser?.id, subscription?.plan_code, subscription?.status]);

  if (!isOrganizer) return null;

  const eventName = scope.focusedEventName || fallbackName;

  let packLabel = t('packInactive');
  if (isFreePlan(subscription) && isSubscriptionAccessAllowed(subscription)) {
    packLabel = t('packFreeTrial');
  } else if (subscription?.plan_code === 'pro' && subscription.status === 'active') {
    const slots = proEventSlots ?? 1;
    packLabel = slots === 1 ? t('packProOne') : t('packPro', { n: slots });
  }

  return (
    <div className="inline-flex items-center min-w-0 max-w-full h-10 rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden">
      {eventName && (
        <div className="flex items-center gap-2 min-w-0 px-3 h-full bg-slate-50">
          <CalendarDays size={16} className="text-indigo-600 shrink-0" aria-hidden />
          <span className="sr-only">{t('headerEventLabel')}: </span>
          <span className="truncate text-sm font-semibold text-slate-900">{eventName}</span>
        </div>
      )}
      <div
        className={`flex items-center gap-1.5 h-full px-3 shrink-0 ${
          eventName ? 'border-l border-slate-200' : ''
        }`}
      >
        <Layers size={14} className="text-indigo-600 shrink-0" aria-hidden />
        <span className="sr-only">{t('headerPackLabel')}: </span>
        <span className="text-xs font-semibold text-indigo-800 whitespace-nowrap">{packLabel}</span>
      </div>
      {scope.mode === 'focused' && (
        <button
          type="button"
          onClick={() => scope.returnToEventChooser()}
          className="h-full px-3 border-l border-slate-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50 whitespace-nowrap"
        >
          {t('changeEvent')}
        </button>
      )}
    </div>
  );
};

export default OrganizerEventPackHeader;
