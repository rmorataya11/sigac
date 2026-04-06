'use client';

import type { User, Activity, Availability } from './types';

const USERS_KEY = 'sigac_users';
const ACTIVITIES_KEY = 'sigac_activities';
const AVAILABILITY_KEY = 'sigac_availability';
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

/** Actividades de ejemplo */
const initialActivities: Activity[] = [
  {
    id: 'a1',
    title: 'Reunión de planificación',
    description: 'Revisión del sprint y prioridades',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'a2',
    title: 'Taller de diseño',
    description: 'Sesión de ideación con el equipo',
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  },
];

export const store = {
  getUsers(): User[] {
    return loadJson<User[]>(USERS_KEY, initialUsers);
  },
  setUsers(users: User[]): void {
    saveJson(USERS_KEY, users);
  },
  getActivities(): Activity[] {
    return loadJson<Activity[]>(ACTIVITIES_KEY, initialActivities);
  },
  setActivities(activities: Activity[]): void {
    saveJson(ACTIVITIES_KEY, activities);
  },
  getAvailability(): Availability[] {
    return loadJson<Availability[]>(AVAILABILITY_KEY, []);
  },
  setAvailability(availability: Availability[]): void {
    saveJson(AVAILABILITY_KEY, availability);
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
