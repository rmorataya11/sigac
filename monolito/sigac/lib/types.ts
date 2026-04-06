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

/** Actividad */
export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
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
