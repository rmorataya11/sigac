'use client';

import type { SessionUser, User, Role } from '@/lib/types';
import { store } from '@/lib/store';

function nextId(list: { id: string }[]): string {
  const nums = list.map((x) => parseInt(x.id, 10)).filter((n) => !Number.isNaN(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

function toSessionUser(u: User): SessionUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export const authService = {
  register(name: string, email: string, password: string, role: Role): { success: true } | { success: false; error: string } {
    const users = store.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Este email ya está registrado.' };
    }
    const newUser: User = {
      id: nextId(users),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    };
    store.setUsers([...users, newUser]);
    return { success: true };
  },

  login(email: string, password: string): { success: true; user: SessionUser } | { success: false; error: string } {
    const users = store.getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      return { success: false, error: 'Credenciales incorrectas.' };
    }
    const session: SessionUser = toSessionUser(user);
    store.setSession(JSON.stringify(session));
    return { success: true, user: session };
  },

  logout(): void {
    store.clearSession();
  },

  getSession(): SessionUser | null {
    const raw = store.getSession();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  },
};
