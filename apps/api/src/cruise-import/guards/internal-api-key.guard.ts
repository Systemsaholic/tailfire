/**
 * Internal API Key Guard
 *
 * Protects cruise-import endpoints with an internal API key.
 * This replaces JWT auth for internal/automated sync operations.
 *
 * Usage: Set INTERNAL_API_KEY env var and pass header x-internal-api-key
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-internal-api-key']
    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY')

    if (!expectedKey) {
      // If no key configured, deny all (fail secure)
      throw new UnauthorizedException('Internal API key not configured')
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key')
    }

    return true
  }
}
