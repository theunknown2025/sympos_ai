export function generateStrongPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const remaining = Array.from({ length: Math.max(length - required.length, 0) }, () =>
    pick(all)
  );
  const chars = [...required, ...remaining];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function createEmptyParticipantDraft(): {
  id: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
} {
  const password = generateStrongPassword();
  return {
    id: crypto.randomUUID(),
    fullName: '',
    email: '',
    password,
    confirmPassword: password,
  };
}

export function validateParticipantDraft(
  draft: { fullName: string; email: string; password: string; confirmPassword: string },
  otherEmails: string[]
): string | null {
  if (!draft.fullName.trim()) return 'Full name is required';
  if (!draft.email.trim() || !isValidEmail(draft.email)) return 'Valid email is required';
  const normalized = draft.email.trim().toLowerCase();
  if (otherEmails.filter((e) => e === normalized).length > 1) {
    return 'Duplicate email in this batch';
  }
  if (!draft.password || draft.password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (draft.password !== draft.confirmPassword) return 'Passwords do not match';
  return null;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Participant', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
