/**
 * Catalog Auth Guard
 *
 * Hybrid authentication guard for catalog repository endpoints (cruises, tours, etc.).
 * Allows access via:
 * 1. Valid JWT token (for admin/client portal users) - uses Passport JWT strategy
 * 2. Valid catalog API key (for OTA public access)
 *
 * Attaches auth type to request for downstream rate limiting.
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthGuard } from '@nestjs/passport'

export type CatalogAuthType = 'jwt' | 'api_key'

@Injectable()
export class CatalogAuthGuard implements CanActivate {
  private readonly jwtGuard: InstanceType<ReturnType<typeof AuthGuard>>

  constructor(private configService: ConfigService) {
    // Create a JWT guard instance for reuse
    this.jwtGuard = new (AuthGuard('jwt'))()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 1. Try JWT auth first (preferred for admin/client portal)
    const authHeader = request.headers['authorization']
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // Use Passport JWT strategy for verification
        const result = await this.jwtGuard.canActivate(context)
        if (result) {
          // JWT valid - attach auth type for rate limiting decisions
          request.catalogAuthType = 'jwt' as CatalogAuthType
          return true
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
