import type { PerformanceManifest } from './types';

const API_BASE = '/api/performance';

export interface PerformanceApiStatus {
  manifest: PerformanceManifest;
  running: string[];
  runningAll: boolean;
  runningStress: string[];
  runningStressAll: boolean;
  apiReady: boolean;
}

export async function fetchPerformanceStatus(): Promise<PerformanceApiStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/status?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as PerformanceApiStatus;
  } catch {
    return null;
  }
}

export async function runSectionTest(sectionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/run/${sectionId}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Performance server unavailable. Run npm run dev:all.' };
  }
}

export async function runAllSectionTests(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/run-all`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Performance server unavailable. Run npm run dev:all.' };
  }
}
