import { useCallback, useEffect, useRef, useState } from 'react';
import type { PerformanceManifest } from './types';
import { fetchPerformanceStatus } from './performanceTestService';

export function usePerformanceResults() {
  const [manifest, setManifest] = useState<PerformanceManifest | null>(null);
  const [running, setRunning] = useState<string[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [runningStress, setRunningStress] = useState<string[]>([]);
  const [runningStressAll, setRunningStressAll] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const status = await fetchPerformanceStatus();

    if (status) {
      setApiOnline(true);
      setManifest(status.manifest);
      setRunning(status.running);
      setRunningAll(status.runningAll);
      setRunningStress(status.runningStress ?? []);
      setRunningStressAll(status.runningStressAll ?? false);
      setLoading(false);
      return;
    }

    setApiOnline(false);
    try {
      const res = await fetch(`/performance-results/manifest.json?t=${Date.now()}`);
      if (res.ok) {
        setManifest((await res.json()) as PerformanceManifest);
      } else {
        setManifest({ updatedAt: null, sections: {} });
      }
    } catch {
      setManifest({ updatedAt: null, sections: {} });
      setError('Start dev:all to enable performance tests from the UI.');
    } finally {
      setRunning([]);
      setRunningAll(false);
      setRunningStress([]);
      setRunningStressAll(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const isActive =
      runningAll ||
      runningStressAll ||
      running.length > 0 ||
      runningStress.length > 0;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (isActive) {
      pollRef.current = setInterval(load, 2000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [runningAll, runningStressAll, running.length, runningStress.length, load]);

  const anyRunning =
    runningAll || runningStressAll || running.length > 0 || runningStress.length > 0;

  return {
    manifest,
    running,
    runningAll,
    runningStress,
    runningStressAll,
    anyRunning,
    apiOnline,
    loading,
    error,
    refresh: load,
  };
}
