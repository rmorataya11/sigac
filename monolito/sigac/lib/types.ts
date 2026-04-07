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

/** Actividad (lista: GET /activities; detalle: GET /activities/:id) */
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

/** Usuario resumido en disponibilidad global (API) */
export interface AvailabilityUserSummary {
  id: string;
  fullName: string;
  email: string;
}

/** Registro de disponibilidad (GET /availability/me o /availability/global) */
export interface Availability {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  user?: AvailabilityUserSummary;
}

/** Fecha YYYY-MM-DD desde el JSON de la API. */
export function availabilityDateOnly(a: Pick<Availability, 'date'>): string {
  const s = a.date;
  return typeof s === 'string' && s.length >= 10 ? s.slice(0, 10) : String(s);
}

/** Acciones registradas en auditoría (GET /audit/logs) */
export type AuditActionApi =
  | 'ACTIVITY_CREATED'
  | 'ACTIVITY_UPDATED'
  | 'ACTIVITY_CONFIRMED'
  | 'ACTIVITY_CANCELLED';

/** Entrada de log (API incluye usuario) */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditActionApi;
  resourceType: string;
  resourceId: string;
  payloadBefore: unknown | null;
  payloadAfter: unknown | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
}
