import type { ComponentType } from 'react';
import type { PosterData, PosterTemplateId } from './posterTemplateTypes';
import { CardsTemplate } from './Templates/CardsTemplate';
import { PremiumTemplate } from './Templates/PremiumTemplate';

export type PosterTemplateDefinition = {
  id: PosterTemplateId;
  name: string;
  description: string;
  previewClassName: string;
  Component: ComponentType<{
    data: PosterData;
    width: number;
    height: number;
  }>;
};

export const POSTER_TEMPLATES: PosterTemplateDefinition[] = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'Dark luxury layout with gold accents and asymmetric hero.',
    previewClassName: 'bg-[#0a0f1e]',
    Component: PremiumTemplate,
  },
  {
    id: 'cards',
    name: 'Cards',
    description: 'Modular card grid with sage & cream editorial styling.',
    previewClassName: 'bg-[#f5f0e8]',
    Component: CardsTemplate,
  },
];

export function getPosterTemplate(id: PosterTemplateId) {
  return POSTER_TEMPLATES.find((template) => template.id === id) ?? POSTER_TEMPLATES[0];
}
