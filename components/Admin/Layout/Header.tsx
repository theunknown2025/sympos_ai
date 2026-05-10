import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Settings } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SubscriptionRole, ViewState } from '../../../types';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { getRoleLabel } from '../../../i18n/adminHeaderLabels';
import { AdminDisplaySettingsModal } from './AdminDisplaySettingsModal';
import {
  useOrganizerChooserLayout,
  useOrganizerEventScope,
} from '../../../contexts/OrganizerEventScopeContext';
import { getRoutePath } from '../../../routes';

interface HeaderProps {
  currentUser: User | null;
  userRole: SubscriptionRole | null;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  userRole,
  onToggleSidebar,
}) => {
  const { language } = useAdminDisplaySettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const hideSidebarToggle = useOrganizerChooserLayout();
  const organizerScope = useOrganizerEventScope();

  const roleLabel = getRoleLabel(userRole, language);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
        {hideSidebarToggle ? (
          <div className="w-10" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg"
            title={language === 'fr' ? 'Paramètres d’affichage' : 'Display settings'}
            aria-label={language === 'fr' ? 'Paramètres d’affichage' : 'Display settings'}
          >
            <Settings size={20} />
          </button>
          <div className="relative">
            <Bell size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                {currentUser?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase">
              {currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      {organizerScope.isOrganizerWorkspaceEnabled && organizerScope.mode === 'focused' && organizerScope.focusedEventName && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-2 flex flex-wrap items-center gap-3 text-sm sticky top-16 z-10">
          <span className="text-slate-700">
            Managing: <strong className="text-slate-900">{organizerScope.focusedEventName}</strong>
          </span>
          <button
            type="button"
            onClick={() => organizerScope.returnToEventChooser()}
            className="text-indigo-600 font-medium hover:underline"
          >
            Change event
          </button>
          <button
            type="button"
            onClick={() => {
              organizerScope.enterFullWorkspace();
              navigate(getRoutePath(ViewState.DASHBOARD));
            }}
            className="text-slate-600 hover:underline"
          >
            Full workspace
          </button>
        </div>
      )}

      {organizerScope.isOrganizerWorkspaceEnabled && organizerScope.mode === 'full' && (
        <div className="bg-slate-100 border-b border-slate-200 px-8 py-2 flex flex-wrap items-center gap-3 text-sm sticky top-16 z-10">
          <span className="text-slate-700">Full organizer workspace — all events visible in tools.</span>
          <button
            type="button"
            onClick={() => organizerScope.returnToEventChooser()}
            className="text-indigo-600 font-medium hover:underline"
          >
            Work on one event only
          </button>
        </div>
      )}

      <AdminDisplaySettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
