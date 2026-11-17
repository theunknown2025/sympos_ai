import { supabase } from '../supabase';

const LOCAL_API = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

function isLocalPage(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function errorMessage(body: { message?: string; error?: string }, fallback: string): string {
  return body.message || body.error || fallback;
}

/**
 * Local dev uses the Node API. The Amplify site has no Node server, so it
 * calls the Supabase `superadmin-accounts` edge function instead.
 */
export async function callSuperAdminApi<T>(
  local: { path: string; method?: string; body?: unknown },
  action: Record<string, unknown>,
  fallback: string
): Promise<T> {
  if (isLocalPage()) {
    const headers = await authHeaders();
    let res: Response;
    try {
      res = await fetch(`${LOCAL_API}${local.path}`, {
        method: local.method || 'GET',
        headers,
        body: local.body !== undefined ? JSON.stringify(local.body) : undefined,
      });
    } catch {
      throw new Error('Account API is not running. Start it with npm run email-server.');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(errorMessage(body, fallback));
    return body as T;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not signed in');

  const { data, error } = await supabase.functions.invoke('superadmin-accounts', {
    body: action,
  });

  if (error) {
    let message = error.message || fallback;
    const context = (error as { context?: { json?: () => Promise<{ message?: string; error?: string }> } }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        message = errorMessage(body || {}, message);
      } catch {
        // Response body was not JSON.
      }
    }
    throw new Error(message);
  }

  const payload = (data || {}) as { error?: string; message?: string };
  if (payload.error) throw new Error(errorMessage(payload, fallback));
  return data as T;
}
