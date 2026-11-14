import fs from 'fs';
import path from 'path';
import { resultsDir } from './paths.mjs';

export function readManifest() {
  const p = path.join(resultsDir, 'manifest.json');
  if (!fs.existsSync(p)) {
    return { updatedAt: null, summary: { pass: 0, warn: 0, fail: 0, skip: 0 }, checks: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { updatedAt: null, summary: { pass: 0, warn: 0, fail: 0, skip: 0 }, checks: {} };
  }
}

export function writeCheckResult(checkId, result) {
  fs.mkdirSync(resultsDir, { recursive: true });
  const checkFile = path.join(resultsDir, `${checkId}.json`);
  fs.writeFileSync(checkFile, JSON.stringify(result, null, 2), 'utf8');

  const manifest = readManifest();
  manifest.checks[checkId] = {
    status: result.status,
    ranAt: result.ranAt,
    name: result.name,
    summary: result.summary,
    error: result.error,
  };
  manifest.updatedAt = result.ranAt;

  const counts = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const c of Object.values(manifest.checks)) {
    if (c.status === 'pass') counts.pass++;
    else if (c.status === 'warn') counts.warn++;
    else if (c.status === 'fail') counts.fail++;
    else if (c.status === 'skip') counts.skip++;
  }
  manifest.summary = counts;

  fs.writeFileSync(path.join(resultsDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return checkFile;
}
