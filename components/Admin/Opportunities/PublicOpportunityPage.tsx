import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getPublishedOpportunityBySlug } from '../../../services/opportunityService';
import type { Opportunity } from '../../../types';
import OpportunityViewPage from './OpportunityViewPage';
import PublicOpportunitiesLayout from '../../Public/Opportunities/PublicOpportunitiesLayout';
import { PUBLIC_OPPORTUNITIES_BROWSE_PATH } from '../../Public/Opportunities/PublicOpportunitiesHeader';

function slugFromPathname(pathname: string): string {
  const segment = pathname.replace(/^\/o\/?/, '').split('/')[0];
  return segment ? decodeURIComponent(segment) : '';
}

interface PublicOpportunityPageProps {
  slug?: string;
}

const PublicOpportunityPage: React.FC<PublicOpportunityPageProps> = ({ slug: slugProp }) => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const slug = useMemo(
    () => slugProp || slugParam || slugFromPathname(pathname),
    [slugProp, slugParam, pathname]
  );
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!slug) {
        setError('Invalid link');
        setLoading(false);
        return;
      }
      try {
        const data = await getPublishedOpportunityBySlug(slug);
        if (!data) setError('This opportunity is not available or the link is invalid.');
        else setOpportunity(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <PublicOpportunitiesLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      </PublicOpportunitiesLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <PublicOpportunitiesLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-700 mb-4">{error || 'Opportunity not found'}</p>
          <button
            type="button"
            onClick={() => navigate(PUBLIC_OPPORTUNITIES_BROWSE_PATH)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse opportunities
          </button>
        </div>
      </PublicOpportunitiesLayout>
    );
  }

  return <OpportunityViewPage opportunity={opportunity} mode="public" />;
};

export default PublicOpportunityPage;
