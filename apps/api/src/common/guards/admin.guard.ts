import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'

/**
 * AdminGuard
 *
 * Placeholder guard for admin-only endpoints.
 * Currently allows all requests with a warning log.
 *
 * TODO: Replace with actual RolesGuard when user auth system is ready
 *
 * @example
 * ```typescript
 * @UseGuards(AdminGuard)
 * @Post('api-credentials')
 * async createCredential() {
 *   // Only admins should access this endpoint
 * }
 * ```
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name)
  private hasLoggedWarning = false

  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Log warning only once to avoid spam
    if (!this.hasLoggedWarning) {
      this.logger.warn(
        '⚠️  AdminGuard is a placeholder - all requests are currently allowed. ' +
        'This guard must be replaced with actual RolesGuard when user authentication system is ready.'
      )
      this.hasLoggedWarning = true
    }

    // TODO: Implement actual admin role checking
    // const request = context.switchToHttp().getRequest()
    // const user = request.user
    // return user && user.roles && user.roles.includes('admin')

    return true
  }
}
