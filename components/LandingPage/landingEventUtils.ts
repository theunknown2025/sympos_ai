import type { CSSProperties } from 'react';
import type { Event, EventBanner } from '../../types';
import { getEventPublicUrl } from '../../services/eventService';

export function eventDescriptionExcerpt(html: string | undefined, maxLength: number): string {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  let text = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) {
    text = `${text.substring(0, maxLength).trim()}...`;
  }
  return text;
}

export function landingEventExploreUrl(event: Event): string {
  return event.publicSlug ? getEventPublicUrl(event.publicSlug) : '/events/browse';
}

export function eventBannerHeaderStyle(banner?: EventBanner): CSSProperties {
  if (!banner) {
    return { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' };
  }
  if (banner.type === 'image' && banner.imageUrl) {
    return {
      backgroundImage: `url(${banner.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  if (banner.type === 'color' && banner.color) {
    return { backgroundColor: banner.color };
  }
  return { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' };
}
