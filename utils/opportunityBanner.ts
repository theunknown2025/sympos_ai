import type { CSSProperties } from 'react';
import type { OpportunityBanner, OpportunityBannerImageOverlay, OpportunityKind } from '../types';

export function getDefaultOpportunityBanner(kind: OpportunityKind): OpportunityBanner {
  switch (kind) {
    case 'training':
      return {
        type: 'gradient',
        gradientColors: { from: '#0f766e', to: '#14b8a6', direction: 'to-r' },
      };
    case 'fund':
      return {
        type: 'gradient',
        gradientColors: { from: '#b45309', to: '#f59e0b', direction: 'to-r' },
      };
    case 'job':
    default:
      return {
        type: 'gradient',
        gradientColors: { from: '#4338ca', to: '#7c3aed', direction: 'to-r' },
      };
  }
}

export function resolveOpportunityBanner(
  kind: OpportunityKind,
  banner?: OpportunityBanner
): OpportunityBanner {
  return banner ?? getDefaultOpportunityBanner(kind);
}

export function bannerForKindChange(
  kind: OpportunityKind,
  current?: OpportunityBanner
): OpportunityBanner {
  const nextDefault = getDefaultOpportunityBanner(kind);
  if (!current) return nextDefault;
  if (current.type === 'image' && current.imageUrl) {
    return {
      ...nextDefault,
      type: 'image',
      imageUrl: current.imageUrl,
      imagePositionY: current.imagePositionY,
      imageOverlay: current.imageOverlay ?? 'gradient',
    };
  }
  return nextDefault;
}

function gradientDirectionCss(direction?: string): string {
  switch (direction) {
    case 'to-l':
      return 'to left';
    case 'to-b':
      return 'to bottom';
    case 'to-t':
      return 'to top';
    case 'to-br':
      return 'to bottom right';
    case 'to-bl':
      return 'to bottom left';
    case 'to-tr':
      return 'to top right';
    case 'to-tl':
      return 'to top left';
    default:
      return 'to right';
  }
}

export function getOpportunityBannerStyle(banner: OpportunityBanner): CSSProperties {
  if (banner.type === 'image' && banner.imageUrl) {
    const y = banner.imagePositionY ?? 50;
    return {
      backgroundImage: `url(${banner.imageUrl})`,
      backgroundPosition: `center ${y}%`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    };
  }
  if (banner.type === 'color' && banner.color) {
    return { backgroundColor: banner.color };
  }
  if (banner.type === 'gradient' && banner.gradientColors) {
    const dir = gradientDirectionCss(banner.gradientColors.direction);
    return {
      background: `linear-gradient(${dir}, ${banner.gradientColors.from}, ${banner.gradientColors.to})`,
    };
  }
  return { background: 'linear-gradient(to right, #4338ca, #7c3aed)' };
}

export function getOpportunityBannerOverlayClass(
  overlay: OpportunityBannerImageOverlay | undefined
): string {
  switch (overlay) {
    case 'none':
      return '';
    case 'dark':
      return 'bg-black/45';
    case 'gradient':
    default:
      return 'bg-gradient-to-r from-indigo-950/75 via-violet-900/55 to-transparent';
  }
}
