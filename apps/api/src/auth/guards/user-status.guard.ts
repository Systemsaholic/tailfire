/**
 * User Status Guard (GLOBAL)
 *
 * Checks isActive flag via DB lookup. Blocks soft-deleted users.
 * Applied globally after JwtAuthGuard.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../../db/database.service'
import type { AuthContext } from '../auth.types'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for public routes (no auth required)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthContext

    // No user = skip (public route or JwtAuthGuard will handle)
    if (!user) return true

    // DB lookup for isActive (not in JWT)
    const profile = await this.db.client.query.userProfiles.findFirst({
      where: eq(this.db.schema.userProfiles.id, user.userId),
      columns: { isActive: true },
    })

    if (!profile || !profile.isActive) {
      throw new ForbiddenException('Account has been deactivated')
    }

    return true
  }
}
