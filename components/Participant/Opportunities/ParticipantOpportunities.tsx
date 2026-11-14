import React, { useEffect, useState } from 'react';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getPublishedOpportunities,
  getSavedOpportunities,
  saveOpportunityForParticipant,
  removeSavedOpportunity,
} from '../../../services/participantOpportunityService';
import {
  createOpportunityApplication,
  getParticipantApplicationForOpportunity,
} from '../../../services/opportunityApplicationService';
import {
  getFormIdForOpportunityStep,
} from '../../../services/opportunityService';
import type { Opportunity, OpportunityApplication } from '../../../types';
import ParticipantOpportunityCard from './ParticipantOpportunityCard';
import FormModal from '../../Admin/Tools/FormBuilder/FormModal';

const ParticipantOpportunities: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'favorite'>('all');
  const [all, setAll] = useState<Opportunity[]>([]);
  const [saved, setSaved] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<Map<string, OpportunityApplication>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formModal, setFormModal] = useState<{
    formId: string;
    opportunity: Opportunity;
    applicationId: string;
    stepIndex: number;
  } | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const [published, favorites] = await Promise.all([
        getPublishedOpportunities(),
        getSavedOpportunities(currentUser.id),
      ]);
      setAll(published);
      setSaved(favorites);
      setSavedIds(new Set(favorites.map((o) => o.id)));
      const appMap = new Map<string, OpportunityApplication>();
      for (const o of published) {
        const app = await getParticipantApplicationForOpportunity(o.id, currentUser.id);
        if (app) appMap.set(o.id, app);
      }
      setApplications(appMap);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser]);

  const toggleSave = async (opportunityId: string) => {
    if (!currentUser) return;
    if (savedIds.has(opportunityId)) {
      await removeSavedOpportunity(currentUser.id, opportunityId);
      setSavedIds((prev) => {
        const n = new Set(prev);
        n.delete(opportunityId);
        return n;
      });
      setSaved((prev) => prev.filter((o) => o.id !== opportunityId));
    } else {
      await saveOpportunityForParticipant(currentUser.id, opportunityId);
      const opp = all.find((o) => o.id === opportunityId);
      if (opp) {
        setSavedIds((prev) => new Set(prev).add(opportunityId));
        setSaved((prev) => [opp, ...prev]);
      }
    }
  };

  const openApplyFlow = async (opp: Opportunity) => {
    if (!currentUser) return;
    try {
      let app = applications.get(opp.id);
      if (!app) {
        const appId = await createOpportunityApplication(opp.id, currentUser.id);
        app = (await getParticipantApplicationForOpportunity(opp.id, currentUser.id))!;
        setApplications((prev) => new Map(prev).set(opp.id, app!));
      }
      const formId = getFormIdForOpportunityStep(opp, app.currentStepIndex);
      if (!formId) {
        alert('No form configured for this step. Contact the organizer.');
        return;
      }
      setFormModal({
        formId,
        opportunity: opp,
        applicationId: app.id,
        stepIndex: app.currentStepIndex,
      });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not start application');
    }
  };

  const list = activeTab === 'all' ? all : saved;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Briefcase size={32} className="text-indigo-600" />
          Opportunities
        </h1>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('favorite')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'favorite'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500'
          }`}
        >
          Favorites
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-slate-500 py-12">
          {activeTab === 'favorite' ? 'No favorite opportunities yet' : 'No opportunities available'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((opp) => (
            <ParticipantOpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={savedIds.has(opp.id)}
              application={applications.get(opp.id)}
              onSave={() => toggleSave(opp.id)}
              onApply={() => openApplyFlow(opp)}
              onContinue={() => openApplyFlow(opp)}
            />
          ))}
        </div>
      )}

      {formModal && (
        <FormModal
          formId={formModal.formId}
          eventId={formModal.opportunity.id}
          eventTitle={formModal.opportunity.title}
          opportunityContext={{
            opportunityId: formModal.opportunity.id,
            opportunityApplicationId: formModal.applicationId,
            opportunityStepIndex: formModal.stepIndex,
          }}
          onClose={() => setFormModal(null)}
          onSuccess={() => {
            setFormModal(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default ParticipantOpportunities;
