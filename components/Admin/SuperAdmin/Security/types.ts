export type SecurityCheckStatus = 'pass' | 'warn' | 'fail' | 'skip' | 'idle';

export interface SecurityCheckConfig {
  id: string;
  order: number;
  name: string;
  description: string;
}

export interface SecurityManifestEntry {
  status: SecurityCheckStatus;
  ranAt?: string;
  name?: string;
  summary?: string;
  error?: string;
}

export interface SecurityManifest {
  updatedAt: string | null;
  summary: { pass: number; warn: number; fail: number; skip: number };
  checks: Record<string, SecurityManifestEntry>;
}

export interface SecurityFinding {
  severity: string;
  issue: string;
  recommendation?: string;
  detail?: string;
  route?: string;
  role?: string;
  count?: number;
  package?: string;
  title?: string;
  url?: string;
}

export interface SecurityCheckReport {
  id: string;
  name: string;
  status: SecurityCheckStatus;
  ranAt: string;
  summary: string;
  findings?: SecurityFinding[];
  note?: string;
  reportUrl?: string | null;
  counts?: Record<string, number>;
  advisories?: Array<{ package: string; severity: string; title: string; url?: string }>;
  error?: string;
}
