// Super Admin account management for the hosted Amplify site.
// Amplify cannot run the local Node API, so the browser calls this function instead.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function daysRemainingUntil(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  const end = new Date(isoDate).getTime();
  if (Number.isNaN(end)) return 0;
  const ms = end - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function resolveUserRole(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) {
  const meta = user?.user_metadata || {};
  const app = user?.app_metadata || {};
  const raw = String(meta.role || app.role || '').trim();
  if (raw === 'SuperAdmin' || raw === 'SubSuperAdmin' || raw === 'Organizer' || raw === 'Participant') {
    return raw;
  }
  if (meta.subscriptionType === 'entity') return 'Organizer';
  if (meta.subscriptionType === 'self') return 'Participant';
  return raw || 'Participant';
}

function matchesRoleFilter(accountRole: string, roleFilter: string) {
  if (!roleFilter) return true;
  if (roleFilter === 'SuperAdmin') {
    return accountRole === 'SuperAdmin' || accountRole === 'SubSuperAdmin';
  }
  if (roleFilter === 'Organizer') return accountRole === 'Organizer';
  if (roleFilter === 'Participant') return accountRole === 'Participant';
  return accountRole === roleFilter;
}

function mapAccountRow(user: Record<string, any>, subscription: Record<string, any> | null) {
  const role = resolveUserRole(user);
  const planCode = subscription?.plan_code || 'none';
  const subStatus = subscription?.status || null;
  const banned = !!(user.banned_until && new Date(user.banned_until) > new Date());

  let accountStatus = 'active';
  if (banned || subStatus === 'suspended') accountStatus = 'suspended';
  else if (subStatus === 'expired' || subStatus === 'unpaid') accountStatus = subStatus;
  else if (subStatus === 'trial') accountStatus = 'trial';
  else if (subStatus === 'pending_payment') accountStatus = 'pending_payment';
  else if (subStatus === 'active') accountStatus = 'active';
  else if (!subscription && role === 'Organizer') accountStatus = 'unpaid';

  const trialEndsAt = subscription?.trial_ends_at || subscription?.current_period_end || null;

  return {
    id: user.id,
    email: user.email || '',
    role,
    planCode,
    subscriptionStatus: subStatus,
    accountStatus,
    daysLeft: planCode === 'free' ? daysRemainingUntil(trialEndsAt) : null,
    trialEndsAt,
    banned,
    lastSignInAt: user.last_sign_in_at || null,
    createdAt: user.created_at || null,
    fullName: user.user_metadata?.fullName || user.user_metadata?.full_name || null,
  };
}

async function listAllAuthUsers(admin: SupabaseClient) {
  const users: Record<string, any>[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return users;
}

async function requireSuperAdmin(req: Request, admin: SupabaseClient) {
  const header = req.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Missing authorization token');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Invalid or expired session');

  const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
  if (role !== 'SuperAdmin') throw new HttpError(403, 'SuperAdmin access required');
  return data.user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Server configuration error' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const actor = await requireSuperAdmin(req, admin);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    if (action === 'list-accounts') {
      const users = await listAllAuthUsers(admin);
      const organizerIds = users.filter((u) => resolveUserRole(u) === 'Organizer').map((u) => u.id);
      let subByUser = new Map<string, Record<string, any>>();
      if (organizerIds.length > 0) {
        const { data: subs, error: subErr } = await admin
          .from('organizer_platform_subscriptions')
          .select('*')
          .in('organizer_user_id', organizerIds);
        if (subErr) throw subErr;
        subByUser = new Map((subs || []).map((s) => [s.organizer_user_id, s]));
      }
      const roleFilter = String(body?.role || '');
      const accounts = users
        .map((u) => mapAccountRow(u, subByUser.get(u.id) || null))
        .filter((a) => matchesRoleFilter(a.role, roleFilter))
        .sort((a, b) => String(a.email).localeCompare(String(b.email)));
      return json({ accounts, roleFilter: roleFilter || null });
    }

    if (action === 'suspend' || action === 'activate' || action === 'delete' || action === 'grant-pro') {
      const userId = String(body?.userId || '');
      if (!userId) return json({ error: 'userId required' }, 400);
      if ((action === 'suspend' || action === 'delete') && userId === actor.id) {
        return json({ error: 'Cannot change your own Super Admin account' }, 400);
      }

      const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !target?.user) return json({ error: 'User not found' }, 404);
      const targetRoleMeta = target.user.user_metadata?.role;
      if ((action === 'suspend' || action === 'delete') && targetRoleMeta === 'SuperAdmin') {
        return json({ error: 'Cannot change another Super Admin' }, 400);
      }

      if (action === 'delete') {
        const { error: delErr } = await admin.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;
        return json({ success: true, userId, deleted: true });
      }

      if (action === 'suspend') {
        await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
        if (targetRoleMeta === 'Organizer') {
          const { data: existing } = await admin
            .from('organizer_platform_subscriptions')
            .select('*')
            .eq('organizer_user_id', userId)
            .maybeSingle();
          if (existing) {
            await admin.from('organizer_platform_subscriptions').update({ status: 'suspended' }).eq('organizer_user_id', userId);
          } else {
            await admin.from('organizer_platform_subscriptions').insert({
              organizer_user_id: userId,
              plan_code: 'none',
              status: 'suspended',
            });
          }
        }
        return json({ success: true, userId, accountStatus: 'suspended' });
      }

      if (action === 'activate') {
        await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
        if (targetRoleMeta === 'Organizer') {
          const { data: existing } = await admin
            .from('organizer_platform_subscriptions')
            .select('*')
            .eq('organizer_user_id', userId)
            .maybeSingle();
          if (existing?.status === 'suspended') {
            let nextStatus = 'active';
            if (existing.plan_code === 'free') {
              const left = daysRemainingUntil(existing.trial_ends_at || existing.current_period_end);
              nextStatus = left > 0 ? 'trial' : 'expired';
            } else if (existing.plan_code === 'none') {
              nextStatus = 'unpaid';
            } else if (existing.plan_code === 'pro') {
              nextStatus = existing.status === 'pending_payment' ? 'pending_payment' : 'active';
            }
            await admin.from('organizer_platform_subscriptions').update({ status: nextStatus }).eq('organizer_user_id', userId);
          }
        }
        return json({ success: true, userId, accountStatus: 'active' });
      }

      const role = resolveUserRole(target.user);
      if (role !== 'Organizer') return json({ error: 'Only organizer accounts can be granted Pro' }, 400);

      let eventsCount = Math.floor(Number(body?.eventsCount));
      if (!Number.isFinite(eventsCount)) eventsCount = 1;
      eventsCount = Math.min(50, Math.max(1, eventsCount));

      const { data: existing, error: subReadErr } = await admin
        .from('organizer_platform_subscriptions')
        .select('plan_code, status')
        .eq('organizer_user_id', userId)
        .maybeSingle();
      if (subReadErr) throw subReadErr;
      if (existing?.plan_code === 'pro' && existing?.status === 'active') {
        return json({ error: 'This account is already Pro' }, 409);
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      const email = String(target.user.email || '').trim().toLowerCase();
      const fullName = target.user.user_metadata?.fullName || target.user.user_metadata?.full_name || email || 'Organizer';

      const { error: orderErr } = await admin.from('organizer_pro_orders').insert({
        organizer_user_id: userId,
        offer_code: eventsCount >= 2 ? 'multi_events' : 'single_event',
        full_name: String(fullName).trim() || 'Organizer',
        account_email: email || 'unknown@local',
        events_count: eventsCount,
        editions_count: 0,
        price_per_event_mad: 0,
        price_per_edition_mad: 0,
        amount_ht_mad: 0,
        tva_rate: 0,
        amount_ttc_mad: 0,
        currency: 'MAD',
        status: 'approved',
        proof_file_urls: [],
        proof_file_names: [],
        organizer_notes: null,
        admin_notes: 'Manual Pro grant by Super Admin (no payment).',
        reviewed_by: actor.id,
        reviewed_at: now.toISOString(),
      });
      if (orderErr) throw orderErr;

      const { error: subErr } = await admin.from('organizer_platform_subscriptions').upsert({
        organizer_user_id: userId,
        plan_code: 'pro',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_started_at: null,
        trial_ends_at: null,
      });
      if (subErr) throw subErr;

      try {
        await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      } catch {
        /* ignore */
      }
      return json({ success: true, userId, planCode: 'pro', accountStatus: 'active', eventsCount });
    }

    if (action === 'list-orders') {
      const statusFilter = typeof body?.status === 'string' ? body.status : '';
      let q = admin.from('organizer_pro_orders').select('*').order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return json({ orders: data || [] });
    }

    if (action === 'approve-order' || action === 'reject-order') {
      const orderId = String(body?.orderId || '');
      if (!orderId) return json({ error: 'orderId required' }, 400);
      const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes : null;
      const { data: order, error: getErr } = await admin
        .from('organizer_pro_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (getErr) throw getErr;
      if (!order) return json({ error: 'Order not found' }, 404);

      const nextStatus = action === 'approve-order' ? 'approved' : 'rejected';
      const { error: updErr } = await admin
        .from('organizer_pro_orders')
        .update({
          status: nextStatus,
          admin_notes: adminNotes,
          reviewed_by: actor.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (updErr) throw updErr;

      if (action === 'approve-order') {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        await admin.from('organizer_platform_subscriptions').upsert({
          organizer_user_id: order.organizer_user_id,
          plan_code: 'pro',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_started_at: null,
          trial_ends_at: null,
        });
        try {
          await admin.auth.admin.updateUserById(order.organizer_user_id, { ban_duration: 'none' });
        } catch {
          /* ignore */
        }
        return json({ success: true, orderId, status: 'approved' });
      }

      const { data: otherApproved, error: otherErr } = await admin
        .from('organizer_pro_orders')
        .select('id')
        .eq('organizer_user_id', order.organizer_user_id)
        .eq('status', 'approved')
        .neq('id', orderId)
        .limit(1);
      if (otherErr) throw otherErr;

      if (otherApproved?.length) {
        await admin.from('organizer_platform_subscriptions').upsert({
          organizer_user_id: order.organizer_user_id,
          plan_code: 'pro',
          status: 'active',
        });
      } else {
        await admin.from('organizer_platform_subscriptions').upsert({
          organizer_user_id: order.organizer_user_id,
          plan_code: 'none',
          status: 'unpaid',
        });
      }
      return json({ success: true, orderId, status: 'rejected' });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('superadmin-accounts:', message);
    return json({ error: message, message }, status);
  }
});
