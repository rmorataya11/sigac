/** Roles del sistema (alineados con API NestJS) */
export type Role = 'ADMIN' | 'COLABORADOR';

/** Usuario guardado (con contraseña en persistencia) */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

/** Usuario en sesión (sin contraseña) */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Estados de actividad (API Prisma / NestJS) */
export type ActivityStatusApi = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'FINALIZADA';

/** Participante con usuario (respuesta API) */
export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  user: { id: string; fullName: string; email: string };
}

/** Actividad (lista/detalle desde GET /activities) */
export interface Activity {
  id: string;
  title: string;
  description: string | null;
  activityDate: string;
  startTime: string;
  endTime: string;
  minimumQuorum: number;
  status: ActivityStatusApi;
  createdById: string;
  participants: ActivityParticipant[];
}

/** Fecha YYYY-MM-DD a partir del JSON de la API (ISO). */
export function activityDateOnly(a: Pick<Activity, 'activityDate'>): string {
  const s = a.activityDate;
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** Estado de disponibilidad */
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';

/** Registro de disponibilidad */
export interface Availability {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
}
