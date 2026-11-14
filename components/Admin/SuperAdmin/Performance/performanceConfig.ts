import sectionsJson from '../../../../jmeter/config/sections.json';
import type { PerformanceSectionConfig } from './types';

const config = sectionsJson as {
  defaults: {
    baseProtocol: string;
    baseHost: string;
    basePort: string;
    threads: number;
    rampUpSeconds: number;
    loops: number;
  };
  sections: PerformanceSectionConfig[];
};

export const jmeterDefaults = config.defaults;

export const performanceSections: PerformanceSectionConfig[] = [...config.sections].sort(
  (a, b) => a.order - b.order
);

export function getJmeterRunCommand(sectionId: string): string {
  return `npm run jmeter:run -- -Section ${sectionId}`;
}

export function getJmeterRunAllCommand(): string {
  return 'npm run jmeter:run:all';
}
