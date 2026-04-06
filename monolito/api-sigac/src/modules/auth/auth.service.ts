import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { PublicUser } from '../../common/types/public-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersRepository } from './repositories/users.repository';
import type { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{
    access_token: string;
    user: PublicUser;
  }> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      fullName: dto.fullName.trim(),
      email,
      passwordHash,
      role: Role.COLABORADOR,
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    user: PublicUser;
  }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.usersRepository.findPublicById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private buildAuthResponse(user: User): {
    access_token: string;
    user: PublicUser;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.toPublic(user),
    };
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
