import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '../types/public-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: PublicUser }>();
    return request.user;
  },
);
