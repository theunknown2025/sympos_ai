const API_BASE = '/api/performance/stress';

export async function runSectionStressTest(
  sectionId: string
): Promise<{ ok: boolean; error?: string }> {
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

export async function runAllStressTests(): Promise<{ ok: boolean; error?: string }> {
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
