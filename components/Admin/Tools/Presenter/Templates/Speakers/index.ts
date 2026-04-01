import Template1 from './Template1';
import type { ComponentType } from 'react';

export interface SpeakerTemplate {
  id: string;
  name: string;
  description: string;
  component: ComponentType<{ speaker: any; event: any }>;
  preview?: string; // Optional preview image URL
}

export const speakerTemplates: SpeakerTemplate[] = [
  {
    id: 'template1',
    name: 'Modern Two-Tone',
    description: 'Clean design with white and teal sections, circular photo frame',
    component: Template1,
  },
];

export { Template1 };
