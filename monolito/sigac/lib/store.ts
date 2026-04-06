'use client';

import type { User } from './types';

const USERS_KEY = 'sigac_users';
const SESSION_KEY = 'sigac_session';

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Usuarios (mock inicial con un admin y un colaborador) */
const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Colaborador',
    email: 'colab@example.com',
    password: 'colab123',
    role: 'COLABORADOR',
  },
];

export const store = {
  getUsers(): User[] {
    return loadJson<User[]>(USERS_KEY, initialUsers);
  },
  setUsers(users: User[]): void {
    saveJson(USERS_KEY, users);
  },
  getSession(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_KEY);
  },
  setSession(sessionJson: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, sessionJson);
  },
  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  },
};
