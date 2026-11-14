import type { SecurityCheckReport, SecurityManifest } from './types';

const API_BASE = '/api/security';

export interface SecurityApiStatus {
  manifest: SecurityManifest;
  running: string[];
  runningAll: boolean;
  apiReady: boolean;
}

export async function fetchSecurityStatus(): Promise<SecurityApiStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/status?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as SecurityApiStatus;
  } catch {
    return null;
  }
}

export async function fetchCheckReport(checkId: string): Promise<SecurityCheckReport | null> {
  try {
    const res = await fetch(`${API_BASE}/check/${checkId}?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as SecurityCheckReport;
  } catch {
    return null;
  }
}

export async function runSecurityCheck(checkId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/run/${checkId}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Security server unavailable. Run npm run dev:all.' };
  }
}

export async function runAllSecurityChecks(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/run-all`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Security server unavailable. Run npm run dev:all.' };
  }
}

export async function installZap(): Promise<{ ok: boolean }> {
  try {
    await fetch(`${API_BASE}/install-zap`, { method: 'POST' });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export interface GenerateSecurityLogResult {
  ok: boolean;
  error?: string;
  logUrl?: string;
  jsonLogUrl?: string;
  generatedAt?: string;
  lineCount?: number;
}

export async function generateSecurityLog(): Promise<GenerateSecurityLogResult> {
  try {
    const res = await fetch(`${API_BASE}/generate-log`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return {
      ok: true,
      logUrl: data.logUrl,
      jsonLogUrl: data.jsonLogUrl,
      generatedAt: data.generatedAt,
      lineCount: data.lineCount,
    };
  } catch {
    return { ok: false, error: 'Security server unavailable. Run npm run dev:all.' };
  }
}

/** Build log in-browser when API is offline (reads existing JSON reports). */
export async function generateSecurityLogOffline(
  checkIds: string[]
): Promise<{ blob: Blob; filename: string } | null> {
  const reports: Record<string, SecurityCheckReport> = {};
  let manifest: SecurityManifest = {
    updatedAt: null,
    summary: { pass: 0, warn: 0, fail: 0, skip: 0 },
    checks: {},
  };

  try {
    const mRes = await fetch(`/security-results/manifest.json?t=${Date.now()}`);
    if (mRes.ok) manifest = (await mRes.json()) as SecurityManifest;
  } catch {
    return null;
  }

  for (const id of checkIds) {
    try {
      const res = await fetch(`/security-results/${id}.json?t=${Date.now()}`);
      if (res.ok) reports[id] = (await res.json()) as SecurityCheckReport;
    } catch {
      /* skip */
    }
  }

  const lines: string[] = [
    'SYMPOSE-IA — SECURITY SCAN LOG (offline export)',
    `Generated: ${new Date().toISOString()}`,
    `Pass ${manifest.summary.pass} · Warn ${manifest.summary.warn} · Fail ${manifest.summary.fail}`,
    '',
  ];

  for (const id of checkIds) {
    const r = reports[id];
    if (!r) {
      lines.push(`--- ${id}: no report file ---\n`);
      continue;
    }
    lines.push(`--- ${r.name} [${r.status}] ---`);
    lines.push(r.summary);
    (r.findings ?? []).forEach((f, i) => {
      lines.push(`  ${i + 1}. [${f.severity}] ${f.issue}${f.route ? ` (${f.route})` : ''}`);
    });
    lines.push('');
  }

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return { blob, filename: `sympos-ia-security-log-${stamp}.txt` };
}
