'use client';

import type { Role, SessionUser } from '@/lib/types';
import { apiGet, apiPostPublic } from '@/lib/api-client';

const SESSION_KEY = 'sigac_session';

type ApiPublicUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

type AuthResponse = {
  access_token: string;
  user: ApiPublicUser;
};

function toSessionUser(u: ApiPublicUser): SessionUser {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: u.role,
  };
}

function readStored(): { token: string; user: SessionUser } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { token?: string; user?: SessionUser };
    if (typeof parsed.token === 'string' && parsed.user?.id) {
      return { token: parsed.token, user: parsed.user };
    }
  } catch {
    // ignore
  }
  return null;
}

function persistSession(token: string, user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: true; user: SessionUser } | { success: false; error: string }> {
    try {
      const data = await apiPostPublic<AuthResponse>('/auth/register', {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const user = toSessionUser(data.user);
      persistSession(data.access_token, user);
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'No se pudo registrar.' };
    }
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ success: true; user: SessionUser } | { success: false; error: string }> {
    try {
      const data = await apiPostPublic<AuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const user = toSessionUser(data.user);
      persistSession(data.access_token, user);
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'No se pudo iniciar sesión.' };
    }
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): SessionUser | null {
    return readStored()?.user ?? null;
  },

  /** Valida el JWT con GET /auth/me y actualiza el usuario en almacenamiento. */
  async validateSession(): Promise<SessionUser | null> {
    const stored = readStored();
    if (!stored) return null;
    try {
      const me = await apiGet<ApiPublicUser>('/auth/me');
      const user = toSessionUser(me);
      persistSession(stored.token, user);
      return user;
    } catch {
      this.logout();
      return null;
    }
  },
};
