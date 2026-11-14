import checksJson from '../../../../security/config/checks.json';
import type { SecurityCheckConfig } from './types';

const config = checksJson as { target: { baseUrl: string }; checks: SecurityCheckConfig[] };

export const securityTarget = config.target;
export const securityChecks: SecurityCheckConfig[] = [...config.checks].sort(
  (a, b) => a.order - b.order
);
