import { useCallback, useState } from 'react';
import type { HeroButton, PricingOffer } from '../../../../types';
import {
  isRegistrationFormCategory,
  resolveLandingPageActionTarget,
  resolveLandingPageCtaHref,
} from './landingPageActionButton';

export type LandingPageActionHandlerMessages = {
  evaluationUnavailable: string;
};

export type PricingTicketContext = {
  offerId: string;
  isFree: boolean;
  capacity?: number;
  eventId: string;
};

export function useLandingPageActionHandler(messages: LandingPageActionHandlerMessages) {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [ticketContext, setTicketContext] = useState<PricingTicketContext | null>(null);
  const [pricingRefreshKey, setPricingRefreshKey] = useState(0);

  const handleActionClick = useCallback(
    (btn: HeroButton) => {
      const action = resolveLandingPageActionTarget(btn);
      if (action === 'form' && btn.formId) {
        if (btn.formCategory === 'evaluation') {
          alert(messages.evaluationUnavailable);
          return;
        }
        if (isRegistrationFormCategory(btn.formCategory) || !btn.formCategory) {
          setSelectedFormId(btn.formId);
          setShowFormModal(true);
          return;
        }
        setSelectedFormId(btn.formId);
        setShowFormModal(true);
        return;
      }
      const href = resolveLandingPageCtaHref(btn);
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [messages.evaluationUnavailable]
  );

  const openPricingOffer = useCallback((offer: PricingOffer, formId: string, eventId: string) => {
    if (!formId || !eventId) return;
    setTicketContext({
      offerId: offer.id,
      isFree: Boolean(offer.isFree),
      capacity: offer.capacity,
      eventId,
    });
    setSelectedFormId(formId);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setSelectedFormId(null);
    setTicketContext(null);
  }, []);

  const notifyPricingChanged = useCallback(() => {
    setPricingRefreshKey((key) => key + 1);
  }, []);

  return {
    showFormModal,
    selectedFormId,
    ticketContext,
    pricingRefreshKey,
    handleActionClick,
    openPricingOffer,
    notifyPricingChanged,
    closeFormModal,
  };
}
