import type { HeroButton, LandingPageFormCategory, SubmissionActionTarget } from '../../../../types';

export function resolveLandingPageActionTarget(btn: HeroButton): SubmissionActionTarget {
  if (btn.actionTarget) return btn.actionTarget;
  if (btn.formId) return 'form';
  return 'link';
}

export function resolveLandingPageAssetSource(btn: HeroButton): 'url' | 'upload' {
  if (btn.assetSource) return btn.assetSource;
  if (btn.uploadedFileUrl && (!btn.url || btn.url === '#')) return 'upload';
  return 'url';
}

export function resolveLandingPageCtaHref(btn: HeroButton): string | undefined {
  const action = resolveLandingPageActionTarget(btn);
  if (action === 'form') return undefined;
  const pick = (s?: string) => {
    const v = (s || '').trim();
    return v && v !== '#' ? v : undefined;
  };
  if (action === 'document' || action === 'image' || action === 'video') {
    return pick(btn.uploadedFileUrl) || pick(btn.url);
  }
  return pick(btn.url);
}

export function createDefaultSectionActionButton(text = 'Learn more'): HeroButton {
  return {
    id: `act-${Date.now()}`,
    text,
    url: '#',
    style: 'primary',
    actionTarget: 'link',
  };
}

export type SectionWithCtas = {
  showActionButton?: boolean;
  actionButton?: HeroButton;
  actionButtons?: HeroButton[];
};

/** Resolves CTAs from actionButtons or legacy single-button fields. */
export function getSectionActionButtons(section: SectionWithCtas): HeroButton[] {
  if (Array.isArray(section.actionButtons) && section.actionButtons.length > 0) {
    return section.actionButtons.filter((b) => b != null && typeof b === 'object');
  }
  if (section.showActionButton && section.actionButton) {
    return [section.actionButton];
  }
  if (section.actionButton) {
    return [section.actionButton];
  }
  return [];
}

export function normalizeSectionActionButton(raw: HeroButton | undefined): HeroButton | undefined {
  if (!raw) return undefined;
  return {
    ...raw,
    id: raw.id || `act-${Date.now()}`,
    text: raw.text || 'Learn more',
    url: raw.url ?? '#',
    style: raw.style === 'secondary' ? 'secondary' : 'primary',
  };
}

export type LandingPageFormOption = {
  id: string;
  title: string;
  category: LandingPageFormCategory;
};

export function filterFormsByCategory(
  options: LandingPageFormOption[],
  category: LandingPageFormCategory | undefined
): LandingPageFormOption[] {
  if (!category) return options;
  return options.filter((o) => o.category === category);
}

export function isRegistrationFormCategory(
  category: LandingPageFormCategory | undefined
): boolean {
  return category === 'registration' || category === 'submission' || category === 'payment';
}
