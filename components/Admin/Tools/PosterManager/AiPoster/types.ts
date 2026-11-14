export type AiPosterSpeaker = {
  id: string;
  enabled: boolean;
  name: string;
  position: string;
  establishment: string;
  image: string;
};

export type AiPosterLogo = {
  id: string;
  name: string;
  image: string;
};

/** Content fields mapped to the premium conference poster layout. */
export type AiPosterGeneralInfo = {
  /** Main title — large bold typography */
  title: string;
  /** Subtitle under the title */
  slogan: string;
  date: string;
  time: string;
  place: string;
  /** About the event paragraph */
  about: string;
  /** Key themes (icon + label each) */
  themes: string[];
  speakers: AiPosterSpeaker[];
  ctaText: string;
  ctaSubtext: string;
  qrLabel: string;
  contactWebsite: string;
  contactEmail: string;
  contactPhone: string;
  /** Optional hero / reference image for OpenAI edits */
  bannerImage: string;
  /** Top organization logos (LOGO 1 / 2 / 3) */
  organizerLogos: AiPosterLogo[];
  /** Footer partner logos */
  partnerLogos: AiPosterLogo[];
};

export type AiPosterStep = 1 | 2;

export type AiPosterGenerationStatus = 'idle' | 'generating' | 'ready' | 'error';

export type AiPosterResult = {
  imageDataUrl: string;
  backgroundDataUrl?: string;
  revisedPrompt?: string;
  model?: string;
  createdAt: string;
  usedReferences?: number;
};

export type AiPosterGenerateRequest = {
  info: AiPosterGeneralInfo;
  formatId: string;
  widthPx: number;
  heightPx: number;
};

export type AiPosterGenerateResponse = {
  imageBase64: string;
  mimeType: string;
  revisedPrompt?: string;
  model: string;
  usedReferences?: number;
};
