import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import type { PublicUser } from '../../../common/types/public-user.type';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }
}
