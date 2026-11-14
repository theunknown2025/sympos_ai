/**
 * Runs Apache JMeter sections on demand for Super Admin Performance UI.
 * npm run performance-server
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const PORT = process.env.PERFORMANCE_SERVER_PORT || 3005;
const manifestPath = path.join(repoRoot, 'public', 'performance-results', 'manifest.json');

const runningSections = new Set();
const runningStressSections = new Set();
let runningAll = false;
let runningStressAll = false;

const app = express();
app.use(
  cors({
    origin: process.env.VITE_APP_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

async function readManifest() {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { updatedAt: null, sections: {} };
  }
}

function anyTestRunning() {
  return (
    runningAll ||
    runningStressAll ||
    runningSections.size > 0 ||
    runningStressSections.size > 0
  );
}

function runPowerShell(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const script = path.join(repoRoot, 'jmeter', 'scripts', scriptName);
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...args],
      { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => {
      const t = d.toString();
      stdout += t;
      process.stdout.write(`[performance] ${t}`);
    });
    child.stderr?.on('data', (d) => {
      const t = d.toString();
      stderr += t;
      process.stderr.write(`[performance] ${t}`);
    });
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.trim() || stdout.trim() || `Script failed (${code})`));
    });
    child.on('error', reject);
  });
}

async function writeErrorResult(sectionId, testMode, message) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      'node',
      ['jmeter/scripts/write-result-error.mjs', sectionId, testMode, message.slice(0, 200)],
      { cwd: repoRoot, stdio: 'inherit' }
    );
    child.on('close', (code) => (code === 0 ? resolve() : reject()));
    child.on('error', reject);
  });
}

const jmeterArgs = ['-BaseHost', 'localhost', '-BasePort', '3000'];

app.get('/api/performance/status', async (_req, res) => {
  const manifest = await readManifest();
  res.json({
    manifest,
    running: [...runningSections],
    runningAll,
    runningStress: [...runningStressSections],
    runningStressAll,
    apiReady: true,
  });
});

app.post('/api/performance/run/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  if (anyTestRunning()) {
    return res.status(409).json({ error: 'Another performance test is already running.' });
  }

  runningSections.add(sectionId);
  res.json({ ok: true, sectionId, status: 'running', testMode: 'smoke' });

  try {
    await runPowerShell('install-jmeter.ps1');
    await runPowerShell('run-section.ps1', ['-Section', sectionId, ...jmeterArgs]);
  } catch (err) {
    console.error('[performance]', sectionId, err.message);
    try {
      await writeErrorResult(sectionId, 'smoke', err.message);
    } catch (e) {
      console.error('[performance] could not write error manifest', e);
    }
  } finally {
    runningSections.delete(sectionId);
  }
});

app.post('/api/performance/run-all', async (_req, res) => {
  if (anyTestRunning()) {
    return res.status(409).json({ error: 'A performance test is already in progress.' });
  }

  runningAll = true;
  res.json({ ok: true, status: 'running', testMode: 'smoke' });

  try {
    await runPowerShell('install-jmeter.ps1');
    await runPowerShell('run-all.ps1', jmeterArgs);
  } catch (err) {
    console.error('[performance] run-all', err.message);
  } finally {
    runningAll = false;
    runningSections.clear();
  }
});

app.post('/api/performance/stress/run/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  if (anyTestRunning()) {
    return res.status(409).json({ error: 'Another performance test is already running.' });
  }

  runningStressSections.add(sectionId);
  res.json({ ok: true, sectionId, status: 'running', testMode: 'stress' });

  try {
    await runPowerShell('install-jmeter.ps1');
    await runPowerShell('run-stress-section.ps1', ['-Section', sectionId, ...jmeterArgs]);
  } catch (err) {
    console.error('[performance] stress', sectionId, err.message);
    try {
      await writeErrorResult(sectionId, 'stress', err.message);
    } catch (e) {
      console.error('[performance] could not write stress error manifest', e);
    }
  } finally {
    runningStressSections.delete(sectionId);
  }
});

app.post('/api/performance/stress/run-all', async (_req, res) => {
  if (anyTestRunning()) {
    return res.status(409).json({ error: 'A performance test is already in progress.' });
  }

  runningStressAll = true;
  res.json({ ok: true, status: 'running', testMode: 'stress' });

  try {
    await runPowerShell('install-jmeter.ps1');
    await runPowerShell('run-stress-all.ps1', jmeterArgs);
  } catch (err) {
    console.error('[performance] stress run-all', err.message);
  } finally {
    runningStressAll = false;
    runningStressSections.clear();
  }
});

app.listen(PORT, () => {
  console.log(`Performance test API on http://localhost:${PORT}`);
});
