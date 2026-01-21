import { Module } from '@nestjs/common'
import { ApiCredentialsController } from './api-credentials.controller'
import { ApiCredentialsService } from './api-credentials.service'
import { CredentialResolverService } from './credential-resolver.service'

/**
 * ApiCredentialsModule
 *
 * Manages API credentials with policy-based resolution:
 * - env-only: Read from environment variables (Doppler-managed)
 * - db-only: Read from database (legacy/deprecated)
 * - hybrid: Try env first, fall back to DB
 *
 * The CredentialResolverService provides fail-fast validation at startup
 * and unified credential access for all API providers.
 */
@Module({
  controllers: [ApiCredentialsController],
  providers: [ApiCredentialsService, CredentialResolverService],
  exports: [ApiCredentialsService, CredentialResolverService],
})
export class ApiCredentialsModule {}
