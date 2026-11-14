import type { Opportunity } from '../../../types';
import { getOpportunityPublicUrl, isOpportunityDeadlinePassed } from '../../../services/opportunityService';

export function publicOpportunityExploreUrl(opp: Opportunity): string {
  return opp.publicSlug ? getOpportunityPublicUrl(opp.publicSlug) : '#';
}

export function publicOpportunityApplyUrl(opp: Opportunity): string {
  const base = publicOpportunityExploreUrl(opp);
  return base === '#' ? '#' : `${base}?apply=1`;
}

export function canPublicApply(opp: Opportunity): boolean {
  return (
    opp.publishStatus === 'Published' &&
    !!opp.publicSlug &&
    !isOpportunityDeadlinePassed(opp)
  );
}
