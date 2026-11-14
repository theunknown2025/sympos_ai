import type { AiPosterGeneralInfo, AiPosterSpeaker } from './types';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptySpeaker(): AiPosterSpeaker {
  return {
    id: newId(),
    enabled: true,
    name: '',
    position: '',
    establishment: '',
    image: '',
  };
}

export const DEFAULT_AI_POSTER_THEMES = [
  'Social Entrepreneurship',
  'Digital Transformation',
  'AI for Social Good',
  'Sustainable Development',
  'Circular Economy',
  'Smart Agriculture',
  'Education Innovation',
  'Healthcare Innovation',
  'Youth Empowerment',
  'Women Leadership',
];

export function createDefaultAiPosterInfo(): AiPosterGeneralInfo {
  return {
    title: 'Social Innovation in Morocco',
    slogan: 'Empowering Communities Through Innovation, Technology and Sustainable Development',
    date: 'September 25, 2026',
    time: '09:00 – 17:30',
    place: 'Mohammed VI Polytechnic University, Benguerir, Morocco',
    about:
      'Join researchers, entrepreneurs, NGOs, public institutions, startups and innovation leaders to explore how social innovation is transforming Morocco through digital technologies, entrepreneurship, sustainability and community-driven solutions.',
    themes: [...DEFAULT_AI_POSTER_THEMES],
    speakers: [
      {
        id: newId(),
        enabled: true,
        name: 'Speaker Name',
        position: 'Title',
        establishment: 'Institution',
        image: '',
      },
      {
        id: newId(),
        enabled: true,
        name: 'Speaker Name',
        position: 'Title',
        establishment: 'Institution',
        image: '',
      },
      {
        id: newId(),
        enabled: true,
        name: 'Speaker Name',
        position: 'Title',
        establishment: 'Institution',
        image: '',
      },
      {
        id: newId(),
        enabled: true,
        name: 'Speaker Name',
        position: 'Title',
        establishment: 'Institution',
        image: '',
      },
    ],
    ctaText: 'Register Now',
    ctaSubtext: 'Seats are Limited!',
    qrLabel: 'Scan to Register',
    contactWebsite: 'www.example.org',
    contactEmail: 'contact@example.org',
    contactPhone: '+212 5 00 00 00 00',
    bannerImage: '',
    organizerLogos: [],
    partnerLogos: [],
  };
}
