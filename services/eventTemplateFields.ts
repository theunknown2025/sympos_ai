export const deserializeTemplateIdArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const resolveScopedTemplateIds = (scoped: unknown, legacy?: unknown): string[] => {
  const scopedArr = deserializeTemplateIdArray(scoped);
  if (scopedArr.length > 0) return scopedArr;
  return deserializeTemplateIdArray(legacy);
};

export type EventTemplateRow = {
  registration_badge_template_ids?: unknown;
  registration_certificate_template_ids?: unknown;
  submission_badge_template_ids?: unknown;
  submission_certificate_template_ids?: unknown;
  badge_template_ids?: unknown;
  certificate_template_ids?: unknown;
};

export const mapEventTemplateFields = (row: EventTemplateRow) => {
  const registrationBadgeTemplateIds = deserializeTemplateIdArray(row.registration_badge_template_ids);
  const registrationCertificateTemplateIds = resolveScopedTemplateIds(
    row.registration_certificate_template_ids,
    row.certificate_template_ids
  );
  const submissionBadgeTemplateIds = resolveScopedTemplateIds(
    row.submission_badge_template_ids,
    row.badge_template_ids
  );
  const submissionCertificateTemplateIds = deserializeTemplateIdArray(
    row.submission_certificate_template_ids
  );

  return {
    registrationBadgeTemplateIds,
    registrationCertificateTemplateIds,
    submissionBadgeTemplateIds,
    submissionCertificateTemplateIds,
    certificateTemplateIds: registrationCertificateTemplateIds,
    badgeTemplateIds: submissionBadgeTemplateIds,
  };
};

export const serializeEventTemplateFields = (event: {
  registrationBadgeTemplateIds?: string[];
  registrationCertificateTemplateIds?: string[];
  submissionBadgeTemplateIds?: string[];
  submissionCertificateTemplateIds?: string[];
}) => ({
  registration_badge_template_ids: JSON.stringify(event.registrationBadgeTemplateIds || []),
  registration_certificate_template_ids: JSON.stringify(event.registrationCertificateTemplateIds || []),
  submission_badge_template_ids: JSON.stringify(event.submissionBadgeTemplateIds || []),
  submission_certificate_template_ids: JSON.stringify(event.submissionCertificateTemplateIds || []),
  certificate_template_ids: JSON.stringify(event.registrationCertificateTemplateIds || []),
  badge_template_ids: JSON.stringify(event.submissionBadgeTemplateIds || []),
});
