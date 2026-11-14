import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, List, Loader2 } from 'lucide-react';
import NewEvent from './NewEvent';
import ListOfEvents from './ListOfEvents';
import EventQuotaLimitModal from './EventQuotaLimitModal';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../hooks/useAuth';
import {
  getOrganizerEventQuota,
  OrganizerEventQuota,
} from '../../../services/organizerEventQuota';

const EventManagement: React.FC = () => {
  const { t } = useAdminTranslation('eventManagement');
  const { currentUser, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [refreshList, setRefreshList] = useState(0);
  const [quota, setQuota] = useState<OrganizerEventQuota | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaReady, setQuotaReady] = useState(userRole !== 'Organizer');

  const loadQuota = useCallback(async () => {
    if (userRole !== 'Organizer' || !currentUser?.id) {
      setQuota(null);
      setQuotaReady(true);
      return null;
    }
    const next = await getOrganizerEventQuota(currentUser.id);
    setQuota(next);
    setQuotaReady(true);
    return next;
  }, [currentUser?.id, userRole]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadQuota();
        if (cancelled || !next?.applies || next.canCreate) return;
        setActiveTab('list');
      } catch (e) {
        console.error(e);
        if (!cancelled) setQuotaReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadQuota]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab !== 'new' && tab !== 'list') return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });

    if (tab === 'list') {
      setActiveTab('list');
      return;
    }

    void (async () => {
      try {
        const next = await loadQuota();
        if (next?.applies && !next.canCreate) {
          setActiveTab('list');
          setShowQuotaModal(true);
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setActiveTab('new');
    })();
  }, [searchParams, setSearchParams, loadQuota]);

  const handleEventSaved = () => {
    setActiveTab('list');
    setRefreshList(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('pageTitle')}</h1>
        <p className="text-slate-500 mt-2">{t('subtitle')}</p>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => {
              void (async () => {
                try {
                  const next = await loadQuota();
                  if (next?.applies && !next.canCreate) {
                    setActiveTab('list');
                    setShowQuotaModal(true);
                    return;
                  }
                } catch (e) {
                  console.error(e);
                }
                setActiveTab('new');
              })();
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {t('tabNewEvent')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <List size={16} />
              {t('tabListEvents')}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'new' && !quotaReady ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : activeTab === 'new' ? (
          <NewEvent onSave={handleEventSaved} onCancel={() => setActiveTab('list')} />
        ) : (
          <ListOfEvents key={refreshList} />
        )}
        {showQuotaModal && quota && (
          <EventQuotaLimitModal quota={quota} onClose={() => setShowQuotaModal(false)} />
        )}
      </div>
    </div>
  );
};

export default EventManagement;

