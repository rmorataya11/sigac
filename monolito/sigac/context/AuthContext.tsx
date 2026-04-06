'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { SessionUser } from '@/lib/types';
import { authService } from '@/lib/services/auth';

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => { success: true } | { success: false; error: string };
  register: (
    name: string,
    email: string,
    password: string,
    role: 'ADMIN' | 'COLABORADOR'
  ) => { success: true } | { success: false; error: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(authService.getSession());
    setReady(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = authService.login(email, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string, role: 'ADMIN' | 'COLABORADOR') => {
      const result = authService.register(name, email, password, role);
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
