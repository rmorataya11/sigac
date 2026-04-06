import type { ActivityStatus, Prisma } from '@prisma/client';

/** Forma mínima para serializar una actividad al AuditLog (evita dependencia circular con coordination). */
export type ActivityAuditSource = {
  id: string;
  title: string;
  description: string | null;
  activityDate: Date;
  startTime: string;
  endTime: string;
  minimumQuorum: number;
  status: ActivityStatus;
  participants: { userId: string }[];
};

/** Snapshot estable para JSON en AuditLog (antes / después). */
export function snapshotActivity(a: ActivityAuditSource): Prisma.InputJsonValue {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    activityDate: a.activityDate.toISOString().slice(0, 10),
    startTime: a.startTime,
    endTime: a.endTime,
    minimumQuorum: a.minimumQuorum,
    status: a.status,
    participantUserIds: a.participants.map((p) => p.userId),
  } as Prisma.InputJsonValue;
}
