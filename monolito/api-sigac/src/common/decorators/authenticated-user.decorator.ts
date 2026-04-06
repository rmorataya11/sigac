import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { PublicUser } from '../types/public-user.type';

/** Usuario obligatorio tras JwtAuthGuard (sin lógica en el controller). */
export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser => {
    const user = ctx.switchToHttp().getRequest<{ user?: PublicUser }>().user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  },
);
