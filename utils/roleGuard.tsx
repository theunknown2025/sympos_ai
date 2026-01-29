import React from 'react';
import { Navigate } from 'react-router-dom';
import { SubscriptionRole } from '../types';
import { getRoutePath } from '../routes';
import { ViewState } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  userRole: SubscriptionRole | null;
  requiredRole: 'Organizer' | 'Participant' | 'any';
  isLoading?: boolean;
}

/**
 * Role-based route guard component
 * Redirects users to appropriate dashboard based on their role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  userRole,
  requiredRole,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  if (!userRole) {
    // No role set, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'any') {
    return <>{children}</>;
  }

  if (requiredRole === 'Organizer' && userRole !== 'Organizer') {
    // Participant trying to access Organizer route - redirect to jury dashboard
    return <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />;
  }

  if (requiredRole === 'Participant' && userRole !== 'Participant') {
    // Organizer trying to access Participant-only route - redirect to admin dashboard
    return <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace />;
  }

  return <>{children}</>;
};

/**
 * Check if a view state requires organizer access
 */
export const isOrganizerOnlyView = (viewState: ViewState): boolean => {
  const organizerOnlyViews: ViewState[] = [
    ViewState.DASHBOARD,
    ViewState.BUILDER,
    ViewState.LANDING_PAGES,
    ViewState.REGISTRATIONS,
    ViewState.FORM_BUILDER,
    ViewState.REGISTRATION_LIST,
    ViewState.CHECKIN,
    ViewState.SUBMISSIONS,
    ViewState.SUBMISSIONS_DASHBOARD,
    ViewState.SUBMISSIONS_FOLLOW_UP,
    ViewState.SUBMISSIONS_MANAGE,
    ViewState.SUBMISSIONS_MANAGE_COMMITTEE,
    ViewState.SUBMISSIONS_REPORTING,
    ViewState.CERTIFICATES,
    ViewState.CERTIFICATE_TEMPLATE_BUILDER,
    ViewState.CERTIFICATE_TEMPLATE_LIST,
    ViewState.GENERATE_CERTIFICATES,
    ViewState.CANVA_CERTIFICATE_BACKGROUND,
    ViewState.PROGRAM_BUILDER,
    ViewState.EVENT_MANAGEMENT,
    ViewState.ACADEMY_LMS,
    ViewState.SETTINGS,
  ];
  
  return organizerOnlyViews.includes(viewState);
};

/**
 * Check if a view state is for participants/jury members
 */
export const isParticipantOnlyView = (viewState: ViewState): boolean => {
  const participantOnlyViews: ViewState[] = [
    ViewState.JURY_DASHBOARD,
    ViewState.JURY_PROFILE,
    ViewState.JURY_INVITATIONS,
    ViewState.JURY_EVENTS,
    ViewState.JURY_REVIEWS,
    ViewState.PARTICIPANT_REGISTRATIONS,
    ViewState.PARTICIPANT_SUBMISSIONS,
  ];
  
  return participantOnlyViews.includes(viewState);
};

