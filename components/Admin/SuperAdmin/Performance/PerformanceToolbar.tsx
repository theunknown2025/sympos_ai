import React, { useState } from 'react';
import { RefreshCw, Gauge, Loader2 } from 'lucide-react';
import { jmeterDefaults } from './performanceConfig';
import { runAllSectionTests } from './performanceTestService';
import { runAllStressTests } from './stressTestService';
import RunStressTestButton from './RunStressTestButton';
import StressTestToolbarHint from './StressTestToolbarHint';

interface PerformanceToolbarProps {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: string | null;
  apiOnline: boolean;
  runningAll: boolean;
  runningStressAll: boolean;
  anyRunning: boolean;
  onTestAllStarted: () => void;
  onTestError: (message: string) => void;
}

const PerformanceToolbar: React.FC<PerformanceToolbarProps> = ({
  onRefresh,
  loading,
  lastUpdated,
  apiOnline,
  runningAll,
  runningStressAll,
  anyRunning,
  onTestAllStarted,
  onTestError,
}) => {
  const [testingAll, setTestingAll] = useState(false);
  const [stressTestingAll, setStressTestingAll] = useState(false);

  const handleTestAll = async () => {
    if (anyRunning || testingAll) return;
    setTestingAll(true);
    onTestAllStarted();
    const result = await runAllSectionTests();
    setTestingAll(false);
    if (!result.ok) onTestError(result.error || 'Could not start full test suite');
  };

  const handleStressAll = async () => {
    if (anyRunning || stressTestingAll) return;
    setStressTestingAll(true);
    onTestAllStarted();
    const result = await runAllStressTests();
    setStressTestingAll(false);
    if (!result.ok) onTestError(result.error || 'Could not start stress suite');
  };

  return (
    <div className="mb-6 flex flex-col gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Gauge className="text-indigo-600 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-sm font-semibold text-slate-900">Apache JMeter™</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Smoke target{' '}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {jmeterDefaults.baseProtocol}://{jmeterDefaults.baseHost}:{jmeterDefaults.basePort}
              </code>
              {' · '}
              {jmeterDefaults.threads} users, {jmeterDefaults.loops} loops
            </p>
            {!apiOnline && (
              <span className="block text-amber-700 text-xs mt-1">
                Performance API offline — use <code className="bg-white px-1 rounded">npm run dev:all</code>
              </span>
            )}
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-1">
                Last update: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            <StressTestToolbarHint />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleTestAll}
            disabled={!apiOnline || anyRunning || testingAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {runningAll || testingAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Gauge size={16} />
            )}
            Test all sections
          </button>
          <RunStressTestButton
            onClick={handleStressAll}
            disabled={!apiOnline || (anyRunning && !runningStressAll)}
            loading={runningStressAll || stressTestingAll}
            fullWidth={false}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceToolbar;
