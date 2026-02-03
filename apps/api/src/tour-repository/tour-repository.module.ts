/**
 * Tour Repository Module
 *
 * Read-only API for browsing tour catalog data.
 * Uses the same tiered auth as cruise-repository (CatalogAuthGuard).
 */

import { Module } from '@nestjs/common'
import { TourRepositoryController } from './tour-repository.controller'
import { TourRepositoryService } from './tour-repository.service'

@Module({
  controllers: [TourRepositoryController],
  providers: [TourRepositoryService],
  exports: [TourRepositoryService],
})
export class TourRepositoryModule {}
