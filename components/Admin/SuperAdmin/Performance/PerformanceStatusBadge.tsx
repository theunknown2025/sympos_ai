import React from 'react';
import { Loader2 } from 'lucide-react';
import type { PerformanceStatusDisplay } from './performanceStatus';
import { statusStyles } from './performanceStatus';

interface PerformanceStatusBadgeProps {
  status: PerformanceStatusDisplay;
  large?: boolean;
}

const PerformanceStatusBadge: React.FC<PerformanceStatusBadgeProps> = ({ status, large }) => {
  const styles = statusStyles[status.kind];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${styles.badge} ${
        large ? 'text-sm font-semibold' : 'text-xs font-medium'
      }`}
    >
      {status.kind === 'running' ? (
        <Loader2 size={large ? 16 : 14} className="animate-spin shrink-0" />
      ) : (
        <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
      )}
      <span>{status.label}</span>
    </div>
  );
};

export default PerformanceStatusBadge;
