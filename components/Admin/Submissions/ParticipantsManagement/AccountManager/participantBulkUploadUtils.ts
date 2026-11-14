import { generateStrongPassword } from './participantAccountUtils';

export const BULK_PARTICIPANT_FORMAT_ERROR =
  "File doesn't respect format. First row must include name and email columns.";

export interface ParsedParticipantBulkRow {
  fullName: string;
  email: string;
}

export interface ParsedParticipantBulkFile {
  fileName: string;
  rows: ParsedParticipantBulkRow[];
}

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

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function parseParticipantBulkCsv(text: string): ParsedParticipantBulkRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(BULK_PARTICIPANT_FORMAT_ERROR);
  }

  const headers = parseCsvLine(lines[0]);
  const nameColumn =
    findColumn(headers, ['full_name', 'fullname', 'name', 'nom', 'full_name']) ||
    findColumn(headers, ['full']) ||
    headers[0];
  const emailColumn =
    findColumn(headers, ['email', 'e-mail', 'mail', 'courriel']) || headers[1];

  if (!nameColumn || !emailColumn) {
    throw new Error(BULK_PARTICIPANT_FORMAT_ERROR);
  }

  const rows: ParsedParticipantBulkRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const fullName = (row[nameColumn] || '').trim();
    const email = (row[emailColumn] || '').trim();
    if (!fullName && !email) continue;
    if (!fullName || !email) {
      throw new Error(`Row ${i + 1}: both full name and email are required.`);
    }

    rows.push({ fullName, email });
  }

  if (rows.length === 0) {
    throw new Error('No participant rows found in file.');
  }

  return rows;
}

export function bulkRowsToDrafts(rows: ParsedParticipantBulkRow[]) {
  return rows.map((row) => {
    const password = generateStrongPassword();
    return {
      id: crypto.randomUUID(),
      fullName: row.fullName,
      email: row.email,
      password,
      confirmPassword: password,
    };
  });
}

export async function parseParticipantBulkFile(file: File): Promise<ParsedParticipantBulkFile> {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.csv') && !lower.endsWith('.txt')) {
    throw new Error(
      'Upload a CSV file exported from Excel (Save As → CSV). Columns: full name, email.'
    );
  }

  const text = await file.text();
  const rows = parseParticipantBulkCsv(text);
  return { fileName: file.name, rows };
}
