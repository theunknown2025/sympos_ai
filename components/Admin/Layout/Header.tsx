import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SubscriptionRole } from '../../../types';

interface HeaderProps {
  sidebarOpen: boolean;
  currentUser: User | null;
  userRole: SubscriptionRole | null;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  currentUser,
  userRole,
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <button 
        onClick={onToggleSidebar}
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
            <p className="text-xs text-slate-500">
              {userRole === 'Organizer' ? 'Organizer' : userRole === 'Participant' ? 'Participant' : 'User'}
            </p>
          </div>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase">
            {currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

