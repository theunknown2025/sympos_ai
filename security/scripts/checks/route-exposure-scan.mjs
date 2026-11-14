import fs from 'fs';
import { configPath } from '../lib/paths.mjs';
import { writeCheckResult } from '../lib/manifest.mjs';

const PROTECTED_ROUTES = [
  { path: '/superadmin', role: 'SuperAdmin' },
  { path: '/superadmin/performance', role: 'SuperAdmin' },
  { path: '/dashboard', role: 'Organizer' },
  { path: '/organizer/workspace', role: 'Organizer' },
  { path: '/jury/dashboard', role: 'Participant' },
  { path: '/submissions/manage', role: 'Organizer' },
];

export async function runRouteExposureScan() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const baseUrl = config.target.baseUrl.replace(/\/$/, '');
  const findings = [];

  for (const { path: route, role } of PROTECTED_ROUTES) {
    const url = `${baseUrl}${route}`;
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const bodySnippet = (await res.text()).slice(0, 200).toLowerCase();
      const looksLikeSpaShell =
        bodySnippet.includes('<!doctype html') || bodySnippet.includes('id="root"');

      if (res.status === 401 || res.status === 403) {
        findings.push({
          route,
          role,
          severity: 'pass',
          issue: `HTTP ${res.status} without session`,
          detail: 'Server or edge blocked unauthenticated access',
        });
      } else if (res.status >= 300 && res.status < 400) {
        findings.push({
          route,
          role,
          severity: 'pass',
          issue: `Redirect ${res.status}`,
          detail: 'May redirect to login',
        });
      } else if (res.status === 200 && looksLikeSpaShell) {
        findings.push({
          route,
          role,
          severity: 'warn',
          issue: 'HTTP 200 returns SPA shell without auth',
          detail:
            'Expected for client-side routing; enforce authorization on API/Supabase RLS, not only URL',
        });
      } else {
        findings.push({
          route,
          role,
          severity: 'info',
          issue: `HTTP ${res.status}`,
          detail: 'Review manually',
        });
      }
    } catch (err) {
      findings.push({
        route,
        role,
        severity: 'fail',
        issue: err.message || 'Request failed',
      });
    }
  }

  const fail = findings.filter((f) => f.severity === 'fail').length;
  const warn = findings.filter((f) => f.severity === 'warn').length;
  let status = 'pass';
  if (fail > 0) status = 'fail';
  else if (warn > 0) status = 'warn';

  const result = {
    id: 'route-exposure',
    name: 'Route exposure',
    status,
    ranAt: new Date().toISOString(),
    summary: `Checked ${PROTECTED_ROUTES.length} role-sensitive routes`,
    findings,
  };
  writeCheckResult('route-exposure', result);
  return result;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runRouteExposureScan().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
