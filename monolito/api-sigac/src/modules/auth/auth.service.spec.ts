import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from './repositories/users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<
    Pick<UsersRepository, 'findByEmail' | 'create' | 'findPublicById'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findPublicById: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };
    service = new AuthService(
      usersRepository as unknown as UsersRepository,
      jwtService as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('crea usuario COLABORADOR y devuelve token', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({
        id: 'u-new',
        email: 'nuevo@test.com',
        fullName: 'Nuevo',
        passwordHash: 'hash',
        role: Role.COLABORADOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const out = await service.register({
        fullName: 'Nuevo',
        email: 'Nuevo@Test.com',
        password: 'password123',
      });

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('nuevo@test.com');
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nuevo',
          email: 'nuevo@test.com',
          role: Role.COLABORADOR,
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'u-new',
          email: 'nuevo@test.com',
          role: Role.COLABORADOR,
        }),
      );
      expect(out.access_token).toBe('signed-jwt');
      expect(out.user).toEqual({
        id: 'u-new',
        email: 'nuevo@test.com',
        fullName: 'Nuevo',
        role: Role.COLABORADOR,
      });
    });

    it('lanza ConflictException si el correo existe', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: 'x',
        email: 'a@b.c',
        fullName: 'X',
        passwordHash: 'h',
        role: Role.COLABORADOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.register({
          fullName: 'A',
          email: 'a@b.c',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('devuelve token con credenciales válidas', async () => {
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true as never);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'a@test.com',
        fullName: 'A',
        passwordHash: 'stored-hash',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const out = await service.login({
        email: 'a@test.com',
        password: 'ok',
      });

      expect(compareSpy).toHaveBeenCalledWith('ok', 'stored-hash');
      expect(out.access_token).toBe('signed-jwt');
      expect(out.user.id).toBe('u1');
      compareSpy.mockRestore();
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@test.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('devuelve usuario público', async () => {
      usersRepository.findPublicById.mockResolvedValue({
        id: 'u1',
        email: 'a@test.com',
        fullName: 'A',
        role: Role.COLABORADOR,
      });

      const u = await service.getProfile('u1');
      expect(u).toEqual({
        id: 'u1',
        email: 'a@test.com',
        fullName: 'A',
        role: Role.COLABORADOR,
      });
    });

    it('lanza UnauthorizedException si no hay usuario', async () => {
      usersRepository.findPublicById.mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
