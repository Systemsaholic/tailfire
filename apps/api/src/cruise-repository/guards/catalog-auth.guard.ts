/**
 * Catalog Auth Guard
 *
 * Hybrid authentication guard for cruise repository endpoints.
 * Allows access via:
 * 1. Valid JWT token (for admin/client portal users)
 * 2. Valid catalog API key (for OTA public access)
 *
 * Attaches auth type to request for downstream rate limiting.
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

export type CatalogAuthType = 'jwt' | 'api_key'

@Injectable()
export class CatalogAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 1. Try JWT auth first (preferred for admin/client portal)
    const authHeader = request.headers['authorization']
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      try {
        // Verify JWT using Supabase JWT secret
        const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET')
        if (jwtSecret) {
          const payload = this.jwtService.verify(token, { secret: jwtSecret })
          if (payload) {
            // Valid JWT - attach auth type for rate limiting decisions
            request.catalogAuthType = 'jwt' as CatalogAuthType
            request.user = payload
            return true
          }
        }
      } catch {
        // JWT invalid, fall through to API key check
      }
    }

    // 2. Fall back to catalog API key (for OTA public access)
    const apiKey = request.headers['x-catalog-api-key']
    const expectedKey = this.configService.get<string>('CATALOG_API_KEY')

    if (!expectedKey) {
      // If no catalog key configured, require JWT
      throw new UnauthorizedException('Authentication required')
    }

    if (apiKey === expectedKey) {
      // Valid API key - attach auth type for rate limiting
      request.catalogAuthType = 'api_key' as CatalogAuthType
      return true
    }

    // No valid auth
    throw new UnauthorizedException('Authentication required. Provide a valid JWT token or x-catalog-api-key header.')
  }
}
