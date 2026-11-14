import type { AiPosterGeneralInfo } from './types';
import {
  buildAiPosterPrompt as buildShared,
  collectReferenceImages as collectShared,
} from './buildAiPosterPromptShared.js';

export type AiPosterImageReferenceRole = 'org_logo' | 'partner_logo' | 'speaker' | 'hero_banner';

export type AiPosterImageReference = {
  index: number;
  role: AiPosterImageReferenceRole;
  description: string;
  priority: number;
  name?: string;
  asset?: { mimeType: string; buffer: unknown } | null;
};

export function buildAiPosterPrompt(
  info: AiPosterGeneralInfo,
  widthPx: number,
  heightPx: number,
  references: AiPosterImageReference[] | string[] = [],
) {
  return buildShared(info, widthPx, heightPx, references);
}

export function collectReferenceImages(
  info: AiPosterGeneralInfo,
  parseDataUrl: (dataUrl: string) => { mimeType: string; buffer: unknown } | null,
): AiPosterImageReference[] {
  return collectShared(info, parseDataUrl) as AiPosterImageReference[];
}

export {
  buildSystemRole,
  buildDesignObjective,
  buildDesignReferences,
  buildLayoutGrid,
  buildHeroIllustration,
  buildTypography,
  buildColorPalette,
  buildIconography,
  buildContentBrief,
  buildSpeakerCards,
  buildLogos,
  buildQrCode,
  buildImageReferencesSection,
  buildNegativePrompt,
  buildQualityRequirements,
} from './buildAiPosterPromptShared.js';
