import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Loader2, Repeat } from 'lucide-react';
import { getLatestPublishedOpportunitiesByKind } from '../../services/opportunityService';
import type { Opportunity, OpportunityKind } from '../../types';
import { OPPORTUNITY_KINDS, opportunityKindIcon } from '../../utils/opportunityKindMeta';
import LandingOpportunityKindCarousel from './LandingOpportunityKindCarousel';

const BROWSE_PATH = '/opportunities/browse';
const PER_TYPE_LIMIT = 6;

const LANDING_KIND_TITLES: Record<OpportunityKind, string> = {
  job: 'Jobs',
  training: 'Training',
  fund: 'Funding',
};

const LandingOpportunitiesSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeKind, setActiveKind] = useState<OpportunityKind>('job');
  const [byKind, setByKind] = useState<Record<OpportunityKind, Opportunity[]>>({
    job: [],
    training: [],
    fund: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.all(
          OPPORTUNITY_KINDS.map((kind) =>
            getLatestPublishedOpportunitiesByKind(kind, PER_TYPE_LIMIT)
          )
        );
        const next = {} as Record<OpportunityKind, Opportunity[]>;
        OPPORTUNITY_KINDS.forEach((kind, i) => {
          next[kind] = results[i];
        });
        setByKind(next);
        const firstWithItems = OPPORTUNITY_KINDS.find((k) => next[k].length > 0);
        if (firstWithItems) setActiveKind(firstWithItems);
      } catch {
        setByKind({ job: [], training: [], fund: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasAny = OPPORTUNITY_KINDS.some((k) => byKind[k].length > 0);

  if (!loading && !hasAny) {
    return null;
  }

  return (
    <section id="opportunities" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-2">
            <Briefcase size={18} />
            Opportunities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Latest opportunities
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Choose a category to explore up to six recent openings — three at a time.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            <div
              className="flex justify-center mb-8"
              role="tablist"
              aria-label="Opportunity type"
            >
              <div className="grid grid-cols-3 gap-2 w-full max-w-xl">
                {OPPORTUNITY_KINDS.map((kind) => {
                  const Icon = opportunityKindIcon[kind];
                  const count = byKind[kind].length;
                  const selected = activeKind === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveKind(kind)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{LANDING_KIND_TITLES[kind]}</span>
                      <span
                        className={`tabular-nums text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div role="tabpanel" aria-label={LANDING_KIND_TITLES[activeKind]}>
              <LandingOpportunityKindCarousel
                key={activeKind}
                kind={activeKind}
                title={LANDING_KIND_TITLES[activeKind]}
                items={byKind[activeKind]}
                hideHeading
              />
            </div>
          </>
        )}

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => navigate(BROWSE_PATH)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
          >
            <Repeat size={18} aria-hidden />
            View all opportunities
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingOpportunitiesSection;
