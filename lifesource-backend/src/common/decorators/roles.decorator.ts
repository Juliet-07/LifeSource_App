import { SetMetadata } from '@nestjs/common';
import { UserRole, ActiveRole } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | ActiveRole)[]) =>
  SetMetadata(ROLES_KEY, roles);
