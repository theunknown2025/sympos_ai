import type { PerformanceManifestEntry, PerformanceTestMode } from './types';

export type PerformanceStatusKind =
  | 'idle'
  | 'running'
  | 'passed'
  | 'warning'
  | 'failed';

export interface PerformanceStatusDisplay {
  kind: PerformanceStatusKind;
  label: string;
  description: string;
}

export function getPerformanceStatus(
  entry: PerformanceManifestEntry | undefined,
  isRunning: boolean,
  mode: PerformanceTestMode = 'smoke'
): PerformanceStatusDisplay {
  if (isRunning) {
    return {
      kind: 'running',
      label: mode === 'stress' ? 'Stress testing…' : 'Testing…',
      description:
        mode === 'stress'
          ? 'Apache JMeter™ stress profile is running'
          : 'Apache JMeter™ smoke test is running',
    };
  }

  if (!entry?.ranAt) {
    return {
      kind: 'idle',
      label: 'Not tested',
      description: 'Run a test to measure this area',
    };
  }

  if (entry.error && (entry.sampleCount ?? 0) === 0) {
    return {
      kind: 'failed',
      label: 'Failed',
      description: entry.error,
    };
  }

  const rate = entry.successRate ?? 0;
  const errors = entry.errorCount ?? 0;

  if (errors === 0 && rate >= 99) {
    return {
      kind: 'passed',
      label: 'Healthy',
      description: `${rate}% success · avg ${entry.avgMs} ms`,
    };
  }

  if (rate >= 80) {
    return {
      kind: 'warning',
      label: 'Degraded',
      description: `${rate}% success · ${errors} error(s) · avg ${entry.avgMs} ms`,
    };
  }

  return {
    kind: 'failed',
    label: 'Poor',
    description: `${rate}% success · ${errors} error(s) · avg ${entry.avgMs} ms`,
  };
}

export const statusStyles: Record<
  PerformanceStatusKind,
  { badge: string; dot: string; ring: string }
> = {
  idle: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    ring: 'border-slate-200',
  },
  running: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
    ring: 'border-blue-300 ring-2 ring-blue-100',
  },
  passed: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    ring: 'border-amber-200',
  },
  failed: {
    badge: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
    ring: 'border-red-200',
  },
};
