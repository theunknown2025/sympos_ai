import React from 'react';
import {
  Globe,
  LogOut,
  LayoutDashboard,
  User,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';
import { ViewState } from '../../../../types';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import { getAdminNavLabels } from '../../../../i18n/adminNavLabels';

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
    {label && <span>{label}</span>}
  </button>
);

interface SuperAdminSidebarProps {
  sidebarOpen: boolean;
  currentView: ViewState;
  onNavigateToView: (viewState: ViewState) => void;
  onSignOut: () => void;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  sidebarOpen,
  currentView,
  onNavigateToView,
  onSignOut,
}) => {
  const { language } = useAdminDisplaySettings();
  const nav = getAdminNavLabels(language);

  const items: { icon: SidebarItemProps['icon']; label: string; view: ViewState }[] = [
    { icon: User, label: nav.profile, view: ViewState.SUPERADMIN_PROFILE },
    { icon: Users, label: nav.accounts, view: ViewState.SUPERADMIN_ACCOUNTS },
    { icon: LayoutDashboard, label: nav.dashboard, view: ViewState.SUPERADMIN_DASHBOARD },
    { icon: BarChart3, label: nav.performance, view: ViewState.SUPERADMIN_PERFORMANCE },
    { icon: Shield, label: nav.security, view: ViewState.SUPERADMIN_SECURITY },
  ];

  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-full shrink-0 z-20`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
          <Globe className="text-white" size={20} />
        </div>
        {sidebarOpen && (
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            {nav.superAdminPortal}
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {items.map(({ icon, label, view }) => (
            <SidebarItem
              key={view}
              icon={icon}
              label={sidebarOpen ? label : ''}
              active={currentView === view}
              onClick={() => onNavigateToView(view)}
            />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <SidebarItem
          icon={LogOut}
          label={sidebarOpen ? nav.signOut : ''}
          active={false}
          onClick={onSignOut}
        />
      </div>
    </aside>
  );
};
