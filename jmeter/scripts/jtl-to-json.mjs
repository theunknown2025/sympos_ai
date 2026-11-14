import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const sectionId = process.argv[2];
const jtlPath = process.argv[3];
const testMode = process.argv[4] === 'stress' ? 'stress' : 'smoke';
const threads = Number(process.argv[5]) || undefined;
const loops = Number(process.argv[6]) || undefined;
const rampUpSeconds = Number(process.argv[7]) || undefined;

if (!sectionId || !jtlPath) {
  console.error('Usage: node jtl-to-json.mjs <sectionId> <jtl> [smoke|stress] [threads] [loops] [rampUp]');
  process.exit(1);
}

if (!fs.existsSync(jtlPath)) {
  console.error('JTL not found:', jtlPath);
  process.exit(1);
}

const raw = fs.readFileSync(jtlPath, 'utf8').trim();
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  console.error('JTL empty or missing data rows');
  process.exit(1);
}

const header = lines[0].split(',');
const idx = (name) => header.indexOf(name);

const rows = lines.slice(1).map((line) => {
  const cols = line.split(',');
  return {
    label: cols[idx('label')] ?? '',
    elapsedMs: Number(cols[idx('elapsed')]) || 0,
    success: cols[idx('success')] === 'true',
    responseCode: cols[idx('responseCode')] ?? '',
  };
});

const successCount = rows.filter((r) => r.success).length;
const elapsed = rows.map((r) => r.elapsedMs).filter((n) => n > 0);
const avgMs = elapsed.length ? Math.round(elapsed.reduce((a, b) => a + b, 0) / elapsed.length) : 0;

const payload = {
  sectionId,
  testMode,
  ranAt: new Date().toISOString(),
  sampleCount: rows.length,
  successCount,
  errorCount: rows.length - successCount,
  successRate: rows.length ? Math.round((successCount / rows.length) * 1000) / 10 : 0,
  avgMs,
  minMs: elapsed.length ? Math.min(...elapsed) : 0,
  maxMs: elapsed.length ? Math.max(...elapsed) : 0,
  threads,
  loops,
  rampUpSeconds,
  samples: rows.slice(0, 50),
};

const outDir = path.join(repoRoot, 'public', 'performance-results');
fs.mkdirSync(outDir, { recursive: true });
const jsonName = testMode === 'stress' ? `${sectionId}-stress.json` : `${sectionId}.json`;
fs.writeFileSync(path.join(outDir, jsonName), JSON.stringify(payload, null, 2), 'utf8');

const manifestEntry = {
  ranAt: payload.ranAt,
  successRate: payload.successRate,
  avgMs: payload.avgMs,
  sampleCount: payload.sampleCount,
  errorCount: payload.errorCount,
  testMode,
  threads,
  loops,
  rampUpSeconds,
};

const manifestPath = path.join(outDir, 'manifest.json');
let manifest = { updatedAt: payload.ranAt, sections: {} };
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    /* reset */
  }
}

if (!manifest.sections[sectionId] || typeof manifest.sections[sectionId].ranAt === 'string') {
  const legacy = manifest.sections[sectionId];
  manifest.sections[sectionId] = legacy?.ranAt
    ? { smoke: { ...legacy, testMode: legacy.testMode || 'smoke' } }
    : {};
}

const bucket = manifest.sections[sectionId];
if (typeof bucket === 'object' && !bucket.ranAt) {
  bucket[testMode] = manifestEntry;
} else {
  manifest.sections[sectionId] = { [testMode]: manifestEntry };
}

manifest.updatedAt = payload.ranAt;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Wrote', jsonName);
