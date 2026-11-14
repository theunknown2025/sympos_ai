import type { LucideIcon } from 'lucide-react';

export type MorchidLanguage = 'en' | 'fr' | 'ar';

export interface MorchidGuideline {
  title: string;
  steps: string[];
  tip?: string;
}

export interface MorchidTopic {
  id: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  title: string;
  shortDescription: string;
  guidelines: MorchidGuideline[];
}

export interface MorchidPageCopy {
  title: string;
  subtitle: string;
  topicGridTitle: string;
  topicGridHint: string;
  guidelinesTitle: string;
  stepLabel: string;
  tipLabel: string;
  languageEn: string;
  languageFr: string;
  languageAr: string;
  selectTopicHint: string;
}
