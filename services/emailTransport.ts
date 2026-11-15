import { supabase } from '../supabase';

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}

type NodeAttempt =
  | { kind: 'sent'; messageId?: string }
  | { kind: 'unavailable' };

function isLocalHostName(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalPage(): boolean {
  if (typeof window === 'undefined') return false;
  return isLocalHostName(window.location.hostname);
}

function isLocalhostUrl(url: string): boolean {
  try {
    return isLocalHostName(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Public Node email API, when the build was given one.
 * A localhost URL baked in at build time is ignored on the hosted site:
 * the visitor's browser cannot reach the machine that built the app.
 */
function configuredPublicBase(): string | null {
  const configured = String(import.meta.env.VITE_EMAIL_API_URL || '').trim().replace(/\/$/, '');
  if (!configured || isLocalhostUrl(configured)) return null;
  return configured;
}

function localApiBase(): string {
  const configured = String(import.meta.env.VITE_EMAIL_API_URL || '').trim().replace(/\/$/, '');
  return configured || 'http://localhost:3001';
}

function localServerDownMessage(): string {
  return (
    'Email API Server is not running.\n\n' +
    'Please start it using:\n\n' +
    'npm run email-server\n\n' +
    'Or run both servers together:\n' +
    'npm run dev:all'
  );
}

function hostedConfigMessage(): string {
  return (
    'Email service is not configured on the hosted site.\n\n' +
    'Set these Supabase Edge Function secrets from Amazon SES SMTP:\n' +
    'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL, FROM_NAME\n\n' +
    'Then redeploy the send-email function and the Amplify frontend.'
  );
}

function hostedSmtpAuthMessage(): string {
  return (
    'SMTP Authentication Failed\n\n' +
    'The hosted site sends mail through the Supabase send-email function. ' +
    'It does not use the local email server.\n\n' +
    'Update the function secrets with the Amazon SES SMTP username/password ' +
    '(from the AWS credentials CSV), then redeploy send-email.'
  );
}

function localSmtpAuthMessage(): string {
  return (
    'SMTP Authentication Failed\n\n' +
    'The email server is running, but SMTP credentials are incorrect.\n\n' +
    'The app uses .env only (NOT .env.example).\n\n' +
    'Please verify:\n' +
    '1. .env in the project root has SMTP_USER = your full email\n' +
    '2. SMTP_PASSWORD is in double quotes if it contains @\n' +
    '3. Open http://localhost:3001/health — smtpUser must match your mailbox\n' +
    '4. Stop the old email server, then run: npm run email-server\n' +
    '5. Test: npm run email-server:test'
  );
}

function isSmtpAuthError(message: string): boolean {
  return /smtp authentication|eauth|invalid smtp credentials|authentication failed/i.test(message);
}

function isSmtpConfigError(message: string): boolean {
  return /not configured|smtp credentials are missing|smtp_user|smtp_password/i.test(message);
}

function explainDeliveryError(message: string): Error {
  if (isSmtpAuthError(message)) {
    return new Error(isLocalPage() ? localSmtpAuthMessage() : hostedSmtpAuthMessage());
  }
  if (isSmtpConfigError(message)) {
    return new Error(
      isLocalPage()
        ? 'Email service not configured. Set SMTP_USER and SMTP_PASSWORD in .env, then restart the email server.'
        : hostedConfigMessage()
    );
  }
  return new Error(message || 'Failed to send email');
}

async function trySendViaNode(base: string, email: TransactionalEmail): Promise<NodeAttempt> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
  } catch {
    return { kind: 'unavailable' };
  }

  const text = await response.text();
  let data: { success?: boolean; error?: string; message?: string; messageId?: string } | null = null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      data = null;
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { kind: 'unavailable' };
  }

  const blob = `${data.error || ''} ${data.message || ''}`;
  const looksLikeEmailApi =
    typeof data.success === 'boolean' ||
    typeof data.messageId === 'string' ||
    /smtp|email|eauth/i.test(blob);

  if (!looksLikeEmailApi) {
    return { kind: 'unavailable' };
  }

  if (!response.ok || data.error || data.success === false) {
    if (response.status === 404 || response.status === 405) {
      return { kind: 'unavailable' };
    }
    const message = [data.error, data.message].filter(Boolean).join(': ');
    throw explainDeliveryError(message || `HTTP ${response.status}: Failed to send email`);
  }

  return { kind: 'sent', messageId: data.messageId };
}

async function sendViaSupabase(email: TransactionalEmail): Promise<{ messageId?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('Please log in again before sending email.');
  }

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: email,
  });

  if (error) {
    let message = error.message || 'Failed to send email';
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = (await context.json()) as { message?: string; error?: string };
        message = [body?.error, body?.message].filter(Boolean).join(': ') || message;
      } catch {
        // Response body was not JSON.
      }
    }

    if (/not found|404|failed to send a request to the edge function/i.test(message)) {
      throw new Error(
        'Edge Function not deployed yet.\n\n' +
          'The AWS site cannot start the local email server. Deploy the Supabase function:\n\n' +
          'npx supabase@latest functions deploy send-email\n\n' +
          'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL, and FROM_NAME as function secrets.'
      );
    }

    throw explainDeliveryError(message);
  }

  const payload = data as { success?: boolean; error?: string; message?: string; messageId?: string } | null;
  if (payload?.error || payload?.success === false) {
    throw explainDeliveryError(payload.message || payload.error || 'Failed to send email');
  }

  return { messageId: payload?.messageId };
}

/**
 * Sends one email.
 * Local dev uses the Node SMTP server.
 * The hosted app (AWS Amplify) uses same-origin /api when a server is actually there,
 * then the Supabase send-email function. It never calls the visitor's localhost.
 */
export async function sendTransactionalEmail(
  email: TransactionalEmail
): Promise<{ messageId?: string }> {
  if (isLocalPage()) {
    const attempt = await trySendViaNode(localApiBase(), email);
    if (attempt.kind === 'unavailable') {
      throw new Error(localServerDownMessage());
    }
    return { messageId: attempt.messageId };
  }

  const publicBase = configuredPublicBase();
  if (publicBase) {
    const attempt = await trySendViaNode(publicBase, email);
    if (attempt.kind === 'sent') return { messageId: attempt.messageId };
  } else if (typeof window !== 'undefined') {
    const attempt = await trySendViaNode(window.location.origin, email);
    if (attempt.kind === 'sent') return { messageId: attempt.messageId };
  }

  return sendViaSupabase(email);
}
