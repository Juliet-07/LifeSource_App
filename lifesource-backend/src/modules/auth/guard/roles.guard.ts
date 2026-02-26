import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators';
import { UserRole, ActiveRole } from '../../../common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    for (const requiredRole of required) {
      // Exact UserRole match (hospital-admin, super-admin, user)
      if (user.role === requiredRole) return true;

      // ActiveRole check — works for role=USER only
      if (user.role === UserRole.USER) {
        if (
          requiredRole === ActiveRole.DONOR ||
          requiredRole === ActiveRole.RECIPIENT
        ) {
          if (user.activeRole === requiredRole) return true;
        }
      }
    }

    throw new ForbiddenException(
      `Access denied. Switch to the correct role using PATCH /auth/switch-role. Required: ${required.join(', ')}`,
    );
  }
}
