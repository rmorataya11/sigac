import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /auth/register crea colaborador y GET /auth/me con JWT', async () => {
    const passwordHash = await bcrypt.hash('RegistroSeguro1', 4);
    const created = {
      id: 'user-new-1',
      email: 'colaborador@test.com',
      fullName: 'Colaborador Test',
      passwordHash,
      role: Role.COLABORADOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prismaMock = {
      onModuleInit: async () => {},
      onModuleDestroy: async () => {},
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      user: {
        findUnique: jest.fn(async (args: { where: { email?: string; id?: string } }) => {
          if (args.where.email === 'colaborador@test.com') {
            return null;
          }
          if (args.where.id === 'user-new-1') {
            return {
              id: created.id,
              email: created.email,
              fullName: created.fullName,
              role: created.role,
            };
          }
          return null;
        }),
        create: jest.fn().mockResolvedValue(created),
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

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Colaborador Test',
        email: 'colaborador@test.com',
        password: 'RegistroSeguro1',
      })
      .expect(201);

    const token = (reg.body as { access_token: string }).access_token;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body).toMatchObject({
      id: 'user-new-1',
      email: 'colaborador@test.com',
      fullName: 'Colaborador Test',
      role: 'COLABORADOR',
    });
  });

  it('POST /auth/login acepta credenciales y GET /auth/me devuelve perfil', async () => {
    const passwordHash = await bcrypt.hash('AdminLogin1', 4);
    const adminRow = {
      id: 'admin-e2e',
      email: 'admin-e2e@test.com',
      fullName: 'Admin E2E',
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
            if (args.where.email === 'admin-e2e@test.com') {
              return adminRow;
            }
            if (args.where.id === 'admin-e2e') {
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
      .send({ email: 'admin-e2e@test.com', password: 'AdminLogin1' })
      .expect(200);

    const token = (login.body as { access_token: string }).access_token;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body).toEqual(publicRow);
  });
});
