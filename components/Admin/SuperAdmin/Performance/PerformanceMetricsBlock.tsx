import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { PerformanceManifestEntry, PerformanceTestMode } from './types';

interface PerformanceMetricsBlockProps {
  mode: PerformanceTestMode;
  entry?: PerformanceManifestEntry;
}

const modeLabels: Record<PerformanceTestMode, string> = {
  smoke: 'Smoke test',
  stress: 'Stress test',
};

const PerformanceMetricsBlock: React.FC<PerformanceMetricsBlockProps> = ({ mode, entry }) => {
  if (!entry?.ranAt) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
        No {mode} data yet
      </div>
    );
  }

  const lastRun = new Date(entry.ranAt).toLocaleString();
  const loadHint =
    entry.threads && entry.loops
      ? `${entry.threads} users · ${entry.loops} loops`
      : null;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        mode === 'stress' ? 'border-orange-200 bg-orange-50/40' : 'border-slate-100 bg-slate-50/80'
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
          mode === 'stress' ? 'text-orange-800' : 'text-slate-500'
        }`}
      >
        {modeLabels[mode]}
        {loadHint && <span className="font-normal normal-case text-slate-500"> · {loadHint}</span>}
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Success</dt>
          <dd className="font-semibold text-slate-900 flex items-center gap-1">
            {entry.errorCount === 0 ? (
              <CheckCircle2 size={12} className="text-emerald-600" />
            ) : (
              <AlertCircle size={12} className="text-amber-600" />
            )}
            {entry.successRate}%
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Avg</dt>
          <dd className="font-semibold text-slate-900">{entry.avgMs} ms</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={10} /> Last run
          </dt>
          <dd className="text-xs font-medium text-slate-700 mt-0.5">{lastRun}</dd>
        </div>
      </dl>
      {entry.error && (
        <p className="text-xs text-red-700 mt-2 line-clamp-2">{entry.error}</p>
      )}
    </div>
  );
};

export default PerformanceMetricsBlock;
