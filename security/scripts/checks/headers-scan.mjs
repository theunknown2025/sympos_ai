import { configPath } from '../lib/paths.mjs';
import { writeCheckResult } from '../lib/manifest.mjs';
import fs from 'fs';

const RECOMMENDED = [
  { header: 'x-content-type-options', severity: 'high', expected: 'nosniff' },
  { header: 'x-frame-options', severity: 'medium', expected: 'DENY or SAMEORIGIN' },
  { header: 'referrer-policy', severity: 'low', expected: 'any value' },
  { header: 'content-security-policy', severity: 'medium', expected: 'policy present' },
];

const PATHS = ['/', '/login', '/superadmin', '/dashboard', '/jury/dashboard'];

export async function runHeadersScan() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const baseUrl = config.target.baseUrl.replace(/\/$/, '');
  const findings = [];

  for (const route of PATHS) {
    const url = `${baseUrl}${route}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const headers = Object.fromEntries(
        [...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])
      );
      for (const rec of RECOMMENDED) {
        const value = headers[rec.header];
        if (!value) {
          findings.push({
            route,
            severity: rec.severity,
            issue: `Missing ${rec.header}`,
            recommendation: `Add ${rec.header} on production responses`,
          });
        } else if (rec.header === 'x-content-type-options' && value !== 'nosniff') {
          findings.push({
            route,
            severity: 'medium',
            issue: `${rec.header} is "${value}"`,
            recommendation: 'Use nosniff',
          });
        }
      }
      findings.push({
        route,
        severity: 'info',
        issue: `HTTP ${res.status}`,
        recommendation: 'SPA may return 200 for all routes; validate auth in app + API layer',
      });
    } catch (err) {
      findings.push({
        route,
        severity: 'fail',
        issue: err.message || 'Request failed',
        recommendation: 'Ensure npm run dev is running',
      });
    }
  }

  const fail = findings.filter((f) => f.severity === 'fail').length;
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;

  let status = 'pass';
  if (fail > 0 || high > 0) status = 'fail';
  else if (medium > 0) status = 'warn';

  const result = {
    id: 'headers',
    name: 'HTTP security headers',
    status,
    ranAt: new Date().toISOString(),
    summary: `${findings.length} finding(s) across ${PATHS.length} routes`,
    findings,
    note: 'Vite dev server may omit production headers; re-run against staging/production for accurate header review.',
  };
  writeCheckResult('headers', result);
  return result;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runHeadersScan().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
