import { writeCheckResult } from './lib/manifest.mjs';

const message = process.argv.slice(2).join(' ') || 'OWASP ZAP not installed';

writeCheckResult('zap', {
  id: 'zap',
  name: 'OWASP ZAP quick scan',
  status: 'skip',
  ranAt: new Date().toISOString(),
  summary: message,
  findings: [],
  reportUrl: null,
});

console.log(message);
