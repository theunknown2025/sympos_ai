export interface PerformanceSectionConfig {
  id: string;
  order: number;
  planFile: string;
  name: string;
  description: string;
  paths: string[];
}

export type PerformanceTestMode = 'smoke' | 'stress';

export interface PerformanceManifestEntry {
  ranAt: string;
  successRate: number;
  avgMs: number;
  sampleCount: number;
  errorCount: number;
  error?: string;
  testMode?: PerformanceTestMode;
  threads?: number;
  loops?: number;
  rampUpSeconds?: number;
}

/** Per-section results; legacy manifests may use a flat PerformanceManifestEntry */
export interface PerformanceSectionResults {
  smoke?: PerformanceManifestEntry;
  stress?: PerformanceManifestEntry;
}

export interface PerformanceManifest {
  updatedAt: string | null;
  sections: Record<string, PerformanceSectionResults | PerformanceManifestEntry>;
}

export interface PerformanceSectionResult {
  sectionId: string;
  testMode?: PerformanceTestMode;
  ranAt: string;
  sampleCount: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  threads?: number;
  loops?: number;
  rampUpSeconds?: number;
  error?: string;
  samples?: Array<{
    label: string;
    elapsedMs: number;
    success: boolean;
    responseCode: string;
  }>;
}
