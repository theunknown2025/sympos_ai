import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ViewState } from './types';
import { isOrganizerOnlyView, isParticipantOnlyView, isSuperAdminPortalView } from './utils/roleGuard';
import { SuperAdminSidebar } from './components/Admin/SuperAdmin/Layout/SuperAdminSidebar';
import LandingPage from './components/LandingPage/LandingPage';
import AuthContainer from './components/Admin/Auth/AuthContainer';
import AIAssistant from './components/Admin/AIAssistant';
import { Sidebar } from './components/Admin/Layout/Sidebar';
import { Header } from './components/Admin/Layout/Header';
import { AppRoutes } from './components/Admin/Layout/AppRoutes';
import ViewCertificate from './components/Admin/Certificates/ViewCertificate';
import PublicLandingPageViewer from './components/Admin/LPBuilder/Publisher/PublicLandingPageViewer';
import PublicEntityProfileViewer from './components/Admin/EntityProfile/PublicEntityProfileViewer';
import PublicProfileViewer from './components/Participant/Tools/ProfileBuilder/PublicProfileViewer';
import PublicOpportunityPage from './components/Admin/Opportunities/PublicOpportunityPage';
import PublicOpportunitiesBrowsePage from './components/Public/Opportunities/PublicOpportunitiesBrowsePage';
import PublicEventPage from './components/Admin/EventManagement/PublicEventPage';
import PublicEventsBrowsePage from './components/Public/Events/PublicEventsBrowsePage';
import { supabase, TABLES } from './supabase';
import { useAuth } from './hooks/useAuth';
import { getViewStateFromPath, getRoutePath } from './routes';
import { AdminDisplaySettingsProvider } from './contexts/AdminDisplaySettingsContext';
import {
  OrganizerEventScopeProvider,
} from './contexts/OrganizerEventScopeContext';
import { OrganizerPlatformSubscriptionProvider } from './contexts/OrganizerPlatformSubscriptionContext';
import SubscriptionUnpaidBanner from './components/Admin/AccountManagement/SubscriptionUnpaidBanner';
import OrganizerOfferGate from './components/Admin/AccountManagement/OrganizerOfferGate';

const OrganizerAwareMain: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
      {children}
    </main>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, userRole, isOrganizer, isParticipant, isRootSuperAdmin, isLoading: authLoading } = useAuth();
  const [isOrganizerSubscriptionBlocked, setIsOrganizerSubscriptionBlocked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [accountManagementExpanded, setAccountManagementExpanded] = useState(true);
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [registrationsExpanded, setRegistrationsExpanded] = useState(false);
  const [certificatesExpanded, setCertificatesExpanded] = useState(false);
  const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [juryExpanded, setJuryExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [projectManagementExpanded, setProjectManagementExpanded] = useState(false);
  const [participantToolsExpanded, setParticipantToolsExpanded] = useState(false);
  const [paiementManagementExpanded, setPaiementManagementExpanded] = useState(false);
  const [academyExpanded, setAcademyExpanded] = useState(false);
  const [opportunitiesExpanded, setOpportunitiesExpanded] = useState(false);
  const [participantOpportunitiesExpanded, setParticipantOpportunitiesExpanded] = useState(false);

  // Get current view from URL
  const currentView = getViewStateFromPath(location.pathname) || ViewState.LANDING_PAGE;

  const effectiveIsOrganizer = isOrganizer && !isOrganizerSubscriptionBlocked;
  const effectiveIsParticipant = isParticipant || isOrganizerSubscriptionBlocked;

  // Auto-expand Account Management when on those views
  useEffect(() => {
    if (
      currentView === ViewState.ENTITY_PROFILE ||
      currentView === ViewState.ACCOUNT_LOGIN ||
      currentView === ViewState.ACCOUNT_SUBSCRIPTIONS ||
      currentView === ViewState.ACCOUNT_PRO
    ) {
      if (!accountManagementExpanded) setAccountManagementExpanded(true);
    }
  }, [currentView, accountManagementExpanded]);

  // Auto-expand participant sidebar sections
  useEffect(() => {
    if (
      currentView === ViewState.JURY_DASHBOARD ||
      currentView === ViewState.JURY_PROFILE
    ) {
      if (!dashboardExpanded) setDashboardExpanded(true);
    }
  }, [currentView, dashboardExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.JURY_INVITATIONS ||
      currentView === ViewState.JURY_REVIEWS
    ) {
      if (!juryExpanded) setJuryExpanded(true);
    }
  }, [currentView, juryExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.JURY_EVENTS ||
      currentView === ViewState.PARTICIPANT_REGISTRATIONS ||
      currentView === ViewState.PARTICIPANT_SUBMISSIONS ||
      currentView === ViewState.PARTICIPANT_CERTIFICATES
    ) {
      if (!eventsExpanded) setEventsExpanded(true);
    }
  }, [currentView, eventsExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.PARTICIPANT_ACADEMY ||
      currentView === ViewState.PARTICIPANT_ACADEMY_COURSES
    ) {
      if (!academyExpanded) setAcademyExpanded(true);
    }
  }, [currentView, academyExpanded]);

  // Auto-expand Participant Tools section when on tools pages
  useEffect(() => {
    if (currentView === ViewState.PARTICIPANT_TOOLS || 
        currentView === ViewState.LATEX_EDITOR ||
        currentView === ViewState.CV_BUILDER ||
        currentView === ViewState.PROFILE_BUILDER ||
        currentView === ViewState.PARTICIPANT_BLOG) {
      if (!participantToolsExpanded) {
        setParticipantToolsExpanded(true);
      }
    }
  }, [currentView, participantToolsExpanded]);

  // Auto-expand Registrations section when on registration or check-in pages
  useEffect(() => {
    if (currentView === ViewState.REGISTRATION_LIST || 
        currentView === ViewState.CHECKIN) {
      if (!registrationsExpanded) {
        setRegistrationsExpanded(true);
      }
    }
  }, [currentView, registrationsExpanded]);

  // Auto-expand Payment Management section when on payment pages
  useEffect(() => {
    if (currentView === ViewState.PAIEMENT_INFORMATION || 
        currentView === ViewState.NEW_PAIEMENT ||
        currentView === ViewState.PAIEMENT_FOLLOW_UP ||
        currentView === ViewState.PAIEMENT_GENERATOR) {
      if (!paiementManagementExpanded) {
        setPaiementManagementExpanded(true);
      }
    }
  }, [currentView, paiementManagementExpanded]);

  // Auto-expand Academy section when on academy sub-pages
  useEffect(() => {
    if (currentView === ViewState.ACADEMY_COURSE_MANAGER ||
        currentView === ViewState.ACADEMY_ENROLLMENT_MANAGER ||
        currentView === ViewState.ACADEMY_PAYMENT_MANAGER) {
      if (!academyExpanded) {
        setAcademyExpanded(true);
      }
    }
  }, [currentView, academyExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.OPPORTUNITIES_DASHBOARD ||
      currentView === ViewState.OPPORTUNITIES_MANAGE ||
      currentView === ViewState.OPPORTUNITIES_APPLICATIONS
    ) {
      if (!opportunitiesExpanded) setOpportunitiesExpanded(true);
    }
  }, [currentView, opportunitiesExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.FORM_BUILDER ||
      currentView === ViewState.LANDING_PAGES ||
      currentView === ViewState.BUILDER ||
      currentView === ViewState.FILES_MANAGER ||
      currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND ||
      currentView === ViewState.EMAILER ||
      currentView === ViewState.BLOGS ||
      currentView === ViewState.PRESENTER ||
      currentView === ViewState.POSTER_MANAGER
    ) {
      if (!toolsExpanded) setToolsExpanded(true);
    }
  }, [currentView, toolsExpanded]);

  useEffect(() => {
    if (
      currentView === ViewState.PARTICIPANT_OPPORTUNITIES ||
      currentView === ViewState.PARTICIPANT_OPPORTUNITY_APPLICATIONS
    ) {
      if (!participantOpportunitiesExpanded) setParticipantOpportunitiesExpanded(true);
    }
  }, [currentView, participantOpportunitiesExpanded]);

  // Initialize auth state and handle role-based redirects
  useEffect(() => {
    if (!authLoading && currentUser && userRole) {
      const init = async () => {
        // Organizer route denial when organizer membership is blocked.
        // We treat blocked organizers as participants for routing purposes.
        let organizerBlocked = false;
        if (userRole === 'Organizer') {
          const { data, error } = await supabase
            .from(TABLES.ORGANIZER_MEMBERSHIPS)
            .select('subscription_status')
            .eq('organizer_user_id', currentUser.id)
            .maybeSingle();

          if (!error) {
            organizerBlocked = data?.subscription_status === 'blocked';
          }
        }

        setIsOrganizerSubscriptionBlocked(organizerBlocked);
        
        // Get current view
        const currentView = getViewStateFromPath(location.pathname);
        const effectiveIsOrganizer = isOrganizer && !organizerBlocked;
        const effectiveIsParticipant = isParticipant || organizerBlocked;
      
        // If user is Participant and trying to access Organizer routes, redirect
        if (effectiveIsParticipant && currentView && isOrganizerOnlyView(currentView)) {
          navigate(getRoutePath(ViewState.JURY_DASHBOARD), { replace: true });
          setIsInitializing(false);
          return;
        }
        
        // If user is Organizer and trying to access Participant-only routes, redirect
        if (effectiveIsOrganizer && currentView && isParticipantOnlyView(currentView)) {
          navigate(getRoutePath(ViewState.DASHBOARD), { replace: true });
          setIsInitializing(false);
          return;
        }

        // Root super admin: only super admin portal routes
        if (userRole === 'SuperAdmin' && currentView && !isSuperAdminPortalView(currentView)) {
          navigate(getRoutePath(ViewState.SUPERADMIN_DASHBOARD), { replace: true });
          setIsInitializing(false);
          return;
        }
        
        // If on root and authenticated, redirect based on role
        if (location.pathname === '/' && currentView === ViewState.LANDING_PAGE) {
          if (effectiveIsParticipant) {
            navigate(getRoutePath(ViewState.JURY_DASHBOARD), { replace: true });
          } else if (userRole === 'SuperAdmin') {
            navigate(getRoutePath(ViewState.SUPERADMIN_DASHBOARD), { replace: true });
          } else if (effectiveIsOrganizer) {
            if (userRole === 'Organizer') {
              navigate(getRoutePath(ViewState.ORGANIZER_WORKSPACE), { replace: true });
            } else {
              navigate(getRoutePath(ViewState.DASHBOARD), { replace: true });
            }
          }
        }

        setIsInitializing(false);
      };

      init();
    } else if (!authLoading && !currentUser) {
      setIsOrganizerSubscriptionBlocked(false);
      setIsInitializing(false);
    }
  }, [authLoading, currentUser, userRole, location.pathname, isOrganizer, isParticipant, navigate]);

  // Navigate to a view
  const navigateToView = (viewState: ViewState, routeParams?: Record<string, string>) => {
    const path = getRoutePath(viewState, routeParams);
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
      // Even if there's an error, navigate away
      navigate('/');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Sympose AI...</p>
      </div>
    );
  }

  // Show landing page for unauthenticated users on root path
  if (!currentUser) {
    const currentViewFromPath = getViewStateFromPath(location.pathname);
    // Allow public access to certificate viewing
    if (location.pathname.startsWith('/certificate/')) {
      // Certificate viewing is public, render directly without app layout
      return <ViewCertificate />;
    }
    // Allow public access to published landing pages
    if (location.pathname.startsWith('/p/')) {
      // Extract slug from pathname (e.g., /p/my-slug -> my-slug)
      const slug = location.pathname.replace('/p/', '').split('/')[0];
      // Published landing page viewing is public, render directly without app layout
      return <PublicLandingPageViewer slug={slug} />;
    }
    // Allow public access to published entity profiles
    if (location.pathname.startsWith('/profile/')) {
      // Extract slug from pathname (e.g., /profile/my-slug -> my-slug)
      const slug = location.pathname.replace('/profile/', '').split('/')[0];
      // Published profile viewing is public, render directly without app layout
      return <PublicEntityProfileViewer slug={slug} />;
    }
    // Allow public access to published professor profiles
    if (location.pathname.startsWith('/profiles/')) {
      // Extract slug from pathname (e.g., /profiles/my-professor-profile -> my-professor-profile)
      const slug = location.pathname.replace('/profiles/', '').split('/')[0];
      // Published professor profile viewing is public, render directly without app layout
      return <PublicProfileViewer slug={slug} />;
    }
    if (location.pathname.startsWith('/o/')) {
      const opportunitySlug = location.pathname.replace(/^\/o\/?/, '').split('/')[0];
      return (
        <PublicOpportunityPage
          slug={opportunitySlug ? decodeURIComponent(opportunitySlug) : undefined}
        />
      );
    }
    if (location.pathname === '/opportunities/browse') {
      return <PublicOpportunitiesBrowsePage />;
    }
    if (location.pathname.startsWith('/e/')) {
      const eventSlug = location.pathname.replace(/^\/e\/?/, '').split('/')[0];
      return (
        <PublicEventPage slug={eventSlug ? decodeURIComponent(eventSlug) : undefined} />
      );
    }
    if (location.pathname === '/events/browse') {
      return <PublicEventsBrowsePage />;
    }
    if (location.pathname === '/' || currentViewFromPath === ViewState.LANDING_PAGE) {
      return <LandingPage />;
    }
    // Show auth container for login/register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
      return (
        <AuthContainer
          onAuthSuccess={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const role = session?.user?.user_metadata?.role as string | undefined;
            if (role === 'Organizer') {
              navigate(getRoutePath(ViewState.ORGANIZER_WORKSPACE));
            } else if (role === 'SuperAdmin') {
              navigate(getRoutePath(ViewState.SUPERADMIN_DASHBOARD));
            } else if (role === 'SubSuperAdmin') {
              navigate(getRoutePath(ViewState.DASHBOARD));
            } else {
              navigate(getRoutePath(ViewState.JURY_DASHBOARD));
            }
          }}
          initialView={location.pathname === '/register' ? 'register' : 'login'}
        />
      );
    }
    // Default to landing page for other unauthenticated routes
    return <LandingPage />;
  }

  const handleEditPage = (pageId: string) => {
    navigateToView(ViewState.BUILDER, { pageId });
  };

  const handleNewPage = () => {
    navigateToView(ViewState.BUILDER);
  };

  const handleBackToManager = () => {
    navigateToView(ViewState.LANDING_PAGES);
  };

  const handleEditForm = (formId: string) => {
    navigateToView(ViewState.FORM_BUILDER, { formId });
  };

  const handleNewForm = () => {
    navigateToView(ViewState.FORM_BUILDER);
  };

  const handleBackToFormList = () => {
    navigateToView(ViewState.FORM_BUILDER);
  };

  // Handle public routes for authenticated users too
  if (location.pathname.startsWith('/profiles/')) {
    const slug = location.pathname.replace('/profiles/', '').split('/')[0];
    return <PublicProfileViewer slug={slug} />;
  }
  if (location.pathname.startsWith('/p/')) {
    const slug = location.pathname.replace('/p/', '').split('/')[0];
    return <PublicLandingPageViewer slug={slug} />;
  }
  if (location.pathname.startsWith('/o/')) {
    const opportunitySlug = location.pathname.replace(/^\/o\/?/, '').split('/')[0];
    return (
      <PublicOpportunityPage
        slug={opportunitySlug ? decodeURIComponent(opportunitySlug) : undefined}
      />
    );
  }
  if (location.pathname === '/opportunities/browse') {
    return <PublicOpportunitiesBrowsePage />;
  }
  if (location.pathname.startsWith('/e/')) {
    const eventSlug = location.pathname.replace(/^\/e\/?/, '').split('/')[0];
    return <PublicEventPage slug={eventSlug ? decodeURIComponent(eventSlug) : undefined} />;
  }
  if (location.pathname === '/events/browse') {
    return <PublicEventsBrowsePage />;
  }

  return (
    <AdminDisplaySettingsProvider userId={currentUser.id}>
      <OrganizerEventScopeProvider userId={currentUser.id} userRole={userRole}>
        <OrganizerPlatformSubscriptionProvider
          userId={currentUser.id}
          enabled={userRole === 'Organizer' && !isOrganizerSubscriptionBlocked}
        >
        <OrganizerOfferGate />
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
          {isRootSuperAdmin ? (
            <SuperAdminSidebar
              sidebarOpen={sidebarOpen}
              currentView={currentView}
              onNavigateToView={navigateToView}
              onSignOut={handleSignOut}
            />
          ) : (
            <Sidebar
              sidebarOpen={sidebarOpen}
              currentView={currentView}
              userRole={userRole}
              isOrganizer={effectiveIsOrganizer}
              accountManagementExpanded={accountManagementExpanded}
              dashboardExpanded={dashboardExpanded}
              registrationsExpanded={registrationsExpanded}
              certificatesExpanded={certificatesExpanded}
              submissionsExpanded={submissionsExpanded}
              toolsExpanded={toolsExpanded}
              juryExpanded={juryExpanded}
              eventsExpanded={eventsExpanded}
              projectManagementExpanded={projectManagementExpanded}
              participantToolsExpanded={participantToolsExpanded}
              paiementManagementExpanded={paiementManagementExpanded}
              academyExpanded={academyExpanded}
              opportunitiesExpanded={opportunitiesExpanded}
              participantOpportunitiesExpanded={participantOpportunitiesExpanded}
              onNavigateToView={navigateToView}
              onToggleAccountManagement={() =>
                setAccountManagementExpanded(!accountManagementExpanded)
              }
              onToggleDashboard={() => setDashboardExpanded(!dashboardExpanded)}
              onToggleRegistrations={() => setRegistrationsExpanded(!registrationsExpanded)}
              onToggleCertificates={() => setCertificatesExpanded(!certificatesExpanded)}
              onToggleSubmissions={() => setSubmissionsExpanded(!submissionsExpanded)}
              onToggleTools={() => setToolsExpanded(!toolsExpanded)}
              onToggleJury={() => setJuryExpanded(!juryExpanded)}
              onToggleEvents={() => setEventsExpanded(!eventsExpanded)}
              onToggleProjectManagement={() => setProjectManagementExpanded(!projectManagementExpanded)}
              onToggleParticipantTools={() => setParticipantToolsExpanded(!participantToolsExpanded)}
              onTogglePaiementManagement={() => setPaiementManagementExpanded(!paiementManagementExpanded)}
              onToggleAcademy={() => setAcademyExpanded(!academyExpanded)}
              onToggleOpportunities={() => setOpportunitiesExpanded(!opportunitiesExpanded)}
              onToggleParticipantOpportunities={() =>
                setParticipantOpportunitiesExpanded(!participantOpportunitiesExpanded)
              }
              onSignOut={handleSignOut}
            />
          )}

          <OrganizerAwareMain>
            <Header
              currentUser={currentUser}
              userRole={userRole}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex-1 p-8 overflow-auto">
              {effectiveIsOrganizer &&
                userRole === 'Organizer' &&
                currentView !== ViewState.ACCOUNT_SUBSCRIPTIONS && (
                  <SubscriptionUnpaidBanner />
                )}
              <AppRoutes
                isOrganizer={effectiveIsOrganizer}
                userRole={userRole}
                onNavigateToView={navigateToView}
                onEditPage={handleEditPage}
                onNewPage={handleNewPage}
                onBackToManager={handleBackToManager}
                onEditForm={handleEditForm}
                onNewForm={handleNewForm}
                onBackToFormList={handleBackToFormList}
              />
            </div>
          </OrganizerAwareMain>

          <AIAssistant />
        </div>
        </OrganizerPlatformSubscriptionProvider>
      </OrganizerEventScopeProvider>
    </AdminDisplaySettingsProvider>
  );
};

export default App;