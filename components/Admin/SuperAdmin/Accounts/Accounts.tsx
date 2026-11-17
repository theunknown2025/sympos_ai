import React, { useState } from 'react';
import { Building2, CreditCard, Shield, UserRound } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';
import OrganizersAccountsTab from './OrganizersAccountsTab';
import ParticipantsAccountsTab from './ParticipantsAccountsTab';
import AdminsAccountsTab from './AdminsAccountsTab';
import ProPaymentsTab from './ProPaymentsTab';

type AccountsTabId = 'organizers' | 'participants' | 'admins' | 'pro_payments';

const SuperAdminAccounts: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const [tab, setTab] = useState<AccountsTabId>('organizers');

  const tabs: { id: AccountsTabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'organizers', label: fr ? 'Organisateurs' : 'Organizers', icon: Building2 },
    { id: 'participants', label: 'Participants', icon: UserRound },
    { id: 'admins', label: 'Admin', icon: Shield },
    { id: 'pro_payments', label: fr ? 'Paiements Pro' : 'Pro payments', icon: CreditCard },
  ];

  return (
    <div className="w-full max-w-none space-y-5" data-accounts-ui="v2-yellow-suspended">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {fr ? 'Gestion des comptes' : 'Accounts Management'}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">
          {fr
            ? 'Comptes, jours Free, suspension, activation Pro manuelle, et validation des paiements.'
            : 'Accounts, Free days, suspend, manual Pro activation, and payment validation.'}
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Accounts tabs">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="w-full">
        {tab === 'organizers' && <OrganizersAccountsTab />}
        {tab === 'participants' && <ParticipantsAccountsTab />}
        {tab === 'admins' && <AdminsAccountsTab />}
        {tab === 'pro_payments' && <ProPaymentsTab />}
      </div>
    </div>
  );
};

export default SuperAdminAccounts;
