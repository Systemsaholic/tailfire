/**
 * JWT Strategy
 *
 * Validates Supabase JWT tokens and extracts auth context.
 * Uses the Supabase JWT secret for verification.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import * as jwksRsa from 'jwks-rsa'
import type { AuthContext, JwtPayload } from '../auth.types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use JWKS for ES256 token verification
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
      issuer: `${supabaseUrl}/auth/v1`,
    })
  }

  /**
   * Validate the JWT payload and return the auth context.
   * This is called after the token signature is verified.
   */
  async validate(payload: JwtPayload): Promise<AuthContext> {
    // Extract claims from app_metadata (Supabase standard location)
    const appMetadata = payload.app_metadata || {}
    const agencyId = payload.agency_id || appMetadata.agency_id

    // Supabase uses 'authenticated' as default role, actual role is in app_metadata
    let role: 'admin' | 'user' | undefined
    if (payload.role === 'admin' || payload.role === 'user') {
      role = payload.role
    } else {
      role = appMetadata.role
    }

    // Check for required custom claims
    if (!agencyId) {
      throw new UnauthorizedException('Missing agency_id in token')
    }

    if (!role) {
      throw new UnauthorizedException('Missing role in token')
    }

    return {
      userId: payload.user_id || payload.sub,
      email: payload.email,
      agencyId: agencyId,
      role: role,
      userStatus: payload.user_status || appMetadata.user_status || 'active',
    }
  }
}
