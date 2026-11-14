import fs from 'fs';
import { spawnSync } from 'child_process';
import { configPath, repoRoot } from './lib/paths.mjs';

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ids = [...config.checks].sort((a, b) => a.order - b.order).map((c) => c.id);

for (const id of ids) {
  console.log(`\n=== Security check: ${id} ===`);
  const r = spawnSync('node', ['security/scripts/run-check.mjs', id], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('Check failed:', id, '(continuing)');
  }
}

console.log('\nAll security checks finished. See public/security-results/');
