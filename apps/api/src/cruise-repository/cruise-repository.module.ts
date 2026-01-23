/**
 * Cruise Repository Module
 *
 * Provides API for browsing and searching cruise sailings.
 * Supports tiered authentication:
 * - JWT auth (admin/client portal) - no rate limiting
 * - API key auth (OTA public) - aggressive rate limiting (30 req/min)
 */

import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { CruiseRepositoryController } from './cruise-repository.controller'
import { CruiseRepositoryService } from './cruise-repository.service'
import { CatalogAuthGuard } from './guards/catalog-auth.guard'
import { CatalogThrottleGuard } from './guards/catalog-throttle.guard'
import { DatabaseModule } from '../db/database.module'
import { CruiseImportModule } from '../cruise-import/cruise-import.module'

@Module({
  imports: [
    DatabaseModule,
    CruiseImportModule,
    JwtModule.register({}), // For JWT verification in CatalogAuthGuard
    // ThrottlerModule is configured globally in AppModule
    // CatalogThrottleGuard handles tiered rate limiting
  ],
  controllers: [CruiseRepositoryController],
  providers: [CruiseRepositoryService, CatalogAuthGuard, CatalogThrottleGuard],
  exports: [CruiseRepositoryService],
})
export class CruiseRepositoryModule {}
