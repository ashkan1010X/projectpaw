'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface User {
  name: string;
  email?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateName: (name: string) => void;
  refreshSession: () => Promise<string | null>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (exp === null) return true;
  return Date.now() >= exp - 60_000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Refs so fetchWithAuth always has the latest values without stale closures
  const tokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function storeTokens(access: string, refresh: string) {
    tokenRef.current = access;
    refreshTokenRef.current = refresh;
    setToken(access);
    localStorage.setItem('token', access);
    localStorage.setItem('refreshToken', refresh);
    scheduleProactiveRefresh(access);
  }

  function scheduleProactiveRefresh(access: string) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const exp = getTokenExpiry(access);
    if (!exp) return;
    const delay = exp - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) return; // already past the buffer — let the 401-retry handle it
    refreshTimerRef.current = setTimeout(() => {
      void doRefresh();
    }, delay);
  }

  async function doRefresh(): Promise<string | null> {
    const rt = refreshTokenRef.current;
    if (!rt) return null;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { token: string; refreshToken: string };
      storeTokens(data.token, data.refreshToken);
      return data.token;
    } catch {
      return null;
    }
  }

  // Exposed so booking modal / other callers can trigger refresh directly
  const refreshSession = useCallback(async (): Promise<string | null> => {
    return doRefresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Universal authenticated fetch — handles 401 + refresh + retry automatically
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = tokenRef.current;

      const headersWithAuth = {
        ...(options.headers ?? {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      };

      let res = await fetch(url, { ...options, headers: headersWithAuth });

      if (res.status === 401) {
        const newToken = await doRefresh();
        if (!newToken) {
          // Refresh failed — clear session and redirect to login
          tokenRef.current = null;
          refreshTokenRef.current = null;
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('doguser');
          window.location.href = '/login';
          throw new Error('Session expired. Redirecting to login…');
        }
        res = await fetch(url, {
          ...options,
          headers: { ...(options.headers ?? {}), Authorization: `Bearer ${newToken}` },
        });
      }

      return res;
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Boot: restore session + auto-refresh if expired
  useEffect(() => {
    async function init() {
      try {
        const storedUser = localStorage.getItem('doguser');
        const storedToken = localStorage.getItem('token');
        const storedRefresh = localStorage.getItem('refreshToken');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser) as User;
          refreshTokenRef.current = storedRefresh;

          if (storedRefresh && isTokenExpired(storedToken)) {
            tokenRef.current = storedToken; // needed by doRefresh to set new value
            refreshTokenRef.current = storedRefresh;
            const newToken = await doRefresh();
            if (newToken) setUser(parsedUser);
          } else {
            tokenRef.current = storedToken;
            setToken(storedToken);
            setUser(parsedUser);
            scheduleProactiveRefresh(storedToken);
          }
        }
      } catch {
        // ignore parse errors
      } finally {
        setInitialized(true);
      }
    }
    void init();

    // Tab sync: when another tab logs out or refreshes the token, mirror here
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Another tab logged out
          tokenRef.current = null;
          refreshTokenRef.current = null;
          setUser(null);
          setToken(null);
        } else if (e.newValue !== tokenRef.current) {
          // Another tab refreshed the token
          tokenRef.current = e.newValue;
          setToken(e.newValue);
          scheduleProactiveRefresh(e.newValue);
        }
      }
      if (e.key === 'doguser' && !e.newValue) {
        setUser(null);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function login(newUser: User, newToken: string, newRefreshToken: string) {
    setUser(newUser);
    refreshTokenRef.current = newRefreshToken;
    storeTokens(newToken, newRefreshToken);
    localStorage.setItem('doguser', JSON.stringify(newUser));
  }

  function logout() {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    setToken(null);
    localStorage.removeItem('doguser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Per-browser onboarding flags belong to the previous user. Clearing
    // them lets the next person who logs in on this browser see their own
    // welcome moment if they're new.
    localStorage.removeItem('projectpaw:onboarding-celebrated');
  }

  function updateName(name: string) {
    if (!user) return;
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem('doguser', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider
      value={{ user, token, initialized, login, logout, updateName, refreshSession, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
