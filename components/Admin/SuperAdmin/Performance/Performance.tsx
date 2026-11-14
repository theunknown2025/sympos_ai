import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { performanceSections } from './performanceConfig';
import { usePerformanceResults } from './usePerformanceResults';
import PerformanceToolbar from './PerformanceToolbar';
import PerformanceSectionCard from './PerformanceSectionCard';

const SuperAdminPerformance: React.FC = () => {
  const {
    manifest,
    running,
    runningAll,
    runningStress,
    runningStressAll,
    anyRunning,
    apiOnline,
    loading,
    error,
    refresh,
  } = usePerformanceResults();
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BarChart3 size={32} className="text-indigo-600 shrink-0" />
          Performance
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Run smoke tests for a quick health check, or stress tests with higher load. Each card
          keeps separate smoke and stress results.
        </p>
      </header>

      <PerformanceToolbar
        onRefresh={refresh}
        loading={loading}
        lastUpdated={manifest?.updatedAt ?? null}
        apiOnline={apiOnline}
        runningAll={runningAll}
        runningStressAll={runningStressAll}
        anyRunning={anyRunning}
        onTestAllStarted={() => {
          setActionError(null);
          refresh();
        }}
        onTestError={setActionError}
      />

      {(error || actionError) && (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {actionError || error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {performanceSections.map((section) => (
          <PerformanceSectionCard
            key={section.id}
            section={section}
            manifest={manifest}
            isSmokeRunning={running.includes(section.id) || runningAll}
            isStressRunning={runningStress.includes(section.id) || runningStressAll}
            anyTestRunning={anyRunning}
            onTestStarted={() => {
              setActionError(null);
              refresh();
            }}
            onTestError={setActionError}
          />
        ))}
      </div>
    </div>
  );
};

export default SuperAdminPerformance;
