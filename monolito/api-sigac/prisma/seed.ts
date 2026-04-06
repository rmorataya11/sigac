import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Usuario ADMIN inicial para pruebas (único usuario creado por el seed).
 * Credenciales:
 *   email:    admin@sigac.local
 *   password: AdminSigac2026!
 *
 * Los COLABORADOR se registran vía POST /auth/register.
 */
async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('AdminSigac2026!', 10);

  await prisma.user.upsert({
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
