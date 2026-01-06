/**
 * Unsplash Module
 *
 * Provides Unsplash stock image integration.
 * Requires UNSPLASH_ACCESS_KEY environment variable.
 */

import { Module } from '@nestjs/common'
import { UnsplashService } from './unsplash.service'
import { UnsplashController } from './unsplash.controller'

@Module({
  controllers: [UnsplashController],
  providers: [UnsplashService],
  exports: [UnsplashService],
})
export class UnsplashModule {}
