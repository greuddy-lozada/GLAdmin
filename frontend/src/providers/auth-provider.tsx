'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User, OrganizationInfo, OrganizationDetail } from '@/features/auth/models/auth.model';
import { authService } from '@/features/auth/services/auth.service';
import { localDb } from '@/lib/sync/db';
import { networkStatus } from '@/lib/sync/network-status';
import { syncEngine } from '@/lib/sync/sync-engine';
import { PinSetup } from '@/features/auth/components/pin-setup';
import { PinUnlock } from '@/features/auth/components/pin-unlock';
import { useTabsStore } from '@/stores/tabs-store';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  organizations: OrganizationInfo[];
  currentOrg: OrganizationDetail | null;
  /** Org membership role slug (falls back to global user.role). */
  effectiveRoleSlug: string;
  login: (email: string, password: string) => Promise<{ organizations?: OrganizationInfo[] }>;
  logout: () => Promise<void>;
  selectOrg: (organizationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';
const ORG_ID_KEY = 'currentOrgId';
const ORG_DETAIL_KEY = 'currentOrg';

function readStoredOrg(): OrganizationDetail | null {
  try {
    const raw = localStorage.getItem(ORG_DETAIL_KEY);
    return raw ? (JSON.parse(raw) as OrganizationDetail) : null;
  } catch {
    return null;
  }
}

function persistOrg(org: OrganizationDetail) {
  localStorage.setItem(ORG_ID_KEY, String(org.id));
  localStorage.setItem(ORG_DETAIL_KEY, JSON.stringify(org));
}

function clearSessionStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORG_ID_KEY);
  localStorage.removeItem(ORG_DETAIL_KEY);
}

/** True when the server rejected credentials (do not keep a soft offline session). */
function isAuthRejected(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 401 || status === 403;
}

/** Network / unreachable — keep local session for POS. */
function isLikelyOfflineFailure(error: unknown): boolean {
  if (!networkStatus.isOnline) return true;
  if (!error || typeof error !== 'object') return true;
  const e = error as { code?: string; response?: unknown };
  if (e.response) return false;
  return (
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ECONNREFUSED' ||
    e.code === 'ETIMEDOUT' ||
    !e.code
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationDetail | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshTimer = useRef<((rt: string, ei: number) => void) | null>(null);

  const resumeOfflineSession = useCallback(async (markOffline = true): Promise<boolean> => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedUser) return false;
    try {
      const parsed = JSON.parse(savedUser) as User;
      const org = readStoredOrg();
      setUser(parsed);
      if (org) setCurrentOrg(org);
      if (markOffline) {
        networkStatus.setOnline(false);
      }

      const pinStored = await localDb.syncMetadata.get(`pin_${parsed.id}`);
      if (pinStored) {
        setShowPinUnlock(true);
      }

      const orgId = localStorage.getItem(ORG_ID_KEY);
      if (orgId) {
        syncEngine.start();
      }
      return true;
    } catch {
      console.warn('Failed to parse saved user for offline resume');
      return false;
    }
  }, []);

  const scheduleRefresh = useCallback((refreshToken: string, expiresIn: number) => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    const refreshMs = (expiresIn - 60) * 1000;
    if (refreshMs <= 0) return;
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await authService.refresh(refreshToken);
        setToken(res.accessToken);
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_KEY, res.refreshToken);
        refreshTimer.current?.(res.refreshToken, res.expiresIn);
      } catch (error) {
        if (!isAuthRejected(error)) {
          const resumed = await resumeOfflineSession(isLikelyOfflineFailure(error));
          if (resumed) return;
        }
        setToken(null);
        setUser(null);
        setCurrentOrg(null);
        clearSessionStorage();
      }
    }, refreshMs);
  }, [resumeOfflineSession]);

  useEffect(() => {
    refreshTimer.current = scheduleRefresh;
  }, [scheduleRefresh]);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    setToken(savedToken);
    networkStatus.start();
    const savedOrg = readStoredOrg();
    if (savedOrg) setCurrentOrg(savedOrg);
    const savedOrgId = localStorage.getItem(ORG_ID_KEY);

    const initAuth = async () => {
      try {
        const me = await authService.getMe();
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        if (savedRefresh) {
          scheduleRefresh(savedRefresh, 900);
        }
        if (savedOrgId) {
          syncEngine.start();
        }
      } catch (error) {
        if (!isAuthRejected(error)) {
          const resumed = await resumeOfflineSession(isLikelyOfflineFailure(error));
          if (resumed) {
            setIsLoading(false);
            return;
          }
        }
        setToken(null);
        setUser(null);
        setCurrentOrg(null);
        clearSessionStorage();
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [scheduleRefresh, resumeOfflineSession]);

  const login = useCallback(async (email: string, password: string) => {
    useTabsStore.getState().clearTabs();
    const response = await authService.login({ email, password });
    setToken(response.accessToken);
    setUser(response.user);
    setOrganizations(response.organizations ?? []);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    if (response.organization) {
      setCurrentOrg(response.organization);
      persistOrg(response.organization);
    }
    scheduleRefresh(response.refreshToken, response.expiresIn);
    networkStatus.start();
    syncEngine.start();
    const pinStored = await localDb.syncMetadata.get(`pin_${response.user.id}`);
    if (!pinStored) {
      setShowPinSetup(true);
    }
    return { organizations: response.organizations };
  }, [scheduleRefresh]);

  const selectOrg = useCallback(async (organizationId: string) => {
    const response = await authService.selectOrg(organizationId);
    setToken(response.accessToken);
    setUser(response.user);
    setCurrentOrg(response.organization);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    persistOrg(response.organization);
    scheduleRefresh(response.refreshToken, response.expiresIn);
    syncEngine.onOrgSwitch();
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    }
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    syncEngine.stop();
    networkStatus.stop();
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setCurrentOrg(null);
    clearSessionStorage();
    useTabsStore.getState().clearTabs();
  }, []);

  const handlePinUnlock = useCallback(() => {
    setShowPinUnlock(false);
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (orgId) {
      syncEngine.start();
      if (networkStatus.isOnline) {
        void syncEngine.forceSync();
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        organizations,
        currentOrg,
        effectiveRoleSlug: user?.role?.slug ?? 'employee',
        login,
        logout,
        selectOrg,
      }}
    >
      {children}
      {showPinSetup && user && (
        <PinSetup
          userId={user.id}
          onComplete={() => setShowPinSetup(false)}
        />
      )}
      {showPinUnlock && user && (
        <PinUnlock
          userId={user.id}
          onUnlock={handlePinUnlock}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
