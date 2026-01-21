/**
 * Unsplash Module
 *
 * Provides Unsplash stock image integration.
 * Credentials are loaded via CredentialResolverService (Doppler-managed).
 */

import { Module } from '@nestjs/common'
import { UnsplashService } from './unsplash.service'
import { UnsplashController } from './unsplash.controller'
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module'

@Module({
  imports: [ApiCredentialsModule],
  controllers: [UnsplashController],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}
