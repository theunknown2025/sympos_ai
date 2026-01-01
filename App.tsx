import React, { useState, useEffect } from 'react';
import { 
  useNavigate, 
  useLocation, 
  useParams,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  FileStack, 
  Users, 
  Award, 
  Settings, 
  Menu,
  LogOut,
  Bell,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  ClipboardList,
  CheckSquare,
  Award as Certificate,
  FileEdit,
  Download,
  Clock,
  BarChart3,
  Users as UserCog,
  Wrench,
  Palette,
  Calendar
} from 'lucide-react';
import { ViewState } from './types';
import Dashboard from './components/Admin/Dashboard';
import PageBuilder from './components/Admin/LPBuilder/PageBuilder';
import LandingPageManager from './components/Admin/LPBuilder/LandingPageManager';
import FormBuilder from './components/Admin/Tools/FormBuilder/FormBuilder';
import RegistrationsView from './components/Admin/Registration/RegistrationsView';
import SubmissionManager from './components/Admin/SubmissionManager';
import SubmissionsDashboard from './components/Admin/Submissions/Dashboard';
import FollowUp from './components/Admin/Submissions/FollowUp';
import ManageSubmissions from './components/Admin/Submissions/ManageSubmissions';
import ManageCommittee from './components/Admin/Submissions/ManageCommittee';
import Reporting from './components/Admin/Submissions/Reporting';
import AuthContainer from './components/Admin/Auth/AuthContainer';
import AIAssistant from './components/Admin/AIAssistant';
import CertificateTemplateList from './components/Admin/Certificates/CertificateTemplateList';
import GenerateCertificates from './components/Admin/Certificates/GenerateCertificates';
import CanvaButton from './components/Admin/Tools/CanvaButton';
import ProgramBuilder from './components/Admin/Tools/ProgramBuilder/ProgramBuilder';
import { supabase } from './supabase';
import { useAuth } from './hooks/useAuth';
import { getViewStateFromPath, extractParams, getRoutePath } from './routes';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1
      ${active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

const ExpandableSidebarItem = ({ 
  icon: Icon, 
  label, 
  subItems, 
  active, 
  expanded, 
  onToggle,
  onSubItemClick 
}: any) => {
  const hasActiveSubItem = subItems?.some((item: any) => item.active);
  
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-lg
          ${active || hasActiveSubItem
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} />
          {label}
        </div>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {expanded && subItems && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
          {subItems.map((item: any, index: number) => (
            <button
              key={index}
              onClick={() => onSubItemClick(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors rounded-lg
                ${item.active
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [registrationsExpanded, setRegistrationsExpanded] = useState(false);
  const [certificatesExpanded, setCertificatesExpanded] = useState(false);
  const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // Get current view from URL
  const currentView = getViewStateFromPath(location.pathname) || ViewState.DASHBOARD;
  const editingPageId = params.pageId;
  const editingFormId = params.formId;
  const editingTemplateId = params.templateId;

  // Initialize auth state
  useEffect(() => {
    if (!authLoading) {
      setIsInitializing(false);
    }
  }, [authLoading]);

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

  if (!currentUser) {
    return <AuthContainer onAuthSuccess={() => navigate('/')} />;
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
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
            <Globe className="text-white" size={20} />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Sympose AI
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label={sidebarOpen ? "Dashboard" : ""} 
              active={currentView === ViewState.DASHBOARD} 
              onClick={() => navigateToView(ViewState.DASHBOARD)} 
            />
            <SidebarItem 
              icon={Globe} 
              label={sidebarOpen ? "Landing Pages" : ""} 
              active={currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER} 
              onClick={() => navigateToView(ViewState.LANDING_PAGES)} 
            />
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={FileStack}
                label="Submissions"
                active={currentView === ViewState.SUBMISSIONS || 
                       currentView === ViewState.SUBMISSIONS_DASHBOARD ||
                       currentView === ViewState.SUBMISSIONS_FOLLOW_UP ||
                       currentView === ViewState.SUBMISSIONS_MANAGE ||
                       currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE ||
                       currentView === ViewState.SUBMISSIONS_REPORTING}
                expanded={submissionsExpanded}
                onToggle={() => setSubmissionsExpanded(!submissionsExpanded)}
                subItems={[
                  {
                    icon: LayoutDashboard,
                    label: 'Dashboard',
                    view: ViewState.SUBMISSIONS_DASHBOARD,
                    active: currentView === ViewState.SUBMISSIONS_DASHBOARD,
                  },
                  {
                    icon: Clock,
                    label: 'Follow up',
                    view: ViewState.SUBMISSIONS_FOLLOW_UP,
                    active: currentView === ViewState.SUBMISSIONS_FOLLOW_UP,
                  },
                  {
                    icon: FileText,
                    label: 'Manage Submissions',
                    view: ViewState.SUBMISSIONS_MANAGE,
                    active: currentView === ViewState.SUBMISSIONS_MANAGE,
                  },
                  {
                    icon: UserCog,
                    label: 'Manage Committee',
                    view: ViewState.SUBMISSIONS_MANAGE_COMMITTEE,
                    active: currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE,
                  },
                  {
                    icon: BarChart3,
                    label: 'Reporting',
                    view: ViewState.SUBMISSIONS_REPORTING,
                    active: currentView === ViewState.SUBMISSIONS_REPORTING,
                  },
                ]}
                onSubItemClick={(viewState: ViewState) => {
                  navigateToView(viewState);
                }}
              />
            ) : (
              <SidebarItem 
                icon={FileStack} 
                label="" 
                active={currentView === ViewState.SUBMISSIONS || 
                       currentView === ViewState.SUBMISSIONS_DASHBOARD ||
                       currentView === ViewState.SUBMISSIONS_FOLLOW_UP ||
                       currentView === ViewState.SUBMISSIONS_MANAGE ||
                       currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE ||
                       currentView === ViewState.SUBMISSIONS_REPORTING} 
                onClick={() => setSubmissionsExpanded(!submissionsExpanded)} 
              />
            )}
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={Users}
                label="Registrations"
                active={currentView === ViewState.REGISTRATION_LIST || currentView === ViewState.CHECKIN}
                expanded={registrationsExpanded}
                onToggle={() => setRegistrationsExpanded(!registrationsExpanded)}
                subItems={[
                  {
                    icon: ClipboardList,
                    label: 'Registration',
                    view: ViewState.REGISTRATION_LIST,
                    active: currentView === ViewState.REGISTRATION_LIST,
                  },
                  {
                    icon: CheckSquare,
                    label: 'Checkin',
                    view: ViewState.CHECKIN,
                    active: currentView === ViewState.CHECKIN,
                  },
                ]}
                onSubItemClick={(viewState: ViewState) => {
                  navigateToView(viewState);
                }}
              />
            ) : (
              <SidebarItem 
                icon={Users} 
                label="" 
                active={currentView === ViewState.REGISTRATION_LIST || currentView === ViewState.CHECKIN} 
                onClick={() => setRegistrationsExpanded(!registrationsExpanded)} 
              />
            )}
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={Wrench}
                label="Tools"
                active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.PROGRAM_BUILDER}
                expanded={toolsExpanded}
                onToggle={() => setToolsExpanded(!toolsExpanded)}
                subItems={[
                  {
                    icon: FileText,
                    label: 'Form Builder',
                    view: ViewState.FORM_BUILDER,
                    active: currentView === ViewState.FORM_BUILDER,
                  },
                  {
                    icon: Calendar,
                    label: 'Program Builder',
                    view: ViewState.PROGRAM_BUILDER,
                    active: currentView === ViewState.PROGRAM_BUILDER,
                  },
                  {
                    icon: Palette,
                    label: 'Design Editor',
                    view: ViewState.CANVA_CERTIFICATE_BACKGROUND,
                    active: currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND,
                  },
                ]}
                onSubItemClick={(viewState: ViewState) => {
                  if (viewState === ViewState.FORM_BUILDER) {
                    navigateToView(ViewState.FORM_BUILDER);
                  } else {
                    navigateToView(viewState);
                  }
                }}
              />
            ) : (
              <SidebarItem 
                icon={Wrench} 
                label="" 
                active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.PROGRAM_BUILDER} 
                onClick={() => setToolsExpanded(!toolsExpanded)} 
              />
            )}
            <SidebarItem 
              icon={Award} 
              label={sidebarOpen ? "Jury & Reviews" : ""} 
              active={currentView === ViewState.JURY} 
              onClick={() => navigateToView(ViewState.JURY)} 
            />
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={Certificate}
                label="Certificates Manager"
                active={currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST || currentView === ViewState.GENERATE_CERTIFICATES}
                expanded={certificatesExpanded}
                onToggle={() => setCertificatesExpanded(!certificatesExpanded)}
                subItems={[
                  {
                    icon: FileEdit,
                    label: 'Manage Templates',
                    view: ViewState.CERTIFICATE_TEMPLATE_LIST,
                    active: currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST,
                  },
                  {
                    icon: Download,
                    label: 'Generate Certificates',
                    view: ViewState.GENERATE_CERTIFICATES,
                    active: currentView === ViewState.GENERATE_CERTIFICATES,
                  },
                ]}
                onSubItemClick={(viewState: ViewState) => {
                  if (viewState === ViewState.CERTIFICATE_TEMPLATE_BUILDER) {
                    navigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER);
                  } else {
                    navigateToView(viewState);
                  }
                }}
              />
            ) : (
              <SidebarItem 
                icon={Certificate} 
                label="" 
                active={currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST || currentView === ViewState.GENERATE_CERTIFICATES || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND} 
                onClick={() => setCertificatesExpanded(!certificatesExpanded)} 
              />
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                  {currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-slate-500">Conference Chair</p>
              </div>
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase">
                {currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/landing-pages" element={
              <LandingPageManager 
                onEdit={handleEditPage}
                onNew={handleNewPage}
              />
            } />
            <Route path="/builder" element={
              <PageBuilder 
                pageId={undefined} 
                onBack={handleBackToManager}
              />
            } />
            <Route path="/builder/:pageId" element={
              <PageBuilder 
                pageId={editingPageId} 
                onBack={handleBackToManager}
              />
            } />
            <Route path="/forms" element={
              <FormBuilder 
                formId={undefined}
                onSave={handleBackToFormList}
                onEdit={handleEditForm}
                onNew={handleNewForm}
              />
            } />
            <Route path="/forms/:formId" element={
              <FormBuilder 
                formId={editingFormId}
                onSave={handleBackToFormList}
                onEdit={handleEditForm}
                onNew={handleNewForm}
              />
            } />
            <Route path="/submissions" element={<SubmissionManager />} />
            <Route path="/submissions/dashboard" element={<SubmissionsDashboard />} />
            <Route path="/submissions/follow-up" element={<FollowUp />} />
            <Route path="/submissions/manage" element={<ManageSubmissions />} />
            <Route path="/submissions/committee" element={<ManageCommittee />} />
            <Route path="/submissions/reporting" element={<Reporting />} />
            <Route path="/registrations/list" element={<RegistrationsView />} />
            <Route path="/checkin" element={
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <CheckSquare size={48} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium">Check-in</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            } />
            <Route path="/certificates/templates" element={
              <CertificateTemplateList
                templateId={undefined}
                onEdit={(id) => navigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER, { templateId: id })}
                onNew={() => navigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER)}
                onSave={() => navigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
              />
            } />
            <Route path="/certificates/templates/:templateId" element={
              <CertificateTemplateList
                templateId={editingTemplateId}
                onEdit={(id) => navigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER, { templateId: id })}
                onNew={() => navigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER)}
                onSave={() => navigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
              />
            } />
            <Route path="/certificates/generate" element={<GenerateCertificates />} />
            <Route path="/certificates/design" element={
              <CanvaButton
                onClick={() => {
                  // TODO: Open design editor when ready
                  console.log('Design editor will open here');
                }}
                onBack={() => navigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
              />
            } />
            <Route path="/program-builder" element={<ProgramBuilder />} />
            <Route path="/jury" element={
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Settings size={48} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium">This module is coming soon.</p>
                <p className="text-sm">We are focusing on Dashboard, Builder, and Submissions for this demo.</p>
              </div>
            } />
            <Route path="/settings" element={
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Settings size={48} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium">Settings</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Floating AI Assistant (MCP-like Tooling) */}
      <AIAssistant />
    </div>
  );
};

export default App;