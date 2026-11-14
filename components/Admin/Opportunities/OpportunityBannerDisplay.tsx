import React from 'react';
import type { Opportunity, OpportunityPreviewData } from '../../../types';
import {
  getOpportunityBannerOverlayClass,
  getOpportunityBannerStyle,
  resolveOpportunityBanner,
} from '../../../utils/opportunityBanner';
import { opportunityKindLabel } from '../../../utils/opportunityKindMeta';
import OpportunityKindIcon from './OpportunityKindIcon';

type BannerOpportunity = Pick<Opportunity | OpportunityPreviewData, 'kind' | 'title' | 'banner'>;

interface OpportunityBannerDisplayProps {
  opportunity: BannerOpportunity;
  className?: string;
  compact?: boolean;
}

/** Participant-facing banner with kind icon, title, and image/color/gradient styling. */
const OpportunityBannerDisplay: React.FC<OpportunityBannerDisplayProps> = ({
  opportunity,
  className = '',
  compact = false,
}) => {
  const banner = resolveOpportunityBanner(opportunity.kind, opportunity.banner);
  const showImageOverlay =
    banner.type === 'image' && banner.imageUrl && banner.imageOverlay !== 'none';

  return (
    <div
      className={`relative text-white shrink-0 overflow-hidden ${compact ? 'p-4' : 'p-6'} ${className}`}
      style={getOpportunityBannerStyle(banner)}
    >
      {showImageOverlay ? (
        <div
          className={`absolute inset-0 pointer-events-none ${getOpportunityBannerOverlayClass(
            banner.imageOverlay
          )}`}
          aria-hidden
        />
      ) : null}
      <div className="relative z-10 flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center rounded-lg bg-white/20 shrink-0 ${
            compact ? 'w-9 h-9' : 'w-11 h-11'
          }`}
        >
          <OpportunityKindIcon kind={opportunity.kind} size={compact ? 18 : 22} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-white/20 px-2 py-1 rounded mb-2">
            {opportunityKindLabel[opportunity.kind] || opportunity.kind}
          </span>
          <h2
            className={`font-bold leading-tight ${compact ? 'text-lg' : 'text-xl'}`}
          >
            {opportunity.title || 'Untitled opportunity'}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default OpportunityBannerDisplay;
