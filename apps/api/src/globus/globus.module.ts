/**
 * Globus Module
 *
 * Real-time proxy to the Globus Family of Brands WebAPI.
 * Provides live tour search, departures, filters, and promotions
 * for Globus, Cosmos, and Monograms brands.
 */

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { GlobusController } from './globus.controller'
import { GlobusService } from './globus.service'
import { CatalogAuthGuard, CatalogThrottleGuard } from '../common/guards'

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
  ],
  controllers: [GlobusController],
  providers: [GlobusService, CatalogAuthGuard, CatalogThrottleGuard],
  exports: [GlobusService],
})
export class GlobusModule {}
