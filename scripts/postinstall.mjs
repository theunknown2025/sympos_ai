import { spawnSync } from 'node:child_process';
import process from 'node:process';

// JMeter is a local Windows performance tool. Amplify builds on Linux and
// does not have PowerShell, so skip the installer there.
if (process.platform !== 'win32') {
  console.log('[postinstall] Skipping JMeter install (Windows only).');
  process.exit(0);
}

const result = spawnSync(
  'powershell',
  ['-ExecutionPolicy', 'Bypass', '-File', 'jmeter/scripts/install-jmeter.ps1'],
  { stdio: 'inherit', shell: false }
);

process.exit(result.status ?? 1);
