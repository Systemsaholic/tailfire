import { Module } from '@nestjs/common'
import { ApiCredentialsController } from './api-credentials.controller'
import { ApiCredentialsService } from './api-credentials.service'

/**
 * ApiCredentialsModule
 *
 * Manages encrypted API credentials with versioning and rotation support.
 * Provides secure storage for third-party API keys and secrets.
 */
@Module({
  controllers: [ApiCredentialsController],
  providers: [ApiCredentialsService],
  exports: [ApiCredentialsService], // Export for use in other modules (e.g., StorageService)
})
export class ApiCredentialsModule {}
