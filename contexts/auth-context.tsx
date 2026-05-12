'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  name: string;
  email?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('doguser');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser) as User);
        setToken(storedToken);
      }
    } catch {
      // ignore parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  function login(newUser: User, newToken: string) {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('doguser', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('doguser');
    localStorage.removeItem('token');
  }

  return (
    <AuthContext.Provider value={{ user, token, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
