import React from 'react';
import { Flame } from 'lucide-react';
import { stressTestProfile } from './stressTestConfig';

const StressTestToolbarHint: React.FC = () => (
  <p className="text-xs text-orange-800/90 mt-2 flex items-start gap-1.5">
    <Flame size={14} className="shrink-0 mt-0.5" />
    <span>
      Stress profile: {stressTestProfile.threads} virtual users, {stressTestProfile.rampUpSeconds}s
      ramp-up, {stressTestProfile.loops} loops per route. {stressTestProfile.description}
    </span>
  </p>
);

export default StressTestToolbarHint;
