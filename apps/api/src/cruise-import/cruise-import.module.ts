/**
 * Cruise Import Module
 *
 * Handles Traveltek FTP data import and storage.
 * Includes:
 * - FTP file streaming with retry/backoff
 * - Sailing data upsert with stub creation
 * - Reference data caching (bounded LRU)
 * - Raw JSON TTL purge (daily cron)
 */

import { Module } from '@nestjs/common'
import { TraveltekFtpService } from './services/traveltek-ftp.service'
import { SailingImportService } from './services/sailing-import.service'
import { ReferenceDataCacheService } from './services/reference-data-cache.service'
import { ImportOrchestratorService } from './services/import-orchestrator.service'
import { RawJsonPurgeService } from './services/raw-json-purge.service'
import { PastSailingCleanupService } from './services/past-sailing-cleanup.service'
import { CruiseImportController } from './cruise-import.controller'

@Module({
  controllers: [CruiseImportController],
  providers: [
    TraveltekFtpService,
    SailingImportService,
    ReferenceDataCacheService,
    ImportOrchestratorService,
    RawJsonPurgeService,
    PastSailingCleanupService,
  ],
  exports: [ImportOrchestratorService, RawJsonPurgeService, PastSailingCleanupService],
})
export class CruiseImportModule {}
