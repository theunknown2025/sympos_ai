import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { SubscriptionRole } from '../types';
import { ViewState } from '../types';
import { getRoutePath } from '../routes';
import { getUserEventsForDashboard } from '../services/eventService';

export type OrganizerWorkspaceMode = 'choose' | 'focused' | 'full';

export interface OrganizerEventScopeState {
  mode: OrganizerWorkspaceMode;
  focusedEventId: string | null;
  focusedEventName: string | null;
}

const STORAGE_PREFIX = 'organizer_workspace_';

function loadPersistedState(
  userId: string | null,
  userRole: SubscriptionRole | null
): OrganizerEventScopeState {
  if (!userId || userRole !== 'Organizer') {
    return { mode: 'full', focusedEventId: null, focusedEventName: null };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) {
      return { mode: 'choose', focusedEventId: null, focusedEventName: null };
    }
    const parsed = JSON.parse(raw) as Partial<OrganizerEventScopeState>;
    if (parsed.mode === 'focused' && typeof parsed.focusedEventId === 'string') {
      return {
        mode: 'focused',
        focusedEventId: parsed.focusedEventId,
        focusedEventName:
          typeof parsed.focusedEventName === 'string' ? parsed.focusedEventName : null,
      };
    }
    if (parsed.mode === 'full') {
      return { mode: 'full', focusedEventId: null, focusedEventName: null };
    }
    return { mode: 'choose', focusedEventId: null, focusedEventName: null };
  } catch {
    return { mode: 'choose', focusedEventId: null, focusedEventName: null };
  }
}

function persistState(userId: string | null, userRole: SubscriptionRole | null, s: OrganizerEventScopeState) {
  if (!userId || userRole !== 'Organizer') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

interface OrganizerEventScopeContextValue {
  isOrganizerWorkspaceEnabled: boolean;
  mode: OrganizerWorkspaceMode;
  focusedEventId: string | null;
  focusedEventName: string | null;
  /** When set, tools should filter to this event only (hide "all events"). */
  scopedEventId: string | null;
  selectEventForFocus: (eventId: string, eventName: string) => void;
  enterFullWorkspace: () => void;
  returnToEventChooser: () => void;
}

const OrganizerEventScopeContext = createContext<OrganizerEventScopeContextValue | null>(null);

interface OrganizerEventScopeProviderProps {
  userId: string | null;
  userRole: SubscriptionRole | null;
  children: React.ReactNode;
}

export const OrganizerEventScopeProvider: React.FC<OrganizerEventScopeProviderProps> = ({
  userId,
  userRole,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOrganizerWorkspaceEnabled = userRole === 'Organizer';

  const [state, setState] = useState<OrganizerEventScopeState>(() =>
    loadPersistedState(userId, userRole)
  );

  useEffect(() => {
    setState(loadPersistedState(userId, userRole));
  }, [userId, userRole]);

  useEffect(() => {
    persistState(userId, userRole, state);
  }, [userId, userRole, state]);

  useEffect(() => {
    if (!isOrganizerWorkspaceEnabled || !userId) return;
    if (state.mode !== 'focused' || !state.focusedEventId) return;
    let cancelled = false;
    (async () => {
      try {
        const evs = await getUserEventsForDashboard(userId, userRole);
        if (cancelled) return;
        if (!evs.some((e) => e.id === state.focusedEventId)) {
          setState({ mode: 'choose', focusedEventId: null, focusedEventName: null });
          navigate(getRoutePath(ViewState.ORGANIZER_WORKSPACE), { replace: true });
        }
      } catch {
        /* keep state; network may be offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, userRole, isOrganizerWorkspaceEnabled, state.mode, state.focusedEventId, navigate]);

  useEffect(() => {
    if (!isOrganizerWorkspaceEnabled) return;
    if (state.mode !== 'choose') return;
    const workspacePath = getRoutePath(ViewState.ORGANIZER_WORKSPACE);
    const path = location.pathname.replace(/\/$/, '') || '/';
    if (path !== workspacePath && path !== '/') {
      navigate(workspacePath, { replace: true });
    }
  }, [isOrganizerWorkspaceEnabled, state.mode, location.pathname, navigate]);

  const selectEventForFocus = useCallback((eventId: string, eventName: string) => {
    flushSync(() => {
      setState({
        mode: 'focused',
        focusedEventId: eventId,
        focusedEventName: eventName,
      });
    });
    navigate(getRoutePath(ViewState.DASHBOARD), { replace: true });
  }, [navigate]);

  const enterFullWorkspace = useCallback(() => {
    flushSync(() => {
      setState({ mode: 'full', focusedEventId: null, focusedEventName: null });
    });
  }, []);

  const returnToEventChooser = useCallback(() => {
    flushSync(() => {
      setState({ mode: 'choose', focusedEventId: null, focusedEventName: null });
    });
    navigate(getRoutePath(ViewState.ORGANIZER_WORKSPACE), { replace: true });
  }, [navigate]);

  const scopedEventId = isOrganizerWorkspaceEnabled && state.mode === 'focused' ? state.focusedEventId : null;

  const value = useMemo<OrganizerEventScopeContextValue>(
    () => ({
      isOrganizerWorkspaceEnabled,
      mode: isOrganizerWorkspaceEnabled ? state.mode : 'full',
      focusedEventId: isOrganizerWorkspaceEnabled ? state.focusedEventId : null,
      focusedEventName: isOrganizerWorkspaceEnabled ? state.focusedEventName : null,
      scopedEventId,
      selectEventForFocus,
      enterFullWorkspace,
      returnToEventChooser,
    }),
    [
      isOrganizerWorkspaceEnabled,
      state.mode,
      state.focusedEventId,
      state.focusedEventName,
      scopedEventId,
      selectEventForFocus,
      enterFullWorkspace,
      returnToEventChooser,
    ]
  );

  return (
    <OrganizerEventScopeContext.Provider value={value}>{children}</OrganizerEventScopeContext.Provider>
  );
};

export function useOrganizerEventScope(): OrganizerEventScopeContextValue {
  const ctx = useContext(OrganizerEventScopeContext);
  if (!ctx) {
    throw new Error('useOrganizerEventScope must be used within OrganizerEventScopeProvider');
  }
  return ctx;
}

/** Safe when provider may not exist — returns no lock. */
export function useOrganizerScopedEventId(): string | null {
  const ctx = useContext(OrganizerEventScopeContext);
  return ctx?.scopedEventId ?? null;
}

/** True when the organizer must pick an event (hub only; sidebar hidden). */
export function useOrganizerChooserLayout(): boolean {
  const ctx = useContext(OrganizerEventScopeContext);
  if (!ctx) return false;
  return ctx.isOrganizerWorkspaceEnabled && ctx.mode === 'choose';
}
