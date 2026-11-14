import { useCallback, useEffect, useRef, useState } from 'react';
import type { SecurityManifest } from './types';
import { fetchSecurityStatus } from './securityScanService';

export function useSecurityResults() {
  const [manifest, setManifest] = useState<SecurityManifest | null>(null);
  const [running, setRunning] = useState<string[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const status = await fetchSecurityStatus();

    if (status) {
      setApiOnline(true);
      setManifest(status.manifest);
      setRunning(status.running);
      setRunningAll(status.runningAll);
      setLoading(false);
      return;
    }

    setApiOnline(false);
    try {
      const res = await fetch(`/security-results/manifest.json?t=${Date.now()}`);
      if (res.ok) {
        setManifest((await res.json()) as SecurityManifest);
      } else {
        setManifest({
          updatedAt: null,
          summary: { pass: 0, warn: 0, fail: 0, skip: 0 },
          checks: {},
        });
      }
    } catch {
      setManifest({
        updatedAt: null,
        summary: { pass: 0, warn: 0, fail: 0, skip: 0 },
        checks: {},
      });
      setError('Start dev:all to run security scans from the UI.');
    } finally {
      setRunning([]);
      setRunningAll(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const active = runningAll || running.length > 0;
    if (pollRef.current) clearInterval(pollRef.current);
    if (active) pollRef.current = setInterval(load, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [runningAll, running.length, load]);

  const anyRunning = runningAll || running.length > 0;

  return { manifest, running, runningAll, anyRunning, apiOnline, loading, error, refresh: load };
}
