/**
 * Cruise Import Controller
 *
 * REST API endpoints for cruise data sync operations.
 * Intended for admin/internal use (not public-facing).
 */

import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ImportOrchestratorService } from './services/import-orchestrator.service'
import { SailingImportService } from './services/sailing-import.service'
import { RawJsonPurgeService } from './services/raw-json-purge.service'
import { PastSailingCleanupService } from './services/past-sailing-cleanup.service'
import { ReferenceDataCacheService } from './services/reference-data-cache.service'
import { TraveltekFtpService } from './services/traveltek-ftp.service'
import { FtpSyncOptions, ImportMetrics, PurgeResult, PastSailingCleanupResult } from './cruise-import.types'

@ApiTags('Cruise Import')
@Controller('cruise-import')
export class CruiseImportController {
  constructor(
    private readonly orchestrator: ImportOrchestratorService,
    private readonly sailingImporter: SailingImportService,
    private readonly purgeService: RawJsonPurgeService,
    private readonly cleanupService: PastSailingCleanupService,
    private readonly cacheService: ReferenceDataCacheService,
    private readonly ftpService: TraveltekFtpService
  ) {}

  // ============================================================================
  // SYNC ENDPOINTS
  // ============================================================================

  /**
   * Start a full FTP sync.
   * POST /cruise-import/sync
   */
  @Post('sync')
  async runSync(@Body() options: FtpSyncOptions = {}): Promise<ImportMetrics> {
    if (this.orchestrator.isSyncInProgress()) {
      throw new HttpException('Sync already in progress', HttpStatus.CONFLICT)
    }

    return this.orchestrator.runSync(options)
  }

  /**
   * Run a dry-run sync (list files only, no import).
   * POST /cruise-import/sync/dry-run
   */
  @Post('sync/dry-run')
  async runDrySync(@Body() options: FtpSyncOptions = {}): Promise<ImportMetrics> {
    return this.orchestrator.runSync({ ...options, dryRun: true })
  }

  /**
   * Check if sync is currently in progress.
   * GET /cruise-import/sync/status
   */
  @Get('sync/status')
  getSyncStatus(): { inProgress: boolean; cancelRequested: boolean; progress?: any } {
    return this.orchestrator.getSyncStatus()
  }

  /**
   * Get sync history (past runs with metrics and errors).
   * GET /cruise-import/sync/history?limit=10
   */
  @Get('sync/history')
  async getSyncHistory(@Query('limit') limit?: string): Promise<any[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10
    return this.orchestrator.getSyncHistory(Math.min(parsedLimit, 100))
  }

  /**
   * Cancel a running sync operation.
   * POST /cruise-import/sync/cancel
   *
   * Returns success=true if a sync was running and cancellation was requested.
   * The sync will stop at the next safe checkpoint (after current file completes).
   * Returns success=false if no sync was in progress.
   */
  @Post('sync/cancel')
  cancelSync(): { success: boolean; message: string } {
    const cancelled = this.orchestrator.cancelSync()
    if (cancelled) {
      return {
        success: true,
        message: 'Cancellation requested. Sync will stop after current file completes.',
      }
    }
    return {
      success: false,
      message: 'No sync in progress to cancel.',
    }
  }

  // ============================================================================
  // CONNECTION TEST
  // ============================================================================

  /**
   * Test FTP connection without running sync.
   * GET /cruise-import/test-connection
   *
   * Note: If a sync is in progress, this endpoint returns immediately without
   * actually testing the connection (to avoid interrupting the sync). Check
   * the `skipped` field in the response to determine if a real test was performed.
   */
  @Get('test-connection')
  async testConnection(): Promise<{ success: boolean; info: any; skipped?: boolean }> {
    return this.orchestrator.testConnection()
  }

  /**
   * Get available year folders from the FTP server.
   * GET /cruise-import/available-years
   */
  @Get('available-years')
  async getAvailableYears(): Promise<{ years: number[] }> {
    const years = await this.ftpService.getAvailableYears()
    return { years }
  }

  // ============================================================================
  // RAW JSON PURGE
  // ============================================================================

  /**
   * Manually trigger raw JSON purge.
   * POST /cruise-import/purge
   */
  @Post('purge')
  async runPurge(): Promise<PurgeResult> {
    return this.purgeService.purgeExpiredRawJson()
  }

  /**
   * Get raw JSON storage stats.
   * GET /cruise-import/storage-stats
   */
  @Get('storage-stats')
  async getStorageStats(): Promise<{
    totalRecords: number
    totalSizeBytes: number
    avgSizeBytes: number
    maxSizeBytes: number
    expiredCount: number
    expiringIn24HoursCount: number
  }> {
    return this.purgeService.getStorageStats()
  }

  // ============================================================================
  // CACHE STATS
  // ============================================================================

  /**
   * Get reference data cache stats.
   * GET /cruise-import/cache-stats
   */
  @Get('cache-stats')
  getCacheStats() {
    return this.cacheService.getStats()
  }

  /**
   * Clear reference data cache.
   * POST /cruise-import/cache/clear
   */
  @Post('cache/clear')
  clearCache(): { cleared: boolean } {
    this.cacheService.clear()
    return { cleared: true }
  }

  // ============================================================================
  // PAST SAILING CLEANUP
  // ============================================================================

  /**
   * Preview past sailing cleanup (what would be deleted).
   * Only includes fully completed sailings (end_date < cutoff).
   * GET /cruise-import/cleanup/preview?daysBuffer=0
   */
  @Get('cleanup/preview')
  async getCleanupPreview(
    @Query('daysBuffer') daysBuffer?: string
  ): Promise<{
    sailingsToDelete: number
    stopsToDelete: number
    pricesToDelete: number
    regionsToDelete: number
    cutoffDate: string
    oldestEndDate: string | null
  }> {
    const buffer = daysBuffer ? parseInt(daysBuffer, 10) : 0
    return this.cleanupService.getCleanupPreview(buffer)
  }

  /**
   * Manually trigger past sailing cleanup.
   * POST /cruise-import/cleanup
   * Body: { daysBuffer?: number }
   */
  @Post('cleanup')
  async runCleanup(
    @Body() body: { daysBuffer?: number } = {}
  ): Promise<PastSailingCleanupResult> {
    return this.cleanupService.cleanupPastSailings(body.daysBuffer ?? 0)
  }

  // ============================================================================
  // STUB REPORT
  // ============================================================================

  /**
   * Get pending stubs report (items needing review).
   * GET /cruise-import/stubs-report
   */
  @Get('stubs-report')
  async getStubsReport(): Promise<{
    totalPending: number
    cruiseLines: number
    ships: number
    ports: number
    regions: number
    oldestStubs: Array<{ type: string; name: string; createdAt: string }>
  }> {
    return this.sailingImporter.getPendingStubsReport()
  }

  // ============================================================================
  // COVERAGE STATS
  // ============================================================================

  /**
   * Get coverage statistics for cruise data (ships, lines, ports, regions, sailings).
   * Used by admin dashboard to monitor data completeness.
   * GET /cruise-import/coverage-stats
   */
  @Get('coverage-stats')
  async getCoverageStats(): Promise<{
    ships: { total: number; withImage: number; withDeckPlans: number; needsReview: number }
    cruiseLines: { total: number; withLogo: number; needsReview: number }
    ports: { total: number; active: number; withCoordinates: number; needsReview: number }
    regions: { total: number; needsReview: number }
    sailings: { total: number; activeFuture: number }
  }> {
    return this.sailingImporter.getCoverageStats()
  }
}
