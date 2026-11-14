import type { PosterData, PosterTemplateId } from './posterTemplateTypes';

const baseSpeakers = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    title: 'Keynote Speaker',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    id: '2',
    name: 'Prof. James Okonkwo',
    title: 'Panel Chair',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  },
];

export function createDefaultPosterData(templateId: PosterTemplateId): PosterData {
  const shared: PosterData = {
    title: 'International Scientific Workshop 2026',
    subtitle: 'Innovation · Research · Collaboration',
    description:
      'Join leading researchers and practitioners for a full-day programme of keynotes, panels, and hands-on sessions.',
    organizer: 'Sympos AI · Scientific Committee',
    date: '15 October 2026',
    time: '09:00 – 17:00',
    location: 'Paris, France',
    venueDetails: 'Palais des Congrès · Hall A',
    registrationDeadline: '30 September 2026',
    seatsInfo: 'Limited to 120 participants',
    pricing: 'Early bird: €149 · Standard: €199',
    targetAudience: 'Researchers, PhD students, and industry professionals',
    topics: [
      'AI in scientific publishing',
      'Open science & reproducibility',
      'Interdisciplinary collaboration',
      'Grant writing masterclass',
    ],
    speakers: baseSpeakers.map((speaker) => ({ ...speaker })),
    logo: '',
    backgroundImage: '',
    themeImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    partnerLogos: [],
    certificate: true,
    ctaText: 'Register Now',
    ctaUrl: 'https://sympos.ai/register',
    qrLabel: 'Scan to Register',
    contactEmail: 'workshop@sympos.ai',
    contactPhone: '+33 1 23 45 67 89',
    contactWebsite: 'www.sympos.ai',
  };

  if (templateId === 'cards') {
    return {
      ...shared,
      title: 'Sustainable Research Workshop',
      subtitle: 'Nature-inspired methods for modern science',
      description:
        'An editorial, card-based programme exploring sustainable practices in academic research and event organisation.',
      organizer: 'Green Science Initiative',
      topics: [
        'Eco-friendly conference design',
        'Digital poster sessions',
        'Community-led peer review',
        'Carbon-neutral events',
      ],
      themeImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    };
  }

  return {
    ...shared,
    backgroundImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
  };
}
