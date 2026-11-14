import { spawn } from 'child_process';
import { repoRoot } from '../lib/paths.mjs';
import { writeCheckResult } from '../lib/manifest.mjs';

function runNpmAudit() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['audit', '--json'], {
      cwd: repoRoot,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    child.on('error', reject);
  });
}

export async function runNpmAuditScan() {
  const { code, stdout, stderr } = await runNpmAudit();
  let parsed = null;
  try {
    const jsonStart = stdout.indexOf('{');
    if (jsonStart >= 0) {
      parsed = JSON.parse(stdout.slice(jsonStart));
    }
  } catch {
    /* partial */
  }

  const meta = parsed?.metadata?.vulnerabilities ?? {};
  const critical = meta.critical ?? 0;
  const high = meta.high ?? 0;
  const moderate = meta.moderate ?? 0;
  const low = meta.low ?? 0;
  const total = meta.total ?? critical + high + moderate + low;

  const findings = [];
  if (critical > 0) findings.push({ severity: 'critical', count: critical, issue: 'Critical npm vulnerabilities' });
  if (high > 0) findings.push({ severity: 'high', count: high, issue: 'High npm vulnerabilities' });
  if (moderate > 0) findings.push({ severity: 'medium', count: moderate, issue: 'Moderate npm vulnerabilities' });
  if (low > 0) findings.push({ severity: 'low', count: low, issue: 'Low npm vulnerabilities' });

  let status = 'pass';
  if (critical > 0 || high > 0) status = 'fail';
  else if (moderate > 0) status = 'warn';
  else if (code !== 0 && total === 0 && !parsed) status = 'warn';

  const result = {
    id: 'dependencies',
    name: 'Dependency audit',
    status: total === 0 && code === 0 ? 'pass' : status,
    ranAt: new Date().toISOString(),
    summary: total === 0 ? 'No known vulnerabilities in npm audit' : `${total} vulnerability(ies) reported`,
    counts: { critical, high, moderate, low, total },
    findings,
    auditExitCode: code,
    stderr: stderr.trim() || undefined,
    advisories: parsed?.vulnerabilities
      ? Object.entries(parsed.vulnerabilities)
          .slice(0, 15)
          .map(([name, v]) => ({
            package: name,
            severity: v.severity,
            title: v.title ?? v.name,
            url: v.url,
          }))
      : [],
  };
  writeCheckResult('dependencies', result);
  return result;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runNpmAuditScan().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
