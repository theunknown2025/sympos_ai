import type {
  PerformanceManifest,
  PerformanceManifestEntry,
  PerformanceSectionResults,
  PerformanceTestMode,
} from './types';

/** Legacy flat entry vs { smoke?, stress? } bucket */
export function getSectionResults(
  manifest: PerformanceManifest | null | undefined,
  sectionId: string
): PerformanceSectionResults {
  const raw = manifest?.sections?.[sectionId];
  if (!raw) return {};
  if ('ranAt' in raw && typeof raw.ranAt === 'string') {
    return { smoke: { ...raw, testMode: raw.testMode ?? 'smoke' } };
  }
  return raw as PerformanceSectionResults;
}

export function getManifestEntry(
  manifest: PerformanceManifest | null | undefined,
  sectionId: string,
  mode: PerformanceTestMode
): PerformanceManifestEntry | undefined {
  return getSectionResults(manifest, sectionId)[mode];
}
