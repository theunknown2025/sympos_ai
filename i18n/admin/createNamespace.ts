import type { AdminLocaleBundle } from './types';

/** Wraps a bilingual object for type inference and documentation. */
export function createNamespace<T extends Record<string, string>>(
  bundle: AdminLocaleBundle<T>
): AdminLocaleBundle<T> {
  return bundle;
}
