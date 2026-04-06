import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ActivityStatus, Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Activities (e2e)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /activities como ADMIN devuelve lista (Prisma mock)', async () => {
    const passwordHash = await bcrypt.hash('AdminActs1', 4);
    const adminRow = {
      id: 'admin-acts',
      email: 'admin-acts@test.com',
      fullName: 'Admin Acts',
      passwordHash,
      role: Role.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const publicRow = {
      id: adminRow.id,
      email: adminRow.email,
      fullName: adminRow.fullName,
      role: adminRow.role,
    };

    const activityRow = {
      id: 'act-1',
      title: 'Reunión e2e',
      description: null,
      activityDate: new Date('2026-06-15T00:00:00.000Z'),
      startTime: '10:00',
      endTime: '11:00',
      minimumQuorum: 1,
      status: ActivityStatus.DRAFT,
      createdById: adminRow.id,
      participants: [],
    };

    const prismaMock = {
      onModuleInit: async () => {},
      onModuleDestroy: async () => {},
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      user: {
        findUnique: jest.fn(
          async (args: {
            where: { email?: string; id?: string };
            select?: object;
          }) => {
            if (args.where.email === 'admin-acts@test.com') {
              return adminRow;
            }
            if (args.where.id === 'admin-acts') {
              if (args.select) {
                return publicRow;
              }
              return adminRow;
            }
            return null;
          },
        ),
        create: jest.fn(),
      },
      activity: {
        findMany: jest.fn().mockResolvedValue([activityRow]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin-acts@test.com', password: 'AdminActs1' })
      .expect(200);

    const token = (login.body as { access_token: string }).access_token;

    const list = await request(app.getHttpServer())
      .get('/activities')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = list.body as Array<{ id: string; title: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('act-1');
    expect(body[0].title).toBe('Reunión e2e');
  });
});
