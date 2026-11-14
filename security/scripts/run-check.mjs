import fs from 'fs';
import { spawn } from 'child_process';
import { configPath, repoRoot } from './lib/paths.mjs';
import { runHeadersScan } from './checks/headers-scan.mjs';
import { runRouteExposureScan } from './checks/route-exposure-scan.mjs';
import { runNpmAuditScan } from './checks/npm-audit-scan.mjs';

const checkId = process.argv[2];
if (!checkId) {
  console.error('Usage: node run-check.mjs <checkId>');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const entry = config.checks.find((c) => c.id === checkId);
if (!entry) {
  console.error('Unknown check:', checkId);
  process.exit(1);
}

async function runZap() {
  const baseUrl = config.target.baseUrl;
  return new Promise((resolve, reject) => {
    const script = `${repoRoot}/security/scripts/checks/zap-scan.ps1`;
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-BaseUrl', baseUrl],
      { cwd: repoRoot, stdio: 'inherit' }
    );
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`zap scan exit ${code}`))));
    child.on('error', reject);
  });
}

const runners = {
  headers: runHeadersScan,
  'route-exposure': runRouteExposureScan,
  dependencies: runNpmAuditScan,
  zap: runZap,
};

const runner = runners[checkId];
if (!runner) {
  console.error('No runner for', checkId);
  process.exit(1);
}

await runner();
console.log('Check complete:', checkId);
