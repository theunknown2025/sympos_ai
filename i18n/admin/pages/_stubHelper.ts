import { createNamespace } from '../createNamespace';

/** Minimal placeholder until the page is fully internationalized. */
export function pageStub(enTitle: string, frTitle: string) {
  return createNamespace({
    en: { pageTitle: enTitle },
    fr: { pageTitle: frTitle },
  });
}
