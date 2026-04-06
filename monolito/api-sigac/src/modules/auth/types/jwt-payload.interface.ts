import { Role } from '../../../common/constants/prisma-enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
