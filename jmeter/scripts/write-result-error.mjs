import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const sectionId = process.argv[2];
const testMode = process.argv[3] === 'stress' ? 'stress' : 'smoke';
const message = process.argv.slice(4).join(' ') || 'Test failed';

if (!sectionId) {
  console.error('Usage: node write-result-error.mjs <sectionId> [smoke|stress] <message>');
  process.exit(1);
}

const ranAt = new Date().toISOString();
const manifestEntry = {
  ranAt,
  successRate: 0,
  avgMs: 0,
  sampleCount: 0,
  errorCount: 1,
  error: message,
  testMode,
};

const outDir = path.join(repoRoot, 'public', 'performance-results');
fs.mkdirSync(outDir, { recursive: true });
const jsonName = testMode === 'stress' ? `${sectionId}-stress.json` : `${sectionId}.json`;
fs.writeFileSync(
  path.join(outDir, jsonName),
  JSON.stringify({ sectionId, testMode, ...manifestEntry, samples: [] }, null, 2)
);

const manifestPath = path.join(outDir, 'manifest.json');
let manifest = { updatedAt: ranAt, sections: {} };
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    /* keep */
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

manifest.updatedAt = ranAt;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Wrote error result for', sectionId, testMode);
