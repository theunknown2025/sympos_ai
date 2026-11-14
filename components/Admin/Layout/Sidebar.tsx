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
  BookOpen,
  Presentation,
  ImageIcon,
  CreditCard,
  Plus,
  MessageSquare,
  Flower2,
  Lock
} from 'lucide-react';
import { SubscriptionRole, ViewState } from '../../../types';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { getAdminNavLabels } from '../../../i18n/adminNavLabels';
import { useOrganizerChooserLayout } from '../../../contexts/OrganizerEventScopeContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, disabled }) => (
  <button 
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1
      ${disabled
        ? 'text-slate-300 cursor-not-allowed opacity-50'
        : active 
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
  disabled?: boolean;
}

interface ExpandableSidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  subItems?: SubItem[];
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSubItemClick: (viewState: ViewState) => void;
  disabled?: boolean;
}

const ExpandableSidebarItem: React.FC<ExpandableSidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  subItems, 
  active, 
  expanded, 
  onToggle,
  onSubItemClick,
  disabled,
}) => {
  const hasActiveSubItem = subItems?.some((item) => item.active);
  
  return (
    <div className={`mb-1 ${disabled ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-lg
          ${disabled
            ? 'text-slate-300 cursor-not-allowed'
            : active || hasActiveSubItem
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
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                onSubItemClick(item.view);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors rounded-lg
                ${item.disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : item.active
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
  userRole: SubscriptionRole | null;
  isOrganizer: boolean;
  accountManagementExpanded: boolean;
  dashboardExpanded: boolean;
  registrationsExpanded: boolean;
  certificatesExpanded: boolean;
  submissionsExpanded: boolean;
  toolsExpanded: boolean;
  juryExpanded: boolean;
  eventsExpanded: boolean;
  projectManagementExpanded: boolean;
  participantToolsExpanded: boolean;
  paiementManagementExpanded: boolean;
  academyExpanded: boolean;
  opportunitiesExpanded: boolean;
  participantOpportunitiesExpanded: boolean;
  onNavigateToView: (viewState: ViewState, routeParams?: Record<string, string>) => void;
  onToggleAccountManagement: () => void;
  onToggleDashboard: () => void;
  onToggleRegistrations: () => void;
  onToggleCertificates: () => void;
  onToggleSubmissions: () => void;
  onToggleTools: () => void;
  onToggleJury: () => void;
  onToggleEvents: () => void;
  onToggleProjectManagement: () => void;
  onToggleParticipantTools: () => void;
  onTogglePaiementManagement: () => void;
  onToggleAcademy: () => void;
  onToggleOpportunities: () => void;
  onToggleParticipantOpportunities: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  currentView,
  userRole,
  isOrganizer,
  accountManagementExpanded,
  dashboardExpanded,
  registrationsExpanded,
  certificatesExpanded,
  submissionsExpanded,
  toolsExpanded,
  juryExpanded,
  eventsExpanded,
  projectManagementExpanded,
  participantToolsExpanded,
  paiementManagementExpanded,
  academyExpanded,
  opportunitiesExpanded,
  participantOpportunitiesExpanded,
  onNavigateToView,
  onToggleAccountManagement,
  onToggleDashboard,
  onToggleRegistrations,
  onToggleCertificates,
  onToggleSubmissions,
  onToggleTools,
  onToggleJury,
  onToggleEvents,
  onToggleProjectManagement,
  onToggleParticipantTools,
  onTogglePaiementManagement,
  onToggleAcademy,
  onToggleOpportunities,
  onToggleParticipantOpportunities,
  onSignOut,
}) => {
  const { language } = useAdminDisplaySettings();
  const nav = getAdminNavLabels(language);
  const hideForOrganizerChooser = useOrganizerChooserLayout();
  const { needsPackage, loading: subscriptionLoading } = useOrganizerPlatformSubscription();
  /** Until an offer is selected, only Subscriptions is usable. */
  const navLocked =
    isOrganizer && userRole === 'Organizer' && !subscriptionLoading && needsPackage;

  if (hideForOrganizerChooser && !navLocked) return null;

  const handleNavigate = (viewState: ViewState) => {
    if (
      navLocked &&
      viewState !== ViewState.ACCOUNT_SUBSCRIPTIONS &&
      viewState !== ViewState.ACCOUNT_PRO
    ) {
      return;
    }
    onNavigateToView(viewState);
  };

  return (
    <aside 
      className={`${sidebarOpen ? 'w-64' : 'w-20'} 
      bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-full shrink-0 z-20`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
          <Globe className="text-white" size={20} />
        </div>
        {sidebarOpen && (
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            {nav.brand}
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto flex flex-col">
        <div className="space-y-1 flex-1">
          {/* Show different navigation based on user role */}
          {isOrganizer ? (
            <>
              {/* Account Management — first in sidebar */}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={UserCog}
                  label={nav.accountManagement}
                  active={
                    currentView === ViewState.ENTITY_PROFILE ||
                    currentView === ViewState.ACCOUNT_LOGIN ||
                    currentView === ViewState.ACCOUNT_SUBSCRIPTIONS
                  }
                  expanded={accountManagementExpanded || navLocked}
                  onToggle={onToggleAccountManagement}
                  subItems={[
                    {
                      icon: User,
                      label: nav.profile,
                      view: ViewState.ENTITY_PROFILE,
                      active: currentView === ViewState.ENTITY_PROFILE,
                      disabled: navLocked,
                    },
                    {
                      icon: Lock,
                      label: nav.accountLogin,
                      view: ViewState.ACCOUNT_LOGIN,
                      active: currentView === ViewState.ACCOUNT_LOGIN,
                      disabled: navLocked,
                    },
                    {
                      icon: CreditCard,
                      label: nav.accountSubscriptions,
                      view: ViewState.ACCOUNT_SUBSCRIPTIONS,
                      active: currentView === ViewState.ACCOUNT_SUBSCRIPTIONS,
                      disabled: false,
                    },
                  ]}
                  onSubItemClick={handleNavigate}
                />
              ) : (
                <SidebarItem
                  icon={UserCog}
                  label=""
                  active={
                    currentView === ViewState.ENTITY_PROFILE ||
                    currentView === ViewState.ACCOUNT_LOGIN ||
                    currentView === ViewState.ACCOUNT_SUBSCRIPTIONS
                  }
                  onClick={() => {
                    if (navLocked) {
                      handleNavigate(ViewState.ACCOUNT_SUBSCRIPTIONS);
                      return;
                    }
                    onToggleAccountManagement();
                  }}
                />
              )}
              <div
                className={navLocked ? 'opacity-40 pointer-events-none select-none' : undefined}
                aria-disabled={navLocked || undefined}
              >
              {/* Organizer/Admin Navigation */}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={LayoutDashboard}
                  label={nav.dashboard}
                  active={currentView === ViewState.DASHBOARD}
                  expanded={dashboardExpanded}
                  onToggle={onToggleDashboard}
                  disabled={navLocked}
                  subItems={[
                    {
                      icon: LayoutDashboard,
                      label: nav.overview,
                      view: ViewState.DASHBOARD,
                      active: currentView === ViewState.DASHBOARD,
                      disabled: navLocked,
                    },
                  ]}
                  onSubItemClick={handleNavigate}
                />
              ) : (
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="" 
                  active={currentView === ViewState.DASHBOARD}
                  disabled={navLocked}
                  onClick={onToggleDashboard} 
                />
              )}
              {sidebarOpen ? (
                <SidebarItem
                  icon={Calendar}
                  label={nav.eventManagement}
                  active={currentView === ViewState.EVENT_MANAGEMENT}
                  disabled={navLocked}
                  onClick={() => handleNavigate(ViewState.EVENT_MANAGEMENT)}
                />
              ) : (
                <SidebarItem 
                  icon={Calendar} 
                  label="" 
                  active={currentView === ViewState.EVENT_MANAGEMENT}
                  disabled={navLocked}
                  onClick={() => handleNavigate(ViewState.EVENT_MANAGEMENT)} 
                />
              )}
              </div>
            </>
          ) : (
            <>
              {/* Participant navigation */}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={LayoutDashboard}
                  label={nav.dashboard}
                  active={
                    currentView === ViewState.JURY_DASHBOARD ||
                    currentView === ViewState.JURY_PROFILE
                  }
                  expanded={dashboardExpanded}
                  onToggle={onToggleDashboard}
                  subItems={[
                    {
                      icon: LayoutDashboard,
                      label: nav.dashboard,
                      view: ViewState.JURY_DASHBOARD,
                      active: currentView === ViewState.JURY_DASHBOARD,
                    },
                    {
                      icon: User,
                      label: nav.profile,
                      view: ViewState.JURY_PROFILE,
                      active: currentView === ViewState.JURY_PROFILE,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem
                  icon={LayoutDashboard}
                  label=""
                  active={
                    currentView === ViewState.JURY_DASHBOARD ||
                    currentView === ViewState.JURY_PROFILE
                  }
                  onClick={onToggleDashboard}
                />
              )}

              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Award}
                  label={nav.reviews}
                  active={
                    currentView === ViewState.JURY_INVITATIONS ||
                    currentView === ViewState.JURY_REVIEWS
                  }
                  expanded={juryExpanded}
                  onToggle={onToggleJury}
                  subItems={[
                    {
                      icon: Bell,
                      label: nav.invitations,
                      view: ViewState.JURY_INVITATIONS,
                      active: currentView === ViewState.JURY_INVITATIONS,
                    },
                    {
                      icon: FileText,
                      label: nav.reviews,
                      view: ViewState.JURY_REVIEWS,
                      active: currentView === ViewState.JURY_REVIEWS,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem
                  icon={Award}
                  label=""
                  active={
                    currentView === ViewState.JURY_INVITATIONS ||
                    currentView === ViewState.JURY_REVIEWS
                  }
                  onClick={onToggleJury}
                />
              )}

              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Calendar}
                  label={nav.participations}
                  active={
                    currentView === ViewState.JURY_EVENTS ||
                    currentView === ViewState.PARTICIPANT_REGISTRATIONS ||
                    currentView === ViewState.PARTICIPANT_SUBMISSIONS ||
                    currentView === ViewState.PARTICIPANT_CERTIFICATES
                  }
                  expanded={eventsExpanded}
                  onToggle={onToggleEvents}
                  subItems={[
                    {
                      icon: Calendar,
                      label: nav.events,
                      view: ViewState.JURY_EVENTS,
                      active: currentView === ViewState.JURY_EVENTS,
                    },
                    {
                      icon: ClipboardList,
                      label: nav.registrations,
                      view: ViewState.PARTICIPANT_REGISTRATIONS,
                      active: currentView === ViewState.PARTICIPANT_REGISTRATIONS,
                    },
                    {
                      icon: Send,
                      label: nav.submissions,
                      view: ViewState.PARTICIPANT_SUBMISSIONS,
                      active: currentView === ViewState.PARTICIPANT_SUBMISSIONS,
                    },
                    {
                      icon: Certificate,
                      label: nav.participantCertificates,
                      view: ViewState.PARTICIPANT_CERTIFICATES,
                      active: currentView === ViewState.PARTICIPANT_CERTIFICATES,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem
                  icon={Calendar}
                  label=""
                  active={
                    currentView === ViewState.JURY_EVENTS ||
                    currentView === ViewState.PARTICIPANT_REGISTRATIONS ||
                    currentView === ViewState.PARTICIPANT_SUBMISSIONS ||
                    currentView === ViewState.PARTICIPANT_CERTIFICATES
                  }
                  onClick={onToggleEvents}
                />
              )}

              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={FolderKanban}
                  label={nav.opportunities}
                  active={
                    currentView === ViewState.PARTICIPANT_OPPORTUNITIES ||
                    currentView === ViewState.PARTICIPANT_OPPORTUNITY_APPLICATIONS
                  }
                  expanded={participantOpportunitiesExpanded}
                  onToggle={onToggleParticipantOpportunities}
                  subItems={[
                    {
                      icon: Globe,
                      label: nav.browseOpportunities,
                      view: ViewState.PARTICIPANT_OPPORTUNITIES,
                      active: currentView === ViewState.PARTICIPANT_OPPORTUNITIES,
                    },
                    {
                      icon: ClipboardList,
                      label: nav.myOpportunityApplications,
                      view: ViewState.PARTICIPANT_OPPORTUNITY_APPLICATIONS,
                      active: currentView === ViewState.PARTICIPANT_OPPORTUNITY_APPLICATIONS,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem
                  icon={FolderKanban}
                  label=""
                  active={
                    currentView === ViewState.PARTICIPANT_OPPORTUNITIES ||
                    currentView === ViewState.PARTICIPANT_OPPORTUNITY_APPLICATIONS
                  }
                  onClick={onToggleParticipantOpportunities}
                />
              )}

              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Wrench}
                  label={nav.tools}
                  active={
                    currentView === ViewState.PARTICIPANT_TOOLS ||
                    currentView === ViewState.LATEX_EDITOR ||
                    currentView === ViewState.CV_BUILDER ||
                    currentView === ViewState.PROFILE_BUILDER ||
                    currentView === ViewState.PARTICIPANT_BLOG
                  }
                  expanded={participantToolsExpanded}
                  onToggle={onToggleParticipantTools}
                  subItems={[
                    {
                      icon: Code,
                      label: nav.latexEditor,
                      view: ViewState.LATEX_EDITOR,
                      active: currentView === ViewState.LATEX_EDITOR,
                    },
                    {
                      icon: FileText,
                      label: nav.cvBuilder,
                      view: ViewState.CV_BUILDER,
                      active: currentView === ViewState.CV_BUILDER,
                    },
                    {
                      icon: User,
                      label: nav.profileBuilder,
                      view: ViewState.PROFILE_BUILDER,
                      active: currentView === ViewState.PROFILE_BUILDER,
                    },
                    {
                      icon: BookOpen,
                      label: nav.blog,
                      view: ViewState.PARTICIPANT_BLOG,
                      active: currentView === ViewState.PARTICIPANT_BLOG,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem
                  icon={Wrench}
                  label=""
                  active={
                    currentView === ViewState.PARTICIPANT_TOOLS ||
                    currentView === ViewState.LATEX_EDITOR ||
                    currentView === ViewState.CV_BUILDER ||
                    currentView === ViewState.PROFILE_BUILDER ||
                    currentView === ViewState.PARTICIPANT_BLOG
                  }
                  onClick={onToggleParticipantTools}
                />
              )}

              {sidebarOpen ? (
                <SidebarItem
                  icon={GraduationCap}
                  label={nav.academy}
                  active={
                    currentView === ViewState.PARTICIPANT_ACADEMY ||
                    currentView === ViewState.PARTICIPANT_ACADEMY_COURSES
                  }
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_ACADEMY)}
                />
              ) : (
                <SidebarItem
                  icon={GraduationCap}
                  label=""
                  active={
                    currentView === ViewState.PARTICIPANT_ACADEMY ||
                    currentView === ViewState.PARTICIPANT_ACADEMY_COURSES
                  }
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_ACADEMY)}
                />
              )}

              {sidebarOpen ? (
                <SidebarItem
                  icon={MessageSquare}
                  label={nav.chat}
                  active={currentView === ViewState.PARTICIPANT_MESSAGING}
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_MESSAGING)}
                />
              ) : (
                <SidebarItem
                  icon={MessageSquare}
                  label=""
                  active={currentView === ViewState.PARTICIPANT_MESSAGING}
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_MESSAGING)}
                />
              )}

              {sidebarOpen ? (
                <SidebarItem
                  icon={Flower2}
                  label={nav.morchid}
                  active={currentView === ViewState.PARTICIPANT_MORCHID}
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_MORCHID)}
                />
              ) : (
                <SidebarItem
                  icon={Flower2}
                  label=""
                  active={currentView === ViewState.PARTICIPANT_MORCHID}
                  onClick={() => onNavigateToView(ViewState.PARTICIPANT_MORCHID)}
                />
              )}
            </>
          )}
          {/* Organizer-only sidebar items */}
          {isOrganizer && (
            <div
              className={navLocked ? 'opacity-40 pointer-events-none select-none' : undefined}
              aria-disabled={navLocked || undefined}
            >
              {userRole === 'SubSuperAdmin' && (
                sidebarOpen ? (
                  <ExpandableSidebarItem
                    icon={Briefcase}
                    label={nav.superAdmin}
                    active={
                      currentView === ViewState.SUPERADMIN_DASHBOARD ||
                      currentView === ViewState.SUPERADMIN_SUBSCRIPTIONS
                    }
                    expanded={dashboardExpanded}
                    onToggle={onToggleDashboard}
                    subItems={[
                      {
                        icon: LayoutDashboard,
                        label: nav.dashboard,
                        view: ViewState.SUPERADMIN_DASHBOARD,
                        active: currentView === ViewState.SUPERADMIN_DASHBOARD,
                      },
                      {
                        icon: Users,
                        label: nav.subscriptions,
                        view: ViewState.SUPERADMIN_SUBSCRIPTIONS,
                        active: currentView === ViewState.SUPERADMIN_SUBSCRIPTIONS,
                      },
                    ]}
                    onSubItemClick={onNavigateToView}
                  />
                ) : (
                  <SidebarItem
                    icon={Briefcase}
                    label=""
                    active={
                      currentView === ViewState.SUPERADMIN_DASHBOARD ||
                      currentView === ViewState.SUPERADMIN_SUBSCRIPTIONS
                    }
                    onClick={() => onNavigateToView(ViewState.SUPERADMIN_SUBSCRIPTIONS)}
                  />
                )
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={FileStack}
                  label={nav.submissions}
                  active={currentView === ViewState.SUBMISSIONS || 
                         currentView === ViewState.SUBMISSIONS_DASHBOARD ||
                         currentView === ViewState.SUBMISSIONS_FOLLOW_UP ||
                         currentView === ViewState.SUBMISSIONS_MANAGE ||
                         currentView === ViewState.SUBMISSIONS_PARTICIPANTS ||
                         currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE ||
                         currentView === ViewState.SUBMISSIONS_REPORTING ||
                         currentView === ViewState.PROGRAM_BUILDER}
                  expanded={submissionsExpanded}
                  onToggle={onToggleSubmissions}
                  subItems={[
                    {
                      icon: LayoutDashboard,
                      label: nav.dashboard,
                      view: ViewState.SUBMISSIONS_DASHBOARD,
                      active: currentView === ViewState.SUBMISSIONS_DASHBOARD,
                    },
                    {
                      icon: Clock,
                      label: nav.followUp,
                      view: ViewState.SUBMISSIONS_FOLLOW_UP,
                      active: currentView === ViewState.SUBMISSIONS_FOLLOW_UP,
                    },
                    {
                      icon: FileText,
                      label: nav.manageSubmissions,
                      view: ViewState.SUBMISSIONS_MANAGE,
                      active: currentView === ViewState.SUBMISSIONS_MANAGE,
                    },
                    {
                      icon: Users,
                      label: nav.manageParticipants,
                      view: ViewState.SUBMISSIONS_PARTICIPANTS,
                      active: currentView === ViewState.SUBMISSIONS_PARTICIPANTS,
                    },
                    {
                      icon: UserCog,
                      label: nav.manageCommittee,
                      view: ViewState.SUBMISSIONS_MANAGE_COMMITTEE,
                      active: currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE,
                    },
                    {
                      icon: BarChart3,
                      label: nav.reporting,
                      view: ViewState.SUBMISSIONS_REPORTING,
                      active: currentView === ViewState.SUBMISSIONS_REPORTING,
                    },
                    {
                      icon: Calendar,
                      label: nav.programBuilder,
                      view: ViewState.PROGRAM_BUILDER,
                      active: currentView === ViewState.PROGRAM_BUILDER,
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
                         currentView === ViewState.SUBMISSIONS_PARTICIPANTS ||
                         currentView === ViewState.SUBMISSIONS_MANAGE_COMMITTEE ||
                         currentView === ViewState.SUBMISSIONS_REPORTING ||
                         currentView === ViewState.PROGRAM_BUILDER} 
                  onClick={onToggleSubmissions} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Users}
                  label={nav.registrations}
                  active={currentView === ViewState.REGISTRATION_LIST || currentView === ViewState.CHECKIN}
                  expanded={registrationsExpanded}
                  onToggle={onToggleRegistrations}
                  subItems={[
                    {
                      icon: ClipboardList,
                      label: nav.registration,
                      view: ViewState.REGISTRATION_LIST,
                      active: currentView === ViewState.REGISTRATION_LIST,
                    },
                    {
                      icon: CheckSquare,
                      label: nav.checkin,
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
                  label={nav.tools}
                  active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER || currentView === ViewState.FILES_MANAGER || currentView === ViewState.POSTER_MANAGER}
                  expanded={toolsExpanded}
                  onToggle={onToggleTools}
                  subItems={[
                    {
                      icon: Globe,
                      label: nav.landingPageBuilder,
                      view: ViewState.LANDING_PAGES,
                      active: currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER,
                    },
                    {
                      icon: FileText,
                      label: nav.formBuilder,
                      view: ViewState.FORM_BUILDER,
                      active: currentView === ViewState.FORM_BUILDER,
                    },
                    {
                      icon: FolderOpen,
                      label: nav.filesManager,
                      view: ViewState.FILES_MANAGER,
                      active: currentView === ViewState.FILES_MANAGER,
                    },
                    {
                      icon: Palette,
                      label: nav.designEditor,
                      view: ViewState.CANVA_CERTIFICATE_BACKGROUND,
                      active: currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND,
                    },
                    {
                      icon: Mail,
                      label: nav.emailer,
                      view: ViewState.EMAILER,
                      active: currentView === ViewState.EMAILER,
                    },
                    {
                      icon: BookOpen,
                      label: nav.blogs,
                      view: ViewState.BLOGS,
                      active: currentView === ViewState.BLOGS,
                    },
                    {
                      icon: Presentation,
                      label: nav.presenter,
                      view: ViewState.PRESENTER,
                      active: currentView === ViewState.PRESENTER,
                    },
                    {
                      icon: ImageIcon,
                      label: nav.posterManager,
                      view: ViewState.POSTER_MANAGER,
                      active: currentView === ViewState.POSTER_MANAGER,
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
                  active={currentView === ViewState.FORM_BUILDER || currentView === ViewState.CANVA_CERTIFICATE_BACKGROUND || currentView === ViewState.LANDING_PAGES || currentView === ViewState.BUILDER || currentView === ViewState.FILES_MANAGER || currentView === ViewState.EMAILER || currentView === ViewState.BLOGS || currentView === ViewState.PRESENTER || currentView === ViewState.POSTER_MANAGER} 
                  onClick={onToggleTools} 
                />
              )}
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={Certificate}
                  label={nav.certificatesManager}
                  active={currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST || currentView === ViewState.GENERATE_CERTIFICATES}
                  expanded={certificatesExpanded}
                  onToggle={onToggleCertificates}
                  subItems={[
                    {
                      icon: FileEdit,
                      label: nav.manageTemplates,
                      view: ViewState.CERTIFICATE_TEMPLATE_LIST,
                      active: currentView === ViewState.CERTIFICATE_TEMPLATE_BUILDER || currentView === ViewState.CERTIFICATE_TEMPLATE_LIST,
                    },
                    {
                      icon: Download,
                      label: nav.generateCertificates,
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
                  label={nav.projectManagement}
                  active={currentView === ViewState.PROJECT_MANAGEMENT || 
                         currentView === ViewState.PERSONNEL_MANAGEMENT ||
                         currentView === ViewState.PROJECTS ||
                         currentView === ViewState.FOLLOW_UP}
                  expanded={projectManagementExpanded}
                  onToggle={onToggleProjectManagement}
                  subItems={[
                    {
                      icon: Users,
                      label: nav.personnelManagement,
                      view: ViewState.PERSONNEL_MANAGEMENT,
                      active: currentView === ViewState.PERSONNEL_MANAGEMENT,
                    },
                    {
                      icon: FolderKanban,
                      label: nav.projects,
                      view: ViewState.PROJECTS,
                      active: currentView === ViewState.PROJECTS,
                    },
                    {
                      icon: Clock,
                      label: nav.followUp,
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
              {sidebarOpen ? (
                <ExpandableSidebarItem
                  icon={CreditCard}
                  label={nav.paiementManagement}
                  active={currentView === ViewState.PAIEMENT_MANAGEMENT || 
                         currentView === ViewState.PAIEMENT_INFORMATION ||
                         currentView === ViewState.NEW_PAIEMENT ||
                         currentView === ViewState.PAIEMENT_FOLLOW_UP ||
                         currentView === ViewState.PAIEMENT_GENERATOR}
                  expanded={paiementManagementExpanded}
                  onToggle={onTogglePaiementManagement}
                  subItems={[
                    {
                      icon: FileText,
                      label: nav.paiementInformation,
                      view: ViewState.PAIEMENT_INFORMATION,
                      active: currentView === ViewState.PAIEMENT_INFORMATION,
                    },
                    {
                      icon: Plus,
                      label: nav.newOffer,
                      view: ViewState.NEW_PAIEMENT,
                      active: currentView === ViewState.NEW_PAIEMENT,
                    },
                    {
                      icon: Clock,
                      label: nav.followUp,
                      view: ViewState.PAIEMENT_FOLLOW_UP,
                      active: currentView === ViewState.PAIEMENT_FOLLOW_UP,
                    },
                    {
                      icon: FileEdit,
                      label: nav.generator,
                      view: ViewState.PAIEMENT_GENERATOR,
                      active: currentView === ViewState.PAIEMENT_GENERATOR,
                    },
                  ]}
                  onSubItemClick={onNavigateToView}
                />
              ) : (
                <SidebarItem 
                  icon={CreditCard} 
                  label="" 
                  active={currentView === ViewState.PAIEMENT_MANAGEMENT || 
                         currentView === ViewState.PAIEMENT_INFORMATION ||
                         currentView === ViewState.NEW_PAIEMENT ||
                         currentView === ViewState.PAIEMENT_FOLLOW_UP ||
                         currentView === ViewState.PAIEMENT_GENERATOR} 
                  onClick={onTogglePaiementManagement} 
                />
              )}
              {sidebarOpen ? (
                <SidebarItem
                  icon={MessageSquare}
                  label={nav.messaging}
                  active={currentView === ViewState.MESSAGING}
                  onClick={() => onNavigateToView(ViewState.MESSAGING)}
                />
              ) : (
                <SidebarItem 
                  icon={MessageSquare} 
                  label="" 
                  active={currentView === ViewState.MESSAGING} 
                  onClick={() => onNavigateToView(ViewState.MESSAGING)} 
                />
              )}

              {sidebarOpen ? (
                <SidebarItem
                  icon={Flower2}
                  label={nav.morchid}
                  active={currentView === ViewState.ORGANIZER_MORCHID}
                  onClick={() => onNavigateToView(ViewState.ORGANIZER_MORCHID)}
                />
              ) : (
                <SidebarItem
                  icon={Flower2}
                  label=""
                  active={currentView === ViewState.ORGANIZER_MORCHID}
                  onClick={() => onNavigateToView(ViewState.ORGANIZER_MORCHID)}
                />
              )}
            </div>
          )}

        </div>

        {isOrganizer && (
          <div
            className={`mt-auto pt-4 border-t border-slate-100 space-y-1 ${
              navLocked ? 'opacity-40 pointer-events-none select-none' : ''
            }`}
            aria-disabled={navLocked || undefined}
          >
            {sidebarOpen && (
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {nav.workshop}
              </p>
            )}
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={GraduationCap}
                label={nav.academyLms}
                active={currentView === ViewState.ACADEMY_COURSE_MANAGER ||
                       currentView === ViewState.ACADEMY_ENROLLMENT_MANAGER ||
                       currentView === ViewState.ACADEMY_PAYMENT_MANAGER}
                expanded={academyExpanded}
                onToggle={onToggleAcademy}
                subItems={[
                  {
                    icon: BookOpen,
                    label: nav.courseManager,
                    view: ViewState.ACADEMY_COURSE_MANAGER,
                    active: currentView === ViewState.ACADEMY_COURSE_MANAGER,
                  },
                  {
                    icon: Users,
                    label: nav.enrollmentManager,
                    view: ViewState.ACADEMY_ENROLLMENT_MANAGER,
                    active: currentView === ViewState.ACADEMY_ENROLLMENT_MANAGER,
                  },
                  {
                    icon: CreditCard,
                    label: nav.paymentManager,
                    view: ViewState.ACADEMY_PAYMENT_MANAGER,
                    active: currentView === ViewState.ACADEMY_PAYMENT_MANAGER,
                  },
                ]}
                onSubItemClick={onNavigateToView}
              />
            ) : (
              <SidebarItem
                icon={GraduationCap}
                label=""
                active={currentView === ViewState.ACADEMY_COURSE_MANAGER ||
                       currentView === ViewState.ACADEMY_ENROLLMENT_MANAGER ||
                       currentView === ViewState.ACADEMY_PAYMENT_MANAGER}
                onClick={onToggleAcademy}
              />
            )}
            {sidebarOpen ? (
              <ExpandableSidebarItem
                icon={FolderKanban}
                label={nav.opportunities}
                active={
                  currentView === ViewState.OPPORTUNITIES_DASHBOARD ||
                  currentView === ViewState.OPPORTUNITIES_MANAGE ||
                  currentView === ViewState.OPPORTUNITIES_APPLICATIONS
                }
                expanded={opportunitiesExpanded}
                onToggle={onToggleOpportunities}
                subItems={[
                  {
                    icon: LayoutDashboard,
                    label: nav.dashboard,
                    view: ViewState.OPPORTUNITIES_DASHBOARD,
                    active: currentView === ViewState.OPPORTUNITIES_DASHBOARD,
                  },
                  {
                    icon: Plus,
                    label: nav.newOpportunity,
                    view: ViewState.OPPORTUNITIES_MANAGE,
                    active: currentView === ViewState.OPPORTUNITIES_MANAGE,
                  },
                  {
                    icon: ClipboardList,
                    label: nav.opportunityApplications,
                    view: ViewState.OPPORTUNITIES_APPLICATIONS,
                    active: currentView === ViewState.OPPORTUNITIES_APPLICATIONS,
                  },
                ]}
                onSubItemClick={onNavigateToView}
              />
            ) : (
              <SidebarItem
                icon={FolderKanban}
                label=""
                active={
                  currentView === ViewState.OPPORTUNITIES_DASHBOARD ||
                  currentView === ViewState.OPPORTUNITIES_MANAGE ||
                  currentView === ViewState.OPPORTUNITIES_APPLICATIONS
                }
                onClick={onToggleOpportunities}
              />
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="text-sm font-medium">{nav.signOut}</span>}
        </button>
      </div>
    </aside>
  );
};

