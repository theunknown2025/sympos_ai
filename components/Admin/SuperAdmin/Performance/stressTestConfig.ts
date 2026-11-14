import stressJson from '../../../../jmeter/config/stress.json';

export interface StressTestProfile {
  label: string;
  description: string;
  threads: number;
  rampUpSeconds: number;
  loops: number;
}

export const stressTestProfile = stressJson as StressTestProfile;
