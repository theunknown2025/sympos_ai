/**
 * Super Admin account management (requires SUPABASE_SERVICE_ROLE_KEY).
 * Caller must send Authorization: Bearer <access_token> of a SuperAdmin user.
 */
import { createClient } from '@supabase/supabase-js';

function getAdminClient(readEnv) {
  const url = readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function daysRemainingUntil(isoDate) {
  if (!isoDate) return 0;
  const end = new Date(isoDate).getTime();
  if (Number.isNaN(end)) return 0;
  const ms = end - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function requireSuperAdmin(req, admin) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid or expired session');
    err.status = 401;
    throw err;
  }

  const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
  if (role !== 'SuperAdmin') {
    const err = new Error('SuperAdmin access required');
    err.status = 403;
    throw err;
  }

  return data.user;
}

async function listAllAuthUsers(admin) {
  const users = [];
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

function resolveUserRole(user) {
  const meta = user?.user_metadata || {};
  const app = user?.app_metadata || {};
  const raw = meta.role || app.role || '';
  const normalized = String(raw).trim();
  if (normalized === 'SuperAdmin' || normalized === 'SubSuperAdmin') return normalized;
  if (normalized === 'Organizer' || normalized === 'Participant') return normalized;
  // Fallback from signup subscriptionType
  if (meta.subscriptionType === 'entity') return 'Organizer';
  if (meta.subscriptionType === 'self') return 'Participant';
  return normalized || 'Participant';
}

function matchesRoleFilter(accountRole, roleFilter) {
  if (!roleFilter) return true;
  if (roleFilter === 'SuperAdmin') {
    return accountRole === 'SuperAdmin' || accountRole === 'SubSuperAdmin';
  }
  if (roleFilter === 'Organizer') return accountRole === 'Organizer';
  if (roleFilter === 'Participant') return accountRole === 'Participant';
  return accountRole === roleFilter;
}

function mapAccountRow(user, subscription) {
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
  const daysLeft = planCode === 'free' ? daysRemainingUntil(trialEndsAt) : 0;

  return {
    id: user.id,
    email: user.email || '',
    role,
    planCode,
    subscriptionStatus: subStatus,
    accountStatus,
    daysLeft: planCode === 'free' ? daysLeft : null,
    trialEndsAt,
    banned,
    lastSignInAt: user.last_sign_in_at || null,
    createdAt: user.created_at || null,
    fullName: user.user_metadata?.fullName || user.user_metadata?.full_name || null,
  };
}

export function registerSuperAdminAccountRoutes(app, { readEnv }) {
  app.get('/api/superadmin/accounts', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      await requireSuperAdmin(req, admin);

      const users = await listAllAuthUsers(admin);
      const organizerIds = users
        .filter((u) => resolveUserRole(u) === 'Organizer')
        .map((u) => u.id);

      let subByUser = new Map();
      if (organizerIds.length > 0) {
        const { data: subs, error: subErr } = await admin
          .from('organizer_platform_subscriptions')
          .select('*')
          .in('organizer_user_id', organizerIds);
        if (subErr) throw subErr;
        subByUser = new Map((subs || []).map((s) => [s.organizer_user_id, s]));
      }

      const rawRole = req.query?.role;
      const roleFilter = Array.isArray(rawRole) ? String(rawRole[0] || '') : String(rawRole || '');
      const accounts = users
        .map((u) => mapAccountRow(u, subByUser.get(u.id) || null))
        .filter((a) => matchesRoleFilter(a.role, roleFilter))
        .sort((a, b) => String(a.email).localeCompare(String(b.email)));

      res.json({ accounts, roleFilter: roleFilter || null });
    } catch (error) {
      console.error('superadmin list accounts:', error);
      res.status(error.status || 500).json({
        error: 'Failed to list accounts',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.post('/api/superadmin/accounts/:userId/suspend', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      const actor = await requireSuperAdmin(req, admin);
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (userId === actor.id) {
        return res.status(400).json({ error: 'Cannot suspend your own Super Admin account' });
      }

      const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !target?.user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (target.user.user_metadata?.role === 'SuperAdmin') {
        return res.status(400).json({ error: 'Cannot suspend another Super Admin' });
      }

      await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });

      const role = target.user.user_metadata?.role;
      if (role === 'Organizer') {
        const { data: existing } = await admin
          .from('organizer_platform_subscriptions')
          .select('*')
          .eq('organizer_user_id', userId)
          .maybeSingle();

        if (existing) {
          await admin
            .from('organizer_platform_subscriptions')
            .update({ status: 'suspended' })
            .eq('organizer_user_id', userId);
        } else {
          await admin.from('organizer_platform_subscriptions').insert({
            organizer_user_id: userId,
            plan_code: 'none',
            status: 'suspended',
          });
        }
      }

      res.json({ success: true, userId, accountStatus: 'suspended' });
    } catch (error) {
      console.error('superadmin suspend:', error);
      res.status(error.status || 500).json({
        error: 'Failed to suspend account',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.post('/api/superadmin/accounts/:userId/activate', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      await requireSuperAdmin(req, admin);
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !target?.user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });

      const role = target.user.user_metadata?.role;
      if (role === 'Organizer') {
        const { data: existing } = await admin
          .from('organizer_platform_subscriptions')
          .select('*')
          .eq('organizer_user_id', userId)
          .maybeSingle();

        if (existing) {
          let nextStatus = 'active';
          if (existing.plan_code === 'free') {
            const left = daysRemainingUntil(existing.trial_ends_at || existing.current_period_end);
            nextStatus = left > 0 ? 'trial' : 'expired';
          } else if (existing.plan_code === 'none') {
            nextStatus = 'unpaid';
          } else if (existing.plan_code === 'pro') {
            nextStatus = existing.status === 'pending_payment' ? 'pending_payment' : 'active';
          }
          // If was suspended, restore based on plan
          if (existing.status === 'suspended') {
            await admin
              .from('organizer_platform_subscriptions')
              .update({ status: nextStatus })
              .eq('organizer_user_id', userId);
          }
        }
      }

      res.json({ success: true, userId, accountStatus: 'active' });
    } catch (error) {
      console.error('superadmin activate:', error);
      res.status(error.status || 500).json({
        error: 'Failed to activate account',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.delete('/api/superadmin/accounts/:userId', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      const actor = await requireSuperAdmin(req, admin);
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (userId === actor.id) {
        return res.status(400).json({ error: 'Cannot delete your own Super Admin account' });
      }

      const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !target?.user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (target.user.user_metadata?.role === 'SuperAdmin') {
        return res.status(400).json({ error: 'Cannot delete another Super Admin' });
      }

      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) throw delErr;

      res.json({ success: true, userId, deleted: true });
    } catch (error) {
      console.error('superadmin delete:', error);
      res.status(error.status || 500).json({
        error: 'Failed to delete account',
        message: error.message || 'Unexpected error',
      });
    }
  });

  // —— Pro payment orders ——
  app.get('/api/superadmin/pro-orders', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      await requireSuperAdmin(req, admin);

      const statusFilter = typeof req.query.status === 'string' ? req.query.status : '';
      let q = admin
        .from('organizer_pro_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);

      const { data, error } = await q;
      if (error) throw error;
      res.json({ orders: data || [] });
    } catch (error) {
      console.error('superadmin list pro orders:', error);
      res.status(error.status || 500).json({
        error: 'Failed to list pro orders',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.post('/api/superadmin/pro-orders/:orderId/approve', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      const actor = await requireSuperAdmin(req, admin);
      const { orderId } = req.params;
      const adminNotes = typeof req.body?.adminNotes === 'string' ? req.body.adminNotes : null;

      const { data: order, error: getErr } = await admin
        .from('organizer_pro_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (getErr) throw getErr;
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const { error: updErr } = await admin
        .from('organizer_pro_orders')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_by: actor.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (updErr) throw updErr;

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

      // Unban if previously suspended
      try {
        await admin.auth.admin.updateUserById(order.organizer_user_id, { ban_duration: 'none' });
      } catch {
        /* ignore */
      }

      res.json({ success: true, orderId, status: 'approved' });
    } catch (error) {
      console.error('superadmin approve pro order:', error);
      res.status(error.status || 500).json({
        error: 'Failed to approve pro order',
        message: error.message || 'Unexpected error',
      });
    }
  });

  app.post('/api/superadmin/pro-orders/:orderId/reject', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      const actor = await requireSuperAdmin(req, admin);
      const { orderId } = req.params;
      const adminNotes = typeof req.body?.adminNotes === 'string' ? req.body.adminNotes : null;

      const { data: order, error: getErr } = await admin
        .from('organizer_pro_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (getErr) throw getErr;
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const { error: updErr } = await admin
        .from('organizer_pro_orders')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_by: actor.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (updErr) throw updErr;

      // A rejected upgrade must not wipe an older approved pack.
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

      res.json({ success: true, orderId, status: 'rejected' });
    } catch (error) {
      console.error('superadmin reject pro order:', error);
      res.status(error.status || 500).json({
        error: 'Failed to reject pro order',
        message: error.message || 'Unexpected error',
      });
    }
  });
}
