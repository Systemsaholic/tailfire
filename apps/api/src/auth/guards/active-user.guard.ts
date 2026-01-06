/**
 * Active User Guard (GLOBAL)
 *
 * Blocks pending users from all routes EXCEPT those marked with @AllowPendingUser().
 * Applied globally after UserStatusGuard.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { AuthContext } from '../auth.types'
import { ALLOW_PENDING_KEY } from '../decorators/allow-pending.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for public routes (no auth required)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    // Check for @AllowPendingUser() decorator
    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (allowPending) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthContext

    // No user = let JwtAuthGuard handle it
    if (!user) return true

    if (user.userStatus === 'pending') {
      throw new ForbiddenException('Please complete your account setup')
    }

    return true
  }
}
