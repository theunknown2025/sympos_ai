import React, { useState } from 'react';
import { Gauge, Loader2, Route } from 'lucide-react';
import type { PerformanceManifest, PerformanceSectionConfig } from './types';
import { getPerformanceStatus, statusStyles } from './performanceStatus';
import PerformanceStatusBadge from './PerformanceStatusBadge';
import { runSectionTest } from './performanceTestService';
import { runSectionStressTest } from './stressTestService';
import { getManifestEntry } from './performanceManifestUtils';
import PerformanceMetricsBlock from './PerformanceMetricsBlock';
import RunStressTestButton from './RunStressTestButton';

interface PerformanceSectionCardProps {
  section: PerformanceSectionConfig;
  manifest: PerformanceManifest | null;
  isSmokeRunning: boolean;
  isStressRunning: boolean;
  anyTestRunning: boolean;
  onTestStarted: () => void;
  onTestError: (message: string) => void;
}

const PerformanceSectionCard: React.FC<PerformanceSectionCardProps> = ({
  section,
  manifest,
  isSmokeRunning,
  isStressRunning,
  anyTestRunning,
  onTestStarted,
  onTestError,
}) => {
  const [showRoutes, setShowRoutes] = useState(false);
  const [localSmokeBusy, setLocalSmokeBusy] = useState(false);
  const [localStressBusy, setLocalStressBusy] = useState(false);

  const smokeEntry = getManifestEntry(manifest, section.id, 'smoke');
  const stressEntry = getManifestEntry(manifest, section.id, 'stress');

  const primaryStatus = getPerformanceStatus(
    isStressRunning ? stressEntry : smokeEntry,
    isSmokeRunning || isStressRunning,
    isStressRunning ? 'stress' : 'smoke'
  );
  const styles = statusStyles[primaryStatus.kind];
  const smokeBusy = localSmokeBusy || isSmokeRunning;
  const stressBusy = localStressBusy || isStressRunning;

  const handleSmokeTest = async () => {
    if (smokeBusy || anyTestRunning) return;
    setLocalSmokeBusy(true);
    onTestStarted();
    const result = await runSectionTest(section.id);
    setLocalSmokeBusy(false);
    if (!result.ok) onTestError(result.error || 'Test failed to start');
  };

  const handleStressTest = async () => {
    if (stressBusy || anyTestRunning) return;
    setLocalStressBusy(true);
    onTestStarted();
    const result = await runSectionStressTest(section.id);
    setLocalStressBusy(false);
    if (!result.ok) onTestError(result.error || 'Stress test failed to start');
  };

  return (
    <article
      className={`bg-white rounded-xl border p-5 flex flex-col h-full transition-shadow ${styles.ring} ${
        isSmokeRunning || isStressRunning ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{section.name}</h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{section.description}</p>
        </div>
        <PerformanceStatusBadge status={primaryStatus} large />
      </div>

      <div className="flex-1 space-y-3 mb-4">
        <PerformanceMetricsBlock mode="smoke" entry={smokeEntry} />
        <PerformanceMetricsBlock mode="stress" entry={stressEntry} />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSmokeTest}
          disabled={smokeBusy || (anyTestRunning && !isSmokeRunning)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {smokeBusy ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Testing…
            </>
          ) : (
            <>
              <Gauge size={18} />
              Test Performance
            </>
          )}
        </button>

        <RunStressTestButton
          onClick={handleStressTest}
          disabled={!stressBusy && anyTestRunning && !isStressRunning}
          loading={stressBusy}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowRoutes((v) => !v)}
        className="mt-3 text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 justify-center"
      >
        <Route size={12} />
        {showRoutes ? 'Hide' : 'Show'} {section.paths.length} routes
      </button>

      {showRoutes && (
        <ul className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {section.paths.map((p) => (
            <li
              key={p}
              className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default PerformanceSectionCard;
