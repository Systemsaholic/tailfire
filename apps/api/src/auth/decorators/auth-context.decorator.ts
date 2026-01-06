/**
 * Auth Context Decorator
 *
 * Extracts the authenticated user context from the request.
 * Use this decorator in controller methods to access auth info.
 *
 * @example
 * @Get()
 * getTrips(@GetAuthContext() auth: AuthContext) {
 *   return this.tripsService.findAll(auth.agencyId);
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '../auth.types'

export const GetAuthContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest()
    return request.user as AuthContext
  }
)
