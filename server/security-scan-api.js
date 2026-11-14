/**
 * Local security scans for Super Admin Security page.
 * npm run security-server
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const PORT = process.env.SECURITY_SERVER_PORT || 3006;
const manifestPath = path.join(repoRoot, 'public', 'security-results', 'manifest.json');

const runningChecks = new Set();
let runningAll = false;

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
    return { updatedAt: null, summary: { pass: 0, warn: 0, fail: 0, skip: 0 }, checks: {} };
  }
}

function anyRunning() {
  return runningAll || runningChecks.size > 0;
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
      process.stderr.write(`[security] ${d}`);
    });
    child.stdout?.on('data', (d) => process.stdout.write(`[security] ${d}`));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `Exit ${code}`));
    });
    child.on('error', reject);
  });
}

app.get('/api/security/status', async (_req, res) => {
  const manifest = await readManifest();
  res.json({
    manifest,
    running: [...runningChecks],
    runningAll,
    apiReady: true,
  });
});

app.get('/api/security/check/:checkId', async (req, res) => {
  const file = path.join(repoRoot, 'public', 'security-results', `${req.params.checkId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: 'No report for this check yet' });
  }
});

app.post('/api/security/install-zap', async (_req, res) => {
  res.json({ ok: true, status: 'installing' });
  spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'security/scripts/install-zap.ps1'],
    { cwd: repoRoot, stdio: 'inherit' }
  ).on('close', (code) => {
    console.log('[security] ZAP install finished', code);
  });
});

app.post('/api/security/run/:checkId', async (req, res) => {
  const { checkId } = req.params;
  if (anyRunning()) {
    return res.status(409).json({ error: 'Another security scan is already running.' });
  }

  runningChecks.add(checkId);
  res.json({ ok: true, checkId, status: 'running' });

  try {
    if (checkId === 'zap') {
      await new Promise((resolve, reject) => {
        const child = spawn(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'security/scripts/install-zap.ps1'],
          { cwd: repoRoot, stdio: 'ignore' }
        );
        child.on('close', () => resolve());
        child.on('error', reject);
      }).catch(() => {});
    }
    await runNode(['security/scripts/run-check.mjs', checkId]);
  } catch (err) {
    console.error('[security]', checkId, err.message);
  } finally {
    runningChecks.delete(checkId);
  }
});

app.post('/api/security/generate-log', async (_req, res) => {
  try {
    await runNode(['security/scripts/generate-security-log.mjs']);
    const manifest = await readManifest();
    const logPath = path.join(repoRoot, 'public', 'security-results', 'security-log.txt');
    let lineCount = 0;
    try {
      const text = await fs.readFile(logPath, 'utf8');
      lineCount = text.split(/\r?\n/).length;
    } catch {
      /* */
    }
    res.json({
      ok: true,
      logUrl: '/security-results/security-log.txt',
      jsonLogUrl: '/security-results/security-log.json',
      generatedAt: new Date().toISOString(),
      summary: manifest.summary,
      lineCount,
    });
  } catch (err) {
    console.error('[security] generate-log', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate security log' });
  }
});

app.post('/api/security/run-all', async (_req, res) => {
  if (anyRunning()) {
    return res.status(409).json({ error: 'A security scan is already in progress.' });
  }

  runningAll = true;
  res.json({ ok: true, status: 'running' });

  try {
    await runNode(['security/scripts/run-all-checks.mjs']);
  } catch (err) {
    console.error('[security] run-all', err.message);
  } finally {
    runningAll = false;
    runningChecks.clear();
  }
});

app.listen(PORT, () => {
  console.log(`Security scan API on http://localhost:${PORT}`);
});
