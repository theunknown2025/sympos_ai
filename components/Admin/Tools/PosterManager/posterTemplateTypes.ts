export type PosterSpeaker = {
  id: string;
  name: string;
  title: string;
  image: string;
};

export type PosterPartnerLogo = {
  id: string;
  name: string;
  image: string;
};

export type PosterData = {
  title: string;
  subtitle: string;
  description: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  venueDetails: string;
  registrationDeadline: string;
  seatsInfo: string;
  pricing: string;
  targetAudience: string;
  topics: string[];
  speakers: PosterSpeaker[];
  logo: string;
  backgroundImage: string;
  themeImage: string;
  partnerLogos: PosterPartnerLogo[];
  certificate: boolean;
  ctaText: string;
  ctaUrl: string;
  qrLabel: string;
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
};

export type PosterTemplateId = 'premium' | 'cards';

export type PosterEditorMode = 'blank' | 'template' | 'ai';
