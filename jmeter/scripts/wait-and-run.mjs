import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const configPath = path.join(repoRoot, 'jmeter/config/sections.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { baseProtocol, baseHost, basePort } = config.defaults;
const origin = `${baseProtocol}://${baseHost}:${basePort}`;

const log = (msg) => console.log(`[jmeter] ${msg}`);

function runPowerShell(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, scriptName);
    const child = spawn(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-File', script, ...args],
      { cwd: repoRoot, stdio: 'inherit', shell: true }
    );
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${scriptName} exited ${code}`))));
    child.on('error', reject);
  });
}

async function waitForServer(maxWaitMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(origin, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 404) {
        log(`App reachable at ${origin}`);
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timed out waiting for ${origin}. Start dev server first.`);
}

async function main() {
  log('Ensuring Apache JMeter is installed...');
  await runPowerShell('install-jmeter.ps1');

  log(`Waiting for ${origin} (dev:all vite)...`);
  await waitForServer();

  log('Running all performance sections...');
  await runPowerShell('run-all.ps1', ['-BaseHost', baseHost, '-BasePort', basePort]);

  log('Done. Refresh Super Admin > Performance for results.');
}

main().catch((err) => {
  console.error('[jmeter]', err.message || err);
  process.exit(1);
});
