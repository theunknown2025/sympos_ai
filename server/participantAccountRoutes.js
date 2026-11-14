/**
 * Participant account provisioning routes (requires SUPABASE_SERVICE_ROLE_KEY in .env)
 */
import { createClient } from '@supabase/supabase-js';

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Participant', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function getAdminClient(readEnv) {
  const url = readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env (required for participant account creation).'
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveExistingEmails(admin, emails) {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return new Set();

  const existing = new Set();

  const { data: rpcRows, error: rpcError } = await admin.rpc('auth_emails_existing', {
    email_list: normalized,
  });

  if (!rpcError && Array.isArray(rpcRows)) {
    rpcRows.forEach((row) => {
      const email = typeof row === 'string' ? row : row?.email;
      if (email) existing.add(String(email).toLowerCase());
    });
  } else if (rpcError) {
    console.warn('auth_emails_existing RPC unavailable:', rpcError.message);
  }

  for (const table of ['jury_members', 'participant_profiles']) {
    const { data: rows } = await admin.from(table).select('email').in('email', normalized);
    rows?.forEach((row) => {
      const email = row.email?.trim().toLowerCase();
      if (email) existing.add(email);
    });
  }

  return existing;
}

async function ensureParticipantRecords(admin, userId, email, fullName) {
  const { firstName, lastName } = splitFullName(fullName);
  const lowerEmail = email.trim().toLowerCase();

  const { data: existingJury } = await admin
    .from('jury_members')
    .select('id, user_id')
    .eq('email', lowerEmail)
    .maybeSingle();

  if (existingJury) {
    if (!existingJury.user_id && userId) {
      await admin.from('jury_members').update({ user_id: userId }).eq('id', existingJury.id);
    }
  } else {
    await admin.from('jury_members').insert({
      user_id: userId,
      email: lowerEmail,
      first_name: firstName,
      last_name: lastName || 'Participant',
      profile_completed: false,
    });
  }

  const { data: existingProfile } = await admin
    .from('participant_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingProfile) {
    await admin.from('participant_profiles').insert({
      user_id: userId,
      full_name: fullName.trim(),
      email: lowerEmail,
      websites: '[]',
      links: '[]',
      other_links: '[]',
    });
  }
}

export function registerParticipantAccountRoutes(app, { readEnv }) {
  app.post('/api/participant-accounts/check-emails', async (req, res) => {
    try {
      const { emails } = req.body;
      if (!Array.isArray(emails)) {
        return res.status(400).json({ error: 'emails must be an array' });
      }

      const admin = getAdminClient(readEnv);
      const normalized = emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
      const existingSet = await resolveExistingEmails(admin, normalized);

      const existing = normalized.filter((e) => existingSet.has(e));
      const missing = normalized.filter((e) => !existingSet.has(e));

      res.json({ existing, missing });
    } catch (error) {
      console.error('check-emails error:', error);
      res.status(500).json({
        error: 'Failed to check emails',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.post('/api/participant-accounts/create', async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
      if (!fullName?.trim() || !email?.trim() || !password) {
        return res.status(400).json({
          error: 'Missing fields',
          message: 'fullName, email, and password are required',
        });
      }

      const admin = getAdminClient(readEnv);
      const lowerEmail = email.trim().toLowerCase();
      const existingSet = await resolveExistingEmails(admin, [lowerEmail]);

      if (existingSet.has(lowerEmail)) {
        return res.status(409).json({
          error: 'Account exists',
          message: 'An account with this email already exists',
          created: false,
        });
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: lowerEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'Participant',
          fullName: fullName.trim(),
          subscriptionType: 'self',
        },
      });

      if (createError) {
        throw createError;
      }

      const userId = created.user?.id;
      if (!userId) {
        throw new Error('User created but no id returned');
      }

      await ensureParticipantRecords(admin, userId, lowerEmail, fullName.trim());

      res.json({
        success: true,
        created: true,
        userId,
        email: lowerEmail,
      });
    } catch (error) {
      console.error('create participant error:', error);
      res.status(500).json({
        error: 'Failed to create participant account',
        message: error.message || 'Unexpected error',
        created: false,
      });
    }
  });
}
