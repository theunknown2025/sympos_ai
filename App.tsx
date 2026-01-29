import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ViewState } from './types';
import { isOrganizerOnlyView, isParticipantOnlyView } from './utils/roleGuard';
import LandingPage from './components/LandingPage/LandingPage';
import AuthContainer from './components/Admin/Auth/AuthContainer';
import AIAssistant from './components/Admin/AIAssistant';
import { Sidebar } from './components/Admin/Layout/Sidebar';
import { Header } from './components/Admin/Layout/Header';
import { AppRoutes } from './components/Admin/Layout/AppRoutes';
import ViewCertificate from './components/Admin/Certificates/ViewCertificate';
import PublicLandingPageViewer from './components/Admin/LPBuilder/Publisher/PublicLandingPageViewer';
import { supabase } from './supabase';
import { useAuth } from './hooks/useAuth';
import { getViewStateFromPath, getRoutePath } from './routes';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, userRole, isOrganizer, isParticipant, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [registrationsExpanded, setRegistrationsExpanded] = useState(false);
  const [certificatesExpanded, setCertificatesExpanded] = useState(false);
  const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [juryExpanded, setJuryExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [projectManagementExpanded, setProjectManagementExpanded] = useState(false);
  const [participantToolsExpanded, setParticipantToolsExpanded] = useState(false);

  // Get current view from URL
  const currentView = getViewStateFromPath(location.pathname) || ViewState.LANDING_PAGE;

  // Auto-expand Participant section when on participant pages
  useEffect(() => {
    if (currentView === ViewState.PARTICIPANT_REGISTRATIONS || 
        currentView === ViewState.PARTICIPANT_SUBMISSIONS ||
        currentView === ViewState.JURY_DASHBOARD ||
        currentView === ViewState.JURY_PROFILE ||
        currentView === ViewState.JURY_INVITATIONS ||
        currentView === ViewState.JURY_EVENTS ||
        currentView === ViewState.JURY_REVIEWS) {
      if (!juryExpanded) {
        setJuryExpanded(true);
      }
    }
  }, [currentView, juryExpanded]);

  // Auto-expand Participant Tools section when on tools pages
  useEffect(() => {
    if (currentView === ViewState.PARTICIPANT_TOOLS || 
        currentView === ViewState.LATEX_EDITOR) {
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

  // Initialize auth state and handle role-based redirects
  useEffect(() => {
    if (!authLoading && currentUser && userRole) {
      setIsInitializing(false);
      
      // Get current view
      const currentView = getViewStateFromPath(location.pathname);
      
      // If user is Participant and trying to access Organizer routes, redirect
      if (isParticipant && currentView && isOrganizerOnlyView(currentView)) {
        navigate(getRoutePath(ViewState.JURY_DASHBOARD), { replace: true });
        return;
      }
      
      // If user is Organizer and trying to access Participant-only routes, redirect
      if (isOrganizer && currentView && isParticipantOnlyView(currentView)) {
        navigate(getRoutePath(ViewState.DASHBOARD), { replace: true });
        return;
      }
      
      // If on root and authenticated, redirect based on role
      if (location.pathname === '/' && currentView === ViewState.LANDING_PAGE) {
        if (isParticipant) {
          navigate(getRoutePath(ViewState.JURY_DASHBOARD), { replace: true });
        } else if (isOrganizer) {
          navigate(getRoutePath(ViewState.DASHBOARD), { replace: true });
        }
      }
    } else if (!authLoading && !currentUser) {
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
    if (location.pathname === '/' || currentViewFromPath === ViewState.LANDING_PAGE) {
      return <LandingPage />;
    }
    // Show auth container for login/register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
      return <AuthContainer onAuthSuccess={() => navigate('/dashboard')} initialView={location.pathname === '/register' ? 'register' : 'login'} />;
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        sidebarOpen={sidebarOpen}
        currentView={currentView}
        isOrganizer={isOrganizer}
        dashboardExpanded={dashboardExpanded}
        registrationsExpanded={registrationsExpanded}
        certificatesExpanded={certificatesExpanded}
        submissionsExpanded={submissionsExpanded}
        toolsExpanded={toolsExpanded}
        juryExpanded={juryExpanded}
        eventsExpanded={eventsExpanded}
        projectManagementExpanded={projectManagementExpanded}
        participantToolsExpanded={participantToolsExpanded}
        onNavigateToView={navigateToView}
        onToggleDashboard={() => setDashboardExpanded(!dashboardExpanded)}
        onToggleRegistrations={() => setRegistrationsExpanded(!registrationsExpanded)}
        onToggleCertificates={() => setCertificatesExpanded(!certificatesExpanded)}
        onToggleSubmissions={() => setSubmissionsExpanded(!submissionsExpanded)}
        onToggleTools={() => setToolsExpanded(!toolsExpanded)}
        onToggleJury={() => setJuryExpanded(!juryExpanded)}
        onToggleEvents={() => setEventsExpanded(!eventsExpanded)}
        onToggleProjectManagement={() => setProjectManagementExpanded(!projectManagementExpanded)}
        onToggleParticipantTools={() => setParticipantToolsExpanded(!participantToolsExpanded)}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header
          sidebarOpen={sidebarOpen}
          currentUser={currentUser}
          userRole={userRole}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* View Content */}
        <div className="flex-1 p-8 overflow-auto">
          <AppRoutes
            isOrganizer={isOrganizer}
            onNavigateToView={navigateToView}
            onEditPage={handleEditPage}
            onNewPage={handleNewPage}
            onBackToManager={handleBackToManager}
            onEditForm={handleEditForm}
            onNewForm={handleNewForm}
            onBackToFormList={handleBackToFormList}
          />
        </div>
      </main>

      {/* Floating AI Assistant (MCP-like Tooling) */}
      <AIAssistant />
    </div>
  );
};

export default App;