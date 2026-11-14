import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activateSuperAdminAccount,
  deleteSuperAdminAccount,
  fetchSuperAdminAccounts,
  matchesAccountTabRole,
  SuperAdminAccountRow,
  suspendSuperAdminAccount,
} from '../../../../services/superAdminAccountService';
import type { AccountPendingAction } from './accountStatusStyles';

export type AccountsTabRole = 'Organizer' | 'Participant' | 'SuperAdmin';

export function useAccountsTab(role: AccountsTabRole) {
  const [accounts, setAccounts] = useState<SuperAdminAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingById, setPendingById] = useState<Record<string, AccountPendingAction>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSuperAdminAccounts(role);
      setAccounts(rows.filter((a) => matchesAccountTabRole(a.role, role)));
      setPendingById({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const byRole = accounts.filter((a) => matchesAccountTabRole(a.role, role));
    const q = query.trim().toLowerCase();
    if (!q) return byRole;
    return byRole.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.fullName || '').toLowerCase().includes(q) ||
        a.planCode.toLowerCase().includes(q) ||
        a.accountStatus.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [accounts, query, role]);

  // Only one pending confirmation at a time
  const setPending = (id: string, action: AccountPendingAction) => {
    setPendingById(() => {
      if (!action) return {};
      return { [id]: action };
    });
  };

  const confirmPending = async (id: string) => {
    const action = pendingById[id];
    if (!action) return;
    setBusyId(id);
    setError(null);
    try {
      if (action === 'suspend') await suspendSuperAdminAccount(id);
      else await deleteSuperAdminAccount(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      setPending(id, null);
    } finally {
      setBusyId(null);
    }
  };

  const activate = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await activateSuperAdminAccount(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activate failed');
    } finally {
      setBusyId(null);
    }
  };

  return {
    accounts: filtered,
    loading,
    error,
    setError,
    query,
    setQuery,
    busyId,
    pendingById,
    setPending,
    confirmPending,
    activate,
    load,
  };
}
