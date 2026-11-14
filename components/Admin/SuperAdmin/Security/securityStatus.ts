import type { SecurityCheckStatus, SecurityManifestEntry } from './types';

export const statusStyles: Record<
  SecurityCheckStatus,
  { badge: string; dot: string; ring: string; label: string }
> = {
  idle: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    ring: 'border-slate-200',
    label: 'Not scanned',
  },
  pass: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200',
    label: 'Pass',
  },
  warn: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    ring: 'border-amber-200',
    label: 'Warning',
  },
  fail: {
    badge: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
    ring: 'border-red-200',
    label: 'Fail',
  },
  skip: {
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    ring: 'border-slate-200',
    label: 'Skipped',
  },
};

export function resolveCheckStatus(
  entry: SecurityManifestEntry | undefined,
  isRunning: boolean
): SecurityCheckStatus {
  if (isRunning) return 'warn';
  if (!entry?.ranAt && !entry?.status) return 'idle';
  return entry.status ?? 'idle';
}
