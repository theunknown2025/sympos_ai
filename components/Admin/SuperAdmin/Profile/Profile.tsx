import React from 'react';
import { Mail, Shield } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';

const SuperAdminProfile: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {fr ? 'Profil' : 'Profile'}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">
          {fr
            ? 'Compte Super Admin (accès unique plateforme).'
            : 'Super Admin account (platform one-access).'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg uppercase">
            {currentUser?.email?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {currentUser?.email?.split('@')[0] || 'Super Admin'}
            </p>
            <p className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Shield size={12} />
              {userRole || 'SuperAdmin'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {fr ? 'Email de connexion' : 'Login email'}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <span className="truncate">{currentUser?.email || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;
