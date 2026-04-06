import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants/prisma-enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { PublicUser } from '../types/public-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: PublicUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }
    return required.includes(user.role);
  }
}
