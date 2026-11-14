import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const resultsDir = path.join(repoRoot, 'public', 'security-results');
const configPath = path.join(repoRoot, 'security', 'config', 'checks.json');

function formatFinding(f, index) {
  const lines = [`  ${index + 1}. [${f.severity ?? 'info'}] ${f.issue ?? ''}`];
  if (f.route) lines.push(`     Route: ${f.route}`);
  if (f.role) lines.push(`     Role: ${f.role}`);
  if (f.recommendation) lines.push(`     Recommendation: ${f.recommendation}`);
  if (f.detail) lines.push(`     Detail: ${f.detail}`);
  if (f.count != null) lines.push(`     Count: ${f.count}`);
  return lines.join('\n');
}

function formatAdvisory(a, index) {
  return `  ${index + 1}. [${a.severity}] ${a.package} — ${a.title}${a.url ? ` (${a.url})` : ''}`;
}

function sectionForReport(report) {
  const lines = [];
  lines.push(`--- ${report.name ?? report.id} [${(report.status ?? 'unknown').toUpperCase()}] ---`);
  lines.push(`Ran at: ${report.ranAt ?? 'n/a'}`);
  lines.push(`Summary: ${report.summary ?? 'n/a'}`);
  if (report.note) lines.push(`Note: ${report.note}`);
  if (report.reportUrl) lines.push(`Report URL: ${report.reportUrl}`);
  if (report.counts) {
    lines.push(
      `Counts: critical=${report.counts.critical ?? 0} high=${report.counts.high ?? 0} moderate=${report.counts.moderate ?? 0} low=${report.counts.low ?? 0} total=${report.counts.total ?? 0}`
    );
  }
  if (report.error) lines.push(`Error: ${report.error}`);
  if (report.findings?.length) {
    lines.push('Findings:');
    report.findings.forEach((f, i) => lines.push(formatFinding(f, i)));
  }
  if (report.advisories?.length) {
    lines.push('Advisories:');
    report.advisories.forEach((a, i) => lines.push(formatAdvisory(a, i)));
  }
  lines.push('');
  return lines.join('\n');
}

export function buildSecurityLogText(manifest, reports) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const generatedAt = new Date().toISOString();
  const lines = [
    '================================================================================',
    'SYMPOSE-IA — SECURITY SCAN LOG',
    '================================================================================',
    `Generated: ${generatedAt}`,
    `Target: ${config.target?.baseUrl ?? 'unknown'}`,
    `Manifest updated: ${manifest?.updatedAt ?? 'n/a'}`,
    '',
    '--- SUMMARY ---',
    `Pass:  ${manifest?.summary?.pass ?? 0}`,
    `Warn:  ${manifest?.summary?.warn ?? 0}`,
    `Fail:  ${manifest?.summary?.fail ?? 0}`,
    `Skip:  ${manifest?.summary?.skip ?? 0}`,
    '',
    '--- CHECKS (ordered) ---',
    '',
  ];

  const orderedIds = [...config.checks].sort((a, b) => a.order - b.order).map((c) => c.id);
  for (const id of orderedIds) {
    const report = reports[id];
    if (report) {
      lines.push(sectionForReport(report));
    } else {
      const entry = manifest?.checks?.[id];
      lines.push(`--- ${id} [NOT RUN] ---`);
      if (entry?.summary) lines.push(`Summary: ${entry.summary}`);
      lines.push('');
    }
  }

  lines.push('================================================================================');
  lines.push('End of security log');
  lines.push('================================================================================');
  return lines.join('\n');
}

export function generateSecurityLog() {
  fs.mkdirSync(resultsDir, { recursive: true });

  let manifest = { updatedAt: null, summary: { pass: 0, warn: 0, fail: 0, skip: 0 }, checks: {} };
  const manifestPath = path.join(resultsDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const reports = {};
  for (const { id } of config.checks) {
    const jsonPath = path.join(resultsDir, `${id}.json`);
    if (fs.existsSync(jsonPath)) {
      try {
        reports[id] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch {
        /* skip */
      }
    }
  }

  const text = buildSecurityLogText(manifest, reports);
  const logPath = path.join(resultsDir, 'security-log.txt');
  fs.writeFileSync(logPath, text, 'utf8');

  const combined = {
    generatedAt: new Date().toISOString(),
    target: config.target,
    manifest,
    reports,
  };
  const jsonLogPath = path.join(resultsDir, 'security-log.json');
  fs.writeFileSync(jsonLogPath, JSON.stringify(combined, null, 2), 'utf8');

  return {
    logPath,
    logUrl: '/security-results/security-log.txt',
    jsonLogUrl: '/security-results/security-log.json',
    generatedAt: combined.generatedAt,
    checkCount: Object.keys(reports).length,
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const result = generateSecurityLog();
  console.log('Wrote', result.logPath);
  console.log('Wrote', path.join(resultsDir, 'security-log.json'));
}
