import { Role } from '../constants/prisma-enums';

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};
