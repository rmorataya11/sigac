import { PrismaClient, Role, ActivityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function utcStartOfToday(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function addDaysUTC(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Usuario ADMIN de prueba:
 *   email:    admin@sigac.local
 *   password: AdminSigac2026!
 *
 * Puebla disponibilidades y actividades de demostración (solo este usuario).
 * Cada ejecución borra todas las actividades y disponibilidades y las vuelve a crear.
 */
async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('AdminSigac2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sigac.local' },
    update: {
      fullName: 'Administrador SIGAC',
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      fullName: 'Administrador SIGAC',
      email: 'admin@sigac.local',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.activity.deleteMany({});
  await prisma.availability.deleteMany({});

  const dateA = addDaysUTC(utcStartOfToday(), 7);
  const dateB = addDaysUTC(utcStartOfToday(), 10);

  await prisma.availability.createMany({
    data: [
      {
        userId: admin.id,
        date: dateA,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        userId: admin.id,
        date: dateB,
        startTime: '09:00',
        endTime: '16:00',
      },
    ],
  });

  await prisma.activity.create({
    data: {
      title: 'Reunión de planificación',
      description: 'Borrador sin participantes asignados.',
      activityDate: dateA,
      startTime: '10:00',
      endTime: '12:00',
      minimumQuorum: 1,
      status: ActivityStatus.DRAFT,
      createdById: admin.id,
    },
  });

  await prisma.activity.create({
    data: {
      title: 'Bloque reservado',
      description: 'Borrador en segunda fecha.',
      activityDate: dateB,
      startTime: '11:00',
      endTime: '13:00',
      minimumQuorum: 1,
      status: ActivityStatus.DRAFT,
      createdById: admin.id,
    },
  });

  await prisma.activity.create({
    data: {
      title: 'Sesión confirmada',
      description: 'Ejemplo de actividad confirmada.',
      activityDate: dateA,
      startTime: '14:00',
      endTime: '15:00',
      minimumQuorum: 1,
      status: ActivityStatus.CONFIRMED,
      createdById: admin.id,
    },
  });

  await prisma.activity.create({
    data: {
      title: 'Evento cancelado',
      description: 'Ejemplo CANCELLED.',
      activityDate: dateB,
      startTime: '15:00',
      endTime: '16:00',
      minimumQuorum: 1,
      status: ActivityStatus.CANCELLED,
      createdById: admin.id,
    },
  });

  console.log('Listo: disponibilidades y actividades de demo (solo admin).');
  console.log('  admin@sigac.local / AdminSigac2026!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
