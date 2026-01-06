/**
 * Cruise Repository Module
 *
 * Provides public-facing API for browsing and searching cruise sailings.
 * Depends on DatabaseModule for data access and CruiseImportModule for sync status.
 */

import { Module } from '@nestjs/common'
import { CruiseRepositoryController } from './cruise-repository.controller'
import { CruiseRepositoryService } from './cruise-repository.service'
import { DatabaseModule } from '../db/database.module'
import { CruiseImportModule } from '../cruise-import/cruise-import.module'

@Module({
  imports: [DatabaseModule, CruiseImportModule],
  controllers: [CruiseRepositoryController],
  providers: [CruiseRepositoryService],
  exports: [CruiseRepositoryService],
})
export class CruiseRepositoryModule {}
