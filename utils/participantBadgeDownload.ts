import type { ParticipantBadge } from '../services/badgeGeneratorService';

/** Trigger browser download of a stored participant badge image. */
export async function downloadParticipantBadge(badge: ParticipantBadge): Promise<void> {
  const response = await fetch(badge.badgeImageUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch badge image.');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedName = badge.participantName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileExtension = badge.badgeImageUrl.split('.').pop()?.split('?')[0] || 'png';
  link.download = `${sanitizedName}_badge.${fileExtension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
