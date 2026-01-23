/**
 * Catalog Throttle Guard
 *
 * Tiered rate limiting for cruise repository endpoints:
 * - JWT authenticated users: No throttling (trusted staff/clients)
 * - API key users: Aggressive throttling (30 req/min to prevent scraping)
 */

import { Injectable, ExecutionContext } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler'
import type { CatalogAuthType } from './catalog-auth.guard'

// Rate limits for API key users (OTA public access)
// Note: Actual limits are configured in AppModule ThrottlerModule.forRoot()
// This guard only controls SKIP logic for JWT users

@Injectable()
export class CatalogThrottleGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authType: CatalogAuthType | undefined = request.catalogAuthType

    // Skip throttling for JWT authenticated users (admin/client portal)
    if (authType === 'jwt') {
      return true
    }

    // Apply throttling for API key users (OTA)
    return false
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Track by IP address for API key users
    const headers = req.headers as Record<string, string> | undefined
    const ip =
      headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      (req.ip as string) ||
      'unknown'
    return ip
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please slow down.')
  }
}
