import type { CommitteeInvitationInviteeSnapshot } from '../../../../../types';

export const BULK_INVITATION_FORMAT_ERROR = "File doesn't respect format";

export interface BulkInvitationRow {
  [key: string]: string;
}

export interface ParsedBulkInvitationFile {
  headers: string[];
  normalizedHeaders: string[];
  rows: BulkInvitationRow[];
}

export const normalizeBulkHeader = (header: string): string =>
  header.trim().toLowerCase().replace(/\s+/g, '_');

export const mergeFieldToken = (header: string): string => `{{${normalizeBulkHeader(header)}}}`;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((v) => v.trim());
}

export function parseBulkInvitationCsv(text: string): ParsedBulkInvitationFile {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(BULK_INVITATION_FORMAT_ERROR);
  }

  const rawHeaders = parseCsvLine(lines[0]);
  if (
    rawHeaders.length === 0 ||
    rawHeaders.some((h) => !h.trim()) ||
    rawHeaders.every((h) => !/[a-zA-Z]/.test(h))
  ) {
    throw new Error(BULK_INVITATION_FORMAT_ERROR);
  }

  const headers = rawHeaders.map((h) => h.trim());
  const normalizedHeaders = headers.map(normalizeBulkHeader);

  const rows: BulkInvitationRow[] = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: BulkInvitationRow = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() ?? '';
      row[header] = value;
      row[normalizeBulkHeader(header)] = value;
    });
    return row;
  });

  if (rows.length === 0) {
    throw new Error(BULK_INVITATION_FORMAT_ERROR);
  }

  return { headers, normalizedHeaders, rows };
}

export function getRowColumnValue(
  row: BulkInvitationRow,
  headers: string[],
  aliases: string[]
): string {
  for (const alias of aliases) {
    const normalized = normalizeBulkHeader(alias);
    if (row[normalized]) return row[normalized];
    const match = headers.find((h) => normalizeBulkHeader(h) === normalized);
    if (match && row[match]) return row[match];
  }
  return '';
}

export function findEmailColumn(headers: string[]): string | null {
  const aliases = ['email', 'e_mail', 'e-mail', 'mail', 'courriel'];
  for (const header of headers) {
    if (aliases.includes(normalizeBulkHeader(header))) {
      return header;
    }
  }
  return null;
}

export const MEMBER_EMAIL_MERGE_TOKEN = '{{member_email}}';

export function applyMergeFields(
  template: string,
  row: BulkInvitationRow,
  headers: string[]
): string {
  let result = template;
  for (const header of headers) {
    const value = row[header] ?? row[normalizeBulkHeader(header)] ?? '';
    const token = mergeFieldToken(header);
    result = result.split(token).join(value);
  }
  return result;
}

/** Apply CSV row fields plus optional panel fields (e.g. member email input). */
export function applyBulkInvitationMergeFields(
  template: string,
  row: BulkInvitationRow,
  headers: string[],
  options?: { memberEmail?: string }
): string {
  let result = applyMergeFields(template, row, headers);
  const memberEmail = options?.memberEmail?.trim();
  if (memberEmail) {
    result = result.split(MEMBER_EMAIL_MERGE_TOKEN).join(memberEmail);
  }
  return result;
}

export function rowToInviteeSnapshot(
  row: BulkInvitationRow,
  headers: string[]
): CommitteeInvitationInviteeSnapshot {
  const email = getRowColumnValue(row, headers, ['email', 'e-mail', 'mail', 'courriel']);
  const fullName = getRowColumnValue(row, headers, [
    'name',
    'nom',
    'full_name',
    'fullname',
    'recipient',
  ]);
  const fonction = getRowColumnValue(row, headers, [
    'fonction',
    'function',
    'position',
    'title',
    'role',
  ]);

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Invited';
  const lastName = nameParts.slice(1).join(' ') || 'Member';

  return {
    email,
    firstName,
    lastName,
    title: fonction || undefined,
    affiliation: fonction ? { position: fonction } : undefined,
  };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
