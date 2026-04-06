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
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = authService.getSession();
      if (!stored) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }
      const validated = await authService.validateSession();
      if (!cancelled) {
        setUser(validated);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success) setUser(result.user);
    return result.success ? { success: true as const } : { success: false, error: result.error };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);
    if (result.success) setUser(result.user);
    return result.success ? { success: true as const } : { success: false, error: result.error };
  }, []);

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
