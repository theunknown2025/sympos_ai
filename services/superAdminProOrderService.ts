import { callSuperAdminApi } from './superAdminRemote';

export async function fetchSuperAdminProOrders(status?: string): Promise<unknown[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const body = await callSuperAdminApi<{ orders?: unknown[] }>(
    { path: `/api/superadmin/pro-orders${qs}` },
    { action: 'list-orders', status: status || '' },
    'Failed to load pro orders'
  );
  return body.orders || [];
}

export async function approveSuperAdminProOrder(
  orderId: string,
  adminNotes?: string
): Promise<void> {
  await callSuperAdminApi(
    {
      path: `/api/superadmin/pro-orders/${orderId}/approve`,
      method: 'POST',
      body: { adminNotes: adminNotes || null },
    },
    { action: 'approve-order', orderId, adminNotes: adminNotes || null },
    'Approve failed'
  );
}

export async function rejectSuperAdminProOrder(
  orderId: string,
  adminNotes?: string
): Promise<void> {
  await callSuperAdminApi(
    {
      path: `/api/superadmin/pro-orders/${orderId}/reject`,
      method: 'POST',
      body: { adminNotes: adminNotes || null },
    },
    { action: 'reject-order', orderId, adminNotes: adminNotes || null },
    'Reject failed'
  );
}
