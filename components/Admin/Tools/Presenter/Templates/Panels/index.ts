// Panel templates will be added here
import type { ComponentType } from 'react';

export interface PanelTemplate {
  id: string;
  name: string;
  description: string;
  component: ComponentType<{ panel: any; event: any }>;
  preview?: string; // Optional preview image URL
}

export const panelTemplates: PanelTemplate[] = [
  // Panel templates will be added here
];
