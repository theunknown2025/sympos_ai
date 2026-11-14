import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getOpportunityById } from '../../../services/opportunityService';
import type { Opportunity } from '../../../types';
import OpportunityViewPage from './OpportunityViewPage';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';

const OpportunityPreviewPage: React.FC = () => {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!opportunityId) {
        setError('Missing opportunity id');
        setLoading(false);
        return;
      }
      try {
        const data = await getOpportunityById(opportunityId);
        if (!data) setError('Opportunity not found');
        else setOpportunity(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunityId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-700 mb-4">{error || 'Opportunity not found'}</p>
          <button
            type="button"
            onClick={() => navigate(getRoutePath(ViewState.OPPORTUNITIES_MANAGE))}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to opportunities
          </button>
        </div>
      </div>
    );
  }

  return (
    <OpportunityViewPage
      opportunity={opportunity}
      mode="preview"
      backLabel="Back to opportunities"
      onBack={() => navigate(getRoutePath(ViewState.OPPORTUNITIES_MANAGE))}
    />
  );
};

export default OpportunityPreviewPage;
