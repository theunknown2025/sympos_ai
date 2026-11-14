import type { Event } from '../types';

const deserializeStringArray = (value: unknown): string[] => {
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

export const mapEventCheckinDisplayFields = (row: Record<string, unknown>) => ({
  registrationCheckinDisplayFieldKeys: deserializeStringArray(row.registration_checkin_display_field_keys),
  submissionCheckinDisplayFieldKeys: deserializeStringArray(row.submission_checkin_display_field_keys),
});

export const serializeEventCheckinDisplayFields = (event: {
  registrationCheckinDisplayFieldKeys?: string[];
  submissionCheckinDisplayFieldKeys?: string[];
}) => {
  const out: Record<string, string> = {};
  if (event.registrationCheckinDisplayFieldKeys !== undefined) {
    out.registration_checkin_display_field_keys = JSON.stringify(
      event.registrationCheckinDisplayFieldKeys || []
    );
  }
  if (event.submissionCheckinDisplayFieldKeys !== undefined) {
    out.submission_checkin_display_field_keys = JSON.stringify(
      event.submissionCheckinDisplayFieldKeys || []
    );
  }
  return out;
};
