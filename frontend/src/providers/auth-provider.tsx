'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User, OrganizationInfo, OrganizationDetail } from '@/features/auth/models/auth.model';
import { authService } from '@/features/auth/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  organizations: OrganizationInfo[];
  currentOrg: OrganizationDetail | null;
  login: (email: string, password: string) => Promise<{ organizations?: OrganizationInfo[] }>;
  logout: () => Promise<void>;
  selectOrg: (organizationId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';
const ORG_ID_KEY = 'currentOrgId';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationDetail | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        scheduleRefresh(res.refreshToken, res.expiresIn);
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ORG_ID_KEY);
      }
    }, refreshMs);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedRefresh = localStorage.getItem(REFRESH_KEY);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    setToken(savedToken);
    const savedOrgId = localStorage.getItem(ORG_ID_KEY);
    const initAuth = async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
        if (savedRefresh) {
          scheduleRefresh(savedRefresh, 900);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ORG_ID_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setToken(response.accessToken);
    setUser(response.user);
    setOrganizations(response.organizations ?? []);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    if (response.organization) {
      setCurrentOrg(response.organization);
      localStorage.setItem(ORG_ID_KEY, String(response.organization.id));
    }
    scheduleRefresh(response.refreshToken, response.expiresIn);
    return { organizations: response.organizations };
  }, [scheduleRefresh]);

  const selectOrg = useCallback(async (organizationId: number) => {
    const response = await authService.selectOrg(organizationId);
    setToken(response.accessToken);
    setUser(response.user);
    setCurrentOrg(response.organization);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(ORG_ID_KEY, String(response.organization.id));
    scheduleRefresh(response.refreshToken, response.expiresIn);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors on logout
    }
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setCurrentOrg(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_ID_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        organizations,
        currentOrg,
        login,
        logout,
        selectOrg,
      }}
    >
      {children}
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