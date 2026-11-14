import fs from 'fs';
import { writeCheckResult } from './lib/manifest.mjs';

const reportPath = process.argv[2];
const exists = reportPath && fs.existsSync(reportPath);
const size = exists ? fs.statSync(reportPath).size : 0;

writeCheckResult('zap', {
  id: 'zap',
  name: 'OWASP ZAP quick scan',
  status: exists && size > 500 ? 'warn' : 'fail',
  ranAt: new Date().toISOString(),
  summary: exists
    ? `Report generated (${Math.round(size / 1024)} KB). Open zap-report.html locally.`
    : 'ZAP did not produce a report file',
  findings: exists
    ? [{ severity: 'info', issue: 'Review HTML report for alerts', recommendation: '/security-results/zap-report.html' }]
    : [],
  reportUrl: '/security-results/zap-report.html',
});

console.log('ZAP result written');
