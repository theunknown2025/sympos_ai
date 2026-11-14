/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lexicographic max for YYYY-MM-DD strings. */
export function maxISODate(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export interface Step2DeadlineNormalizeInput {
  today: string;
  workflowNeedsAbstract: boolean;
  workflowNeedsPayment: boolean;
  registrationDeadline: string;
  abstractSubmissionDeadline: string;
  submissionDeadline: string;
  paymentDeadline: string;
}

/** Enforce not-before-today and abstract ≤ article ≤ payment when those steps apply. */
export function normalizeStep2Deadlines(input: Step2DeadlineNormalizeInput): {
  registrationDeadline: string;
  abstractSubmissionDeadline: string;
  submissionDeadline: string;
  paymentDeadline: string;
} {
  const t = input.today;
  let reg = input.registrationDeadline;
  let abs = input.abstractSubmissionDeadline;
  let art = input.submissionDeadline;
  let pay = input.paymentDeadline;
  if (reg && reg < t) reg = t;
  if (abs && abs < t) abs = t;
  if (art && art < t) art = t;
  if (pay && pay < t) pay = t;
  if (input.workflowNeedsAbstract && abs && art && art < abs) art = abs;
  if (input.workflowNeedsPayment && art && pay && pay < art) pay = art;
  return {
    registrationDeadline: reg,
    abstractSubmissionDeadline: abs,
    submissionDeadline: art,
    paymentDeadline: pay,
  };
}
