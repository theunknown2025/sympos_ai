import React from 'react';
import { 
  LayoutDashboard, 
  Globe, 
  FileStack, 
  Users, 
  User,
  Award, 
  LogOut,
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
  Calendar,
  GraduationCap,
  FolderKanban,
  FolderOpen,
  Briefcase,
  Bell,
  Mail,
  Send,
  Code,
  BookOpen
} from 'lucide-react';
import { ViewState } from '../../../types';

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
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

interface SubItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  view: ViewState;
  active: boolean;
}

interface ExpandableSidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  subItems?: SubItem[];
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSubItemClick: (viewState: ViewState) => void;
}

const ExpandableSidebarItem: React.FC<ExpandableSidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  subItems, 
  active, 
  expanded, 
  onToggle,
  onSubItemClick 
}) => {
  const hasActiveSubItem = subItems?.some((item) => item.active);
  
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
          {subItems.map((item, index) => (
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

interface SidebarProps {
  sidebarOpen: boolean;
  currentView: ViewState;
  isOrganizer: boolean;
  dashboardExpanded: boolean;
  registrationsExpanded: boolean;
  certificatesExpanded: boolean;
  submissionsExpanded: boolean;
  toolsExpanded: boolean;
  juryExpanded: boolean;
  eventsExpanded: boolean;
  projectManagementExpanded: boolean;
  participantToolsExpanded: boolean;
  onNavigateToView: (viewState: ViewState, routeParams?: Record<string, string>) => void;
  onToggleDashboard: () => void;
  onToggleRegistrations: () => void;
  onToggleCertificates: () => void;
  onToggleSubmissions: () => void;
  onToggleTools: () => void;
  onToggleJury: () => void;
  onToggleEvents: () => void;
  onToggleProjectManagement: () => void;
  onToggleParticipantTools: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  currentView,
  isOrganizer,
  dashboardExpanded,
  registrationsExpanded,
  certificatesExpanded,
  submissionsExpanded,
  toolsExpanded,
  juryExpanded,
  eventsExpanded,
  projectManagementExpanded,
  participantToolsExpanded,
  onNavigateToView,
  onToggleDashboard,
  onToggleRegistrations,
  onToggleCertificates,
  onToggleSubmissions,
  onToggleTools,
  onToggleJury,
  onToggleEvents,
  onToggleProjectManagement,
  onToggleParticipantTools,
  onSignOut,
}) => {
  return (
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
          {/* Show different navigation based on user role */}
          {isOrganizer ? (
            <>
              {/* Organizer/Admin Navigation */}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={LayoutDashboard}
                  label="Dashboard"
                  active={currentView === ViewState.DASHBOARD || currentView === ViewState.ORGANIZER_PROFILE}
                  expanded={dashboardExpanded}
                  onToggle={onToggleDashboard}
                  subItems={[
                    {
                      icon: LayoutDashboard,
                      label: 'Overview',
                      view: ViewState.DASHBOARD,
                      active: currentView === ViewState.DASHBOARD,
                    },
                    {
                      icon: User,
                      label: 'Profile',
                      view: ViewState.ORGANIZER_PROFILE,
                      active: currentView === ViewState.ORGANIZER_PROFILE,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="" 
                  active={currentView === ViewState.DASHBOARD || currentView === ViewState.ORGANIZER_PROFILE} 
                  onClick={onToggleDashboard} 
                />
              )}
              {sidebarOpen ? (
                <SidebarItem
                  icon={Calendar}
                  label="Event Management"
                  active={currentView === ViewState.EVENT_MANAGEMENT}
                  onClick={() => onNavigateToView(ViewState.EVENT_MANAGEMENT)}
                />
              ) : (
                <SidebarItem 
                  icon={Calendar} 
                  label="" 
                  active={currentView === ViewState.EVENT_MANAGEMENT} 
                  onClick={() => onNavigateToView(ViewState.EVENT_MANAGEMENT)} 
                />
              )}
              <SidebarItem 
                icon={GraduationCap} 
                label={sidebarOpen ? "Academy - LMS" : ""} 
                active={currentView === ViewState.ACADEMY_LMS} 
                onClick={() => onNavigateToView(ViewState.ACADEMY_LMS)} 
              />
            </>
          ) : (
            <>
              {/* Participant/Jury Member Navigation */}
              <SidebarItem 
                icon={LayoutDashboard} 
                label={sidebarOpen ? "Dashboard" : ""} 
                active={currentView === ViewState.JURY_DASHBOARD} 
                onClick={() => onNavigateToView(ViewState.JURY_DASHBOARD)} 
              />
            </>
          )}
          {/* Organizer-only sidebar items */}
          {isOrganizer && (
            <>
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
                  onToggle={onToggleSubmissions}
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
                  onSubItemClick={onNavigateToView}
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
                  onClick={onToggleSubmissions} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Users}
                  label="Registrations"
                  active={currentView === ViewState.REGISTRATION_LIST || currentView === ViewState.CHECKIN}
                  expanded={registrationsExpanded}
                  onToggle={onToggleRegistrations}
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
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={Users} 
                  label="" 
                  active={currentView === ViewState.REGISTRATION_LIST || currentView === ViewState.CHECKIN} 
                  onClick={onToggleRegistrations} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Wrench}
                  label="Tools"
                  active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.PROGRAM_BUILDER || currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER || currentView === ViewState.FILES_MANAGER}
                  expanded={toolsExpanded}
                  onToggle={onToggleTools}
                  subItems={[
                    {
                      icon: Globe,
                      label: 'Landing Page Builder',
                      view: ViewState.LANDING_PAGES,
                      active: currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER,
                    },
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
                      icon: FolderOpen,
                      label: 'Files Manager',
                      view: ViewState.FILES_MANAGER,
                      active: currentView === ViewState.FILES_MANAGER,
                    },
                    {
                      icon: Palette,
                      label: 'Design Editor',
                      view: ViewState.CANVA_CERTIFICATE_BACKGROUND,
                      active: currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND,
                    },
                    {
                      icon: Mail,
                      label: 'Emailer',
                      view: ViewState.EMAILER,
                      active: currentView === ViewState.EMAILER,
                    },
                    {
                      icon: BookOpen,
                      label: 'Blogs',
                      view: ViewState.BLOGS,
                      active: currentView === ViewState.BLOGS,
                    },
                  ]}
                  onSubItemClick={(viewState: ViewState) => {
                    if (viewState === ViewState.FORM_BUILDER) {
                      onNavigateToView(ViewState.FORM_BUILDER);
                    } else if (viewState === ViewState.LANDING_PAGES) {
                      onNavigateToView(ViewState.LANDING_PAGES);
                    } else {
                      onNavigateToView(viewState);
                    }
                  }}
                />
              ) : (
                <SidebarItem 
                  icon={Wrench} 
                  label="" 
                  active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.PROGRAM_BUILDER || currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER || currentView === ViewState.FILES_MANAGER || currentView === ViewState.EMAILER || currentView === ViewState.BLOGS} 
                  onClick={onToggleTools} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Certificate}
                  label="Certificates Manager"
                  active={currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST || currentView === ViewState.GENERATE_CERTIFICATES}
                  expanded={certificatesExpanded}
                  onToggle={onToggleCertificates}
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
                      onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER);
                    } else {
                      onNavigateToView(viewState);
                    }
                  }}
                />
              ) : (
                <SidebarItem 
                  icon={Certificate} 
                  label="" 
                  active={currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST || currentView === ViewState.GENERATE_CERTIFICATES || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND} 
                  onClick={onToggleCertificates} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Briefcase}
                  label="Project Management"
                  active={currentView === ViewState.PROJECT_MANAGEMENT || 
                         currentView === ViewState.PERSONNEL_MANAGEMENT ||
                         currentView === ViewState.PROJECTS ||
                         currentView === ViewState.FOLLOW_UP}
                  expanded={projectManagementExpanded}
                  onToggle={onToggleProjectManagement}
                  subItems={[
                    {
                      icon: Users,
                      label: 'Personnel Management',
                      view: ViewState.PERSONNEL_MANAGEMENT,
                      active: currentView === ViewState.PERSONNEL_MANAGEMENT,
                    },
                    {
                      icon: FolderKanban,
                      label: 'Projects',
                      view: ViewState.PROJECTS,
                      active: currentView === ViewState.PROJECTS,
                    },
                    {
                      icon: Clock,
                      label: 'Follow up',
                      view: ViewState.FOLLOW_UP,
                      active: currentView === ViewState.FOLLOW_UP,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={Briefcase} 
                  label="" 
                  active={currentView === ViewState.PROJECT_MANAGEMENT || 
                         currentView === ViewState.PERSONNEL_MANAGEMENT ||
                         currentView === ViewState.PROJECTS ||
                         currentView === ViewState.FOLLOW_UP} 
                  onClick={onToggleProjectManagement} 
                />
              )}
            </>
          )}

          {/* Participant / Jury & Reviews - Show only for participants/jury members */}
          {!isOrganizer && (
            <>
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Award}
                  label="Participant"
                  active={currentView === ViewState.JURY || currentView === ViewState.JURY_DASHBOARD || currentView === ViewState.JURY_PROFILE || currentView === ViewState.JURY_INVITATIONS || currentView === ViewState.JURY_EVENTS || currentView === ViewState.JURY_REVIEWS || currentView === ViewState.PARTICIPANT_REGISTRATIONS || currentView === ViewState.PARTICIPANT_SUBMISSIONS}
                  expanded={juryExpanded}
                  onToggle={onToggleJury}
                  subItems={[
                    {
                      icon: LayoutDashboard,
                      label: 'Dashboard',
                      view: ViewState.JURY_DASHBOARD,
                      active: currentView === ViewState.JURY_DASHBOARD,
                    },
                    {
                      icon: Users,
                      label: 'My Profile',
                      view: ViewState.JURY_PROFILE,
                      active: currentView === ViewState.JURY_PROFILE,
                    },
                    {
                      icon: Bell,
                      label: 'Invitations',
                      view: ViewState.JURY_INVITATIONS,
                      active: currentView === ViewState.JURY_INVITATIONS,
                    },
                    {
                      icon: Calendar,
                      label: 'Events',
                      view: ViewState.JURY_EVENTS,
                      active: currentView === ViewState.JURY_EVENTS,
                    },
                    {
                      icon: FileText,
                      label: 'Reviews',
                      view: ViewState.JURY_REVIEWS,
                      active: currentView === ViewState.JURY_REVIEWS,
                    },
                    {
                      icon: ClipboardList,
                      label: 'Registrations',
                      view: ViewState.PARTICIPANT_REGISTRATIONS,
                      active: currentView === ViewState.PARTICIPANT_REGISTRATIONS,
                    },
                    {
                      icon: Send,
                      label: 'Submissions',
                      view: ViewState.PARTICIPANT_SUBMISSIONS,
                      active: currentView === ViewState.PARTICIPANT_SUBMISSIONS,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={Award} 
                  label="" 
                  active={currentView === ViewState.JURY || currentView === ViewState.JURY_DASHBOARD || currentView === ViewState.JURY_PROFILE || currentView === ViewState.JURY_INVITATIONS || currentView === ViewState.JURY_EVENTS || currentView === ViewState.JURY_REVIEWS || currentView === ViewState.PARTICIPANT_REGISTRATIONS || currentView === ViewState.PARTICIPANT_SUBMISSIONS} 
                  onClick={() => onNavigateToView(ViewState.JURY_DASHBOARD)} 
                />
              )}

              {/* Participant Tools - Show only for participants/jury members */}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Wrench}
                  label="Tools"
                  active={currentView === ViewState.PARTICIPANT_TOOLS || currentView === ViewState.LATEX_EDITOR}
                  expanded={participantToolsExpanded}
                  onToggle={onToggleParticipantTools}
                  subItems={[
                    {
                      icon: Code,
                      label: 'LaTeX Editor',
                      view: ViewState.LATEX_EDITOR,
                      active: currentView === ViewState.LATEX_EDITOR,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={Wrench} 
                  label="" 
                  active={currentView === ViewState.PARTICIPANT_TOOLS || currentView === ViewState.LATEX_EDITOR} 
                  onClick={onToggleParticipantTools} 
                />
              )}
            </>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

