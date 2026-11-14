import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';

/**
 * Forces organizers without a selected offer onto Subscriptions,
 * and blocks other in-app routes until they pick Free (or a paid plan later).
 */
export const OrganizerOfferGate: React.FC = () => {
  const { userRole } = useAuth();
  const { needsPackage, loading } = useOrganizerPlatformSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userRole !== 'Organizer' || loading) return;
    if (!needsPackage) return;

    const subscriptionsPath = getRoutePath(ViewState.ACCOUNT_SUBSCRIPTIONS);
    const proPath = getRoutePath(ViewState.ACCOUNT_PRO);
    if (location.pathname !== subscriptionsPath && location.pathname !== proPath) {
      navigate(subscriptionsPath, { replace: true });
    }
  }, [userRole, loading, needsPackage, location.pathname, navigate]);

  return null;
};

export default OrganizerOfferGate;
