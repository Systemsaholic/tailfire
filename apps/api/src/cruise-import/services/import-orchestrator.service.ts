/**
 * Import Orchestrator Service
 *
 * Coordinates the full cruise import workflow:
 * - Lists files from FTP
 * - Processes each file with per-file error handling
 * - Tracks metrics and generates reports
 * - Supports dry-run mode
 * - Delta sync: skips files that haven't changed since last sync
 *
 * IMPORTANT: This service should ONLY run on Production (api.tailfire.ca).
 * Dev and Preview environments use FDW (Foreign Data Wrapper) to read
 * catalog data directly from Production. Running sync on non-prod will
 * create local tables that break the FDW architecture.
 *
 * See CLAUDE.md "Critical Rule #3" for details.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { createHash } from 'crypto'
import { TraveltekFtpService } from './traveltek-ftp.service'
import { SailingImportService } from './sailing-import.service'
import { ReferenceDataCacheService } from './reference-data-cache.service'
import { DatabaseService } from '../../db/database.service'
import {
  FtpSyncOptions,
  ImportMetrics,
  ImportError,
  TraveltekSailingData,
  FtpFileInfo,
} from '../cruise-import.types'
import {
  cruiseFtpFileSync,
  type CruiseFtpFileSync,
  cruiseSyncHistory,
  type SyncHistoryError,
  type SyncHistoryMetrics,
} from '@tailfire/database'
import { eq, desc, sql } from 'drizzle-orm'

@Injectable()
export class ImportOrchestratorService {
  private readonly logger = new Logger(ImportOrchestratorService.name)

  // Import state flags
  private syncInProgress = false
  private cancelRequested = false

  // Default concurrency for parallel file processing
  // With FTP connection pool, we can safely process multiple files in parallel
  private readonly DEFAULT_CONCURRENCY = 4
  private readonly MAX_CONCURRENCY = 8

  // Delta sync: file tracking map (loaded at sync start)
  private fileSyncMap: Map<string, CruiseFtpFileSync> = new Map()

  // Sync history tracking
  private currentSyncHistoryId: string | null = null
  private currentErrors: SyncHistoryError[] = []
  private currentMetrics: ImportMetrics | null = null
  private lastProgressUpdate = 0
  private readonly PROGRESS_UPDATE_INTERVAL = 50 // Update history every 50 files

  // Retry configuration for scheduled sync
  private readonly SCHEDULED_SYNC_MAX_RETRIES = 3
  private readonly SCHEDULED_SYNC_INITIAL_DELAY_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    private readonly ftpService: TraveltekFtpService,
    private readonly sailingImporter: SailingImportService,
    private readonly cache: ReferenceDataCacheService,
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  // ============================================================================
  // MAIN SYNC ENTRY POINT
  // ============================================================================

  async runSync(options: FtpSyncOptions = {}): Promise<ImportMetrics> {
    // ==========================================================================
    // ENVIRONMENT GUARD: Only Production should run cruise sync!
    // Dev and Preview use FDW (Foreign Data Wrapper) to read from Production.
    // Running sync on non-prod creates local tables that break FDW architecture.
    // ==========================================================================
    const apiUrl = this.configService.get<string>('API_URL') || ''
    const isProduction = apiUrl.includes('api.tailfire.ca')
    const bypassGuard = this.configService.get('BYPASS_SYNC_ENVIRONMENT_GUARD') === 'true'

    if (!isProduction && !bypassGuard) {
      throw new Error(
        'Cruise sync is only allowed on Production (api.tailfire.ca). ' +
        'Dev and Preview environments use FDW to read catalog data from Production. ' +
        'See CLAUDE.md "Critical Rule #3" for details.'
      )
    }

    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }

    this.syncInProgress = true
    this.cancelRequested = false
    const metrics = this.initMetrics()

    // Initialize sync history tracking
    this.currentMetrics = metrics
    this.currentErrors = []
    this.lastProgressUpdate = 0
    this.currentSyncHistoryId = await this.createSyncHistoryRecord(options)

    try {
      this.logger.log('Starting cruise data sync...')
      this.logger.log(`Options: ${JSON.stringify(options)}`)

      // Reset cache stats for this run
      this.cache.resetStats()
      this.sailingImporter.resetStubsCreated()

      // Force fresh FTP connection to avoid stale connection issues
      // This fixes the "0 files found" bug caused by reusing stale persistent connections
      await this.ftpService.forceReconnect()

      // 1. Load file sync tracking for delta sync (unless forceFullSync)
      // Load BEFORE file listing so we can skip unchanged files during streaming
      const enableDeltaSync = options.deltaSync !== false && !options.forceFullSync
      if (enableDeltaSync) {
        await this.loadFileSyncMap()
        this.logger.log(`Delta sync enabled: loaded ${this.fileSyncMap.size} tracked files`)
      } else {
        this.fileSyncMap.clear()
        this.logger.log(options.forceFullSync ? 'Force full sync: delta check disabled' : 'Delta sync disabled')
      }

      // 2. Set up options with cancellation support
      const optionsWithCancel: FtpSyncOptions = {
        ...options,
        shouldCancel: () => this.cancelRequested,
      }

      // Dry run mode: collect files and display without processing
      if (options.dryRun) {
        this.logger.log('[DRY RUN] Listing files from FTP...')
        const files: FtpFileInfo[] = []
        for await (const file of this.ftpService.listSailingFilesStream(optionsWithCancel)) {
          files.push(file)
          if (files.length >= 100) break // Limit dry run preview
        }
        this.logger.log('[DRY RUN] Would process the following files:')
        files.slice(0, 20).forEach((f) => this.logger.log(`  - ${f.path} (${f.size} bytes)`))
        if (files.length > 20) {
          this.logger.log(`  ... and ${files.length - 20} more`)
        }
        metrics.filesFound = files.length
        metrics.completedAt = new Date()
        metrics.durationMs = metrics.completedAt.getTime() - metrics.startedAt.getTime()
        return metrics
      }

      // 3. Process files with controlled concurrency using STREAMING
      // Files are processed as they're discovered (no wait for complete file list)
      const concurrency = Math.min(options.concurrency ?? this.DEFAULT_CONCURRENCY, this.MAX_CONCURRENCY)
      this.logger.log(`Starting streaming sync with concurrency=${concurrency}`)

      // Initialize FTP connection pool for parallel downloads
      if (concurrency > 1) {
        const poolSize = options.ftpPoolSize ?? concurrency + 1
        this.logger.log(`Initializing FTP connection pool with size=${poolSize}`)
        await this.ftpService.initializePool(poolSize)
      }

      // Stream files and process with bounded concurrency
      await this.processFilesStreaming(optionsWithCancel, metrics, concurrency, enableDeltaSync)

      // 3. Log summary
      metrics.completedAt = new Date()
      metrics.durationMs = metrics.completedAt.getTime() - metrics.startedAt.getTime()
      metrics.stubsCreated = this.sailingImporter.getStubsCreated()
      if (this.cancelRequested) {
        metrics.cancelled = true
      }

      this.logSummary(metrics)

      // 4. Log stub report if any stubs were created
      await this.sailingImporter.logStubReport()

      // 5. Log cache stats
      this.cache.logStats()

      // Finalize sync history
      const finalStatus = metrics.cancelled ? 'cancelled' : (metrics.filesFailed > 0 ? 'completed' : 'completed')
      await this.finalizeSyncHistory(finalStatus, metrics)

      return metrics
    } catch (error) {
      // Finalize with failed status on unexpected error
      await this.finalizeSyncHistory('failed', metrics)
      throw error
    } finally {
      this.syncInProgress = false
      this.currentMetrics = null
      this.currentSyncHistoryId = null
      await this.ftpService.disconnect()
    }
  }

  // ============================================================================
  // STREAMING CONCURRENT PROCESSING
  // ============================================================================

  /**
   * Process files from an async generator with bounded concurrency.
   * Uses producer-consumer pattern for natural backpressure:
   * - Producer (FTP file discovery) yields files as found
   * - Consumer (worker pool) processes files in parallel
   * - Backpressure naturally occurs when workers are busy
   */
  private async processFilesStreaming(
    options: FtpSyncOptions,
    metrics: ImportMetrics,
    concurrency: number,
    enableDeltaSync: boolean
  ): Promise<void> {
    // Create async iterator from stream
    const fileStream = this.ftpService.listSailingFilesStream(options)
    const iterator = fileStream[Symbol.asyncIterator]()

    // Track completion
    let iteratorDone = false
    const errors: Error[] = []

    // Mutex for thread-safe iterator access
    let iteratorLock = Promise.resolve()

    /**
     * Get next file from iterator (thread-safe)
     */
    const getNextFile = async (): Promise<FtpFileInfo | null> => {
      // Wait for any pending getNext call to complete
      const currentLock = iteratorLock
      let resolveLock: () => void
      iteratorLock = new Promise((resolve) => {
        resolveLock = resolve
      })

      await currentLock

      try {
        if (iteratorDone || this.cancelRequested) {
          return null
        }

        const result = await iterator.next()
        if (result.done) {
          iteratorDone = true
          return null
        }

        metrics.filesFound++
        return result.value
      } catch (error) {
        this.logger.error(`Error getting next file from stream: ${error}`)
        iteratorDone = true
        return null
      } finally {
        resolveLock!()
      }
    }

    /**
     * Worker function that pulls files from stream and processes them
     */
    const worker = async (workerId: number): Promise<void> => {
      this.logger.debug(`Worker ${workerId} started`)

      try {
        while (!this.cancelRequested) {
          const file = await getNextFile()
          if (!file) {
            break // No more files
          }

          try {
            await this.processSingleFile(file, options, metrics, enableDeltaSync)
          } catch (error) {
            // Don't stop the worker on individual file errors
            this.logger.error(`Worker ${workerId} error processing ${file.path}: ${error}`)
          }
        }
      } catch (error) {
        this.logger.error(`Worker ${workerId} fatal error: ${error}`)
        errors.push(error instanceof Error ? error : new Error(String(error)))
      } finally {
        this.logger.debug(`Worker ${workerId} finished`)
      }
    }

    // Start worker pool
    this.logger.log(`Starting ${concurrency} workers for streaming file processing...`)
    const workerPromises = Array.from({ length: concurrency }, (_, i) => worker(i + 1))

    // Wait for all workers to complete
    await Promise.all(workerPromises)

    // Check for cancellation
    if (this.cancelRequested) {
      this.logger.warn('SYNC_CANCELLED: User requested cancellation during streaming file processing')
    }

    // Check for fatal errors
    if (errors.length > 0) {
      this.logger.error(`${errors.length} workers encountered fatal errors`)
    }

    this.logger.log(`Streaming processing complete: ${metrics.filesFound} files discovered, ${metrics.filesProcessed} processed`)
  }


  // ============================================================================
  // PER-FILE PROCESSING (with error handling)
  // ============================================================================

  private async processSingleFile(
    file: FtpFileInfo,
    options: FtpSyncOptions,
    metrics: ImportMetrics,
    enableDeltaSync: boolean
  ): Promise<void> {
    const { path: filePath, size: fileSize, modifiedAt } = file
    const maxSize = options.maxFileSizeBytes ?? 500000

    try {
      // Delta sync: check if file has changed since last sync
      if (enableDeltaSync) {
        const tracked = this.fileSyncMap.get(filePath)
        if (tracked && this.isFileUnchanged(tracked, fileSize, modifiedAt)) {
          metrics.filesSkipped++
          metrics.skipReasons.unchanged++
          return
        }
      }

      // Check for oversized files
      if (options.skipOversized !== false && fileSize > maxSize) {
        this.logger.warn(`Skipping oversized file (${fileSize} > ${maxSize}): ${filePath}`)
        metrics.filesSkipped++
        metrics.skipReasons.oversized++
        return
      }

      // Download file (use pooled download if pool is initialized for parallel processing)
      const result = this.ftpService.isPoolInitialized()
        ? await this.ftpService.downloadFilePooled(filePath, options)
        : await this.ftpService.downloadFile(filePath, options)

      if (!result) {
        this.recordError(metrics, filePath, 'Download failed or file oversized', undefined, 'download_failed')
        metrics.filesFailed++
        metrics.skipReasons.downloadFailed++
        // Track failed sync attempt
        await this.updateFileSyncTracking(filePath, fileSize, modifiedAt, null, 'failed', 'Download failed')
        return
      }

      // Parse JSON
      let data: TraveltekSailingData
      try {
        data = JSON.parse(result.content)
      } catch (parseError) {
        this.recordError(metrics, filePath, `JSON parse error: ${parseError}`, undefined, 'parse_error')
        metrics.filesFailed++
        metrics.skipReasons.parseError++
        // Track failed sync attempt
        await this.updateFileSyncTracking(filePath, fileSize, modifiedAt, null, 'failed', `JSON parse error: ${parseError}`)
        return
      }

      // Extract identifiers from file path (not in JSON content)
      // Path format: /year/month/lineid/shipid/codetocruiseid.json
      const pathIds = this.ftpService.extractIdsFromPath(filePath)
      data.codetocruiseid = pathIds.codetocruiseid
      data.cruiselineid = pathIds.cruiselineid
      data.shipid = pathIds.shipid

      // Validate required fields now come from path, so we just check they're non-empty
      if (!data.codetocruiseid || !data.shipid || !data.cruiselineid) {
        this.recordError(metrics, filePath, 'Could not extract IDs from file path', undefined, 'missing_fields')
        metrics.filesFailed++
        metrics.skipReasons.missingFields++
        await this.updateFileSyncTracking(filePath, fileSize, modifiedAt, null, 'failed', 'Could not extract IDs from file path')
        return
      }

      // Log first file's JSON structure for debugging field mapping
      if (metrics.filesProcessed === 0 && metrics.filesFailed === 0) {
        this.logger.log(`Sample JSON keys: ${Object.keys(data).join(', ')}`)
        this.logger.log(`Sample JSON (first 1000 chars): ${JSON.stringify(data).substring(0, 1000)}`)
        // Log prices structure
        if (data.prices) {
          this.logger.log(`Prices type: ${typeof data.prices}, isArray: ${Array.isArray(data.prices)}`)
          const firstPriceKey = Object.keys(data.prices)[0]
          if (firstPriceKey) {
            this.logger.log(`First price key: ${firstPriceKey}`)
            this.logger.log(`First price value: ${JSON.stringify((data.prices as any)[firstPriceKey]).substring(0, 500)}`)
          }
        }
      }

      // Upsert sailing
      const isNew = await this.sailingImporter.upsertSailing(data, result.content)

      if (isNew) {
        metrics.sailingsCreated++
      } else {
        metrics.sailingsUpdated++
      }
      metrics.sailingsUpserted++
      metrics.filesProcessed++

      // Count stops (prices are now pre-calculated summary, not individual records)
      if (data.itinerary) {
        metrics.stopsInserted += data.itinerary.length
      }
      // Track that we processed pricing (even though we use pre-calculated values)
      if (data.cheapestinside || data.cheapestoutside || data.cheapestbalcony || data.cheapestsuite) {
        metrics.pricesInserted++ // Count as 1 price record per sailing with pricing data
      }

      // Track successful sync
      const contentHash = this.computeContentHash(result.content)
      await this.updateFileSyncTracking(filePath, fileSize, modifiedAt, contentHash, 'success', null)

      // Log progress every 100 files
      if (metrics.filesProcessed % 100 === 0) {
        this.logger.log(`Progress: ${metrics.filesProcessed} files processed, ${metrics.filesFailed} failed, ${metrics.skipReasons.unchanged} unchanged`)
      }

      // Update sync history periodically
      if (this.shouldUpdateProgress()) {
        await this.updateSyncHistoryProgress()
      }
    } catch (error) {
      // DON'T throw - continue processing other files
      this.recordError(
        metrics,
        filePath,
        error instanceof Error ? error.message : String(error),
        this.ftpService.extractSailingIdFromPath(filePath),
        'unknown'
      )
      metrics.filesFailed++
      // Track failed sync attempt
      await this.updateFileSyncTracking(filePath, fileSize, modifiedAt, null, 'failed', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Check if a file is unchanged compared to tracked state.
   * Returns true if file should be skipped (unchanged).
   */
  private isFileUnchanged(
    tracked: CruiseFtpFileSync,
    fileSize: number,
    modifiedAt: Date | undefined
  ): boolean {
    // If previous sync failed, always reprocess
    if (tracked.syncStatus !== 'success') {
      return false
    }

    // Compare size first (always available)
    const sizeMatches = tracked.fileSize === fileSize
    if (!sizeMatches) {
      return false
    }

    // If both have modifiedAt, compare timestamps
    if (modifiedAt && tracked.ftpModifiedAt) {
      return tracked.ftpModifiedAt.getTime() === modifiedAt.getTime()
    }

    // If size matches and no timestamp available, consider unchanged
    // (will be verified by content hash on next full sync if needed)
    return true
  }

  // ============================================================================
  // ERROR TRACKING
  // ============================================================================

  private recordError(
    metrics: ImportMetrics,
    filePath: string,
    error: string,
    providerSailingId?: string,
    errorType: SyncHistoryError['errorType'] = 'unknown'
  ): void {
    const importError: ImportError = {
      filePath,
      error,
      timestamp: new Date(),
      providerSailingId,
    }

    // Keep only last 100 errors in memory
    if (metrics.errors.length >= 100) {
      metrics.errors.shift()
    }
    metrics.errors.push(importError)

    // Also track for sync history
    this.addSyncHistoryError(filePath, error, errorType)

    this.logger.warn(`File error [${filePath}]: ${error}`)
  }

  // ============================================================================
  // METRICS & REPORTING
  // ============================================================================

  private initMetrics(): ImportMetrics {
    return {
      filesFound: 0,
      filesProcessed: 0,
      filesSkipped: 0,
      filesFailed: 0,
      sailingsUpserted: 0,
      sailingsCreated: 0,
      sailingsUpdated: 0,
      pricesInserted: 0,
      stopsInserted: 0,
      stubsCreated: {
        cruiseLines: 0,
        ships: 0,
        ports: 0,
        regions: 0,
      },
      skipReasons: {
        oversized: 0,
        downloadFailed: 0,
        parseError: 0,
        missingFields: 0,
        unchanged: 0,
      },
      errors: [],
      startedAt: new Date(),
    }
  }

  private logSummary(metrics: ImportMetrics): void {
    const duration = metrics.durationMs
      ? `${(metrics.durationMs / 1000).toFixed(1)}s`
      : 'N/A'

    this.logger.log('='.repeat(60))
    this.logger.log('CRUISE SYNC COMPLETE')
    this.logger.log('='.repeat(60))
    this.logger.log(`Duration: ${duration}`)
    this.logger.log(`Files: ${metrics.filesProcessed} processed, ${metrics.filesSkipped} skipped, ${metrics.filesFailed} failed`)
    this.logger.log(`Sailings: ${metrics.sailingsUpserted} upserted (${metrics.sailingsCreated} new, ${metrics.sailingsUpdated} updated)`)
    this.logger.log(`Prices: ${metrics.pricesInserted} inserted`)
    this.logger.log(`Stops: ${metrics.stopsInserted} inserted`)
    this.logger.log(`Stubs created: ${JSON.stringify(metrics.stubsCreated)}`)

    // Log skip reason breakdown
    const { skipReasons } = metrics
    if (skipReasons.unchanged > 0) {
      this.logger.log(`Delta sync: ${skipReasons.unchanged} files skipped (unchanged)`)
    }
    const otherSkips = skipReasons.oversized + skipReasons.downloadFailed + skipReasons.parseError + skipReasons.missingFields
    if (otherSkips > 0) {
      this.logger.log(
        `Skip breakdown: oversized=${skipReasons.oversized}, downloadFailed=${skipReasons.downloadFailed}, ` +
          `parseError=${skipReasons.parseError}, missingFields=${skipReasons.missingFields}`
      )
    }

    if (metrics.errors.length > 0) {
      this.logger.warn(`Errors: ${metrics.errors.length} total`)
      // Log first 5 errors
      metrics.errors.slice(0, 5).forEach((e) => {
        this.logger.warn(`  - ${e.filePath}: ${e.error}`)
      })
      if (metrics.errors.length > 5) {
        this.logger.warn(`  ... and ${metrics.errors.length - 5} more errors`)
      }
    }

    this.logger.log('='.repeat(60))
  }

  // ============================================================================
  // STATUS QUERIES
  // ============================================================================

  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  /**
   * Request cancellation of the current sync.
   * Returns true if a sync was running and cancel was requested.
   */
  cancelSync(): boolean {
    if (!this.syncInProgress) {
      return false
    }
    this.cancelRequested = true
    this.logger.log('Sync cancellation requested')
    return true
  }

  isCancelRequested(): boolean {
    return this.cancelRequested
  }

  // ============================================================================
  // DELTA SYNC HELPERS
  // ============================================================================

  /**
   * Load all file sync tracking records into memory for delta comparison.
   */
  private async loadFileSyncMap(): Promise<void> {
    this.fileSyncMap.clear()

    const records = await this.db.db.select().from(cruiseFtpFileSync)

    for (const record of records) {
      this.fileSyncMap.set(record.filePath, record)
    }

    this.logger.log(`Loaded ${this.fileSyncMap.size} file sync tracking records`)
  }

  /**
   * Update file sync tracking after processing a file.
   * Uses UPSERT for concurrent worker safety.
   */
  private async updateFileSyncTracking(
    filePath: string,
    fileSize: number,
    modifiedAt: Date | undefined,
    contentHash: string | null,
    status: 'success' | 'failed',
    errorMessage: string | null
  ): Promise<void> {
    try {
      await this.db.db
        .insert(cruiseFtpFileSync)
        .values({
          filePath,
          fileSize,
          ftpModifiedAt: modifiedAt ?? null,
          contentHash,
          lastSyncedAt: new Date(),
          syncStatus: status,
          lastError: errorMessage,
        })
        .onConflictDoUpdate({
          target: cruiseFtpFileSync.filePath,
          set: {
            fileSize,
            ftpModifiedAt: modifiedAt ?? null,
            contentHash,
            lastSyncedAt: new Date(),
            syncStatus: status,
            lastError: errorMessage,
          },
        })
    } catch (error) {
      // Don't fail the sync for tracking errors - just log
      this.logger.warn(`Failed to update file sync tracking for ${filePath}: ${error}`)
    }
  }

  /**
   * Compute MD5 hash of content for audit/debugging.
   */
  private computeContentHash(content: string): string {
    return createHash('md5').update(content).digest('hex')
  }

  /**
   * Test FTP connection without running full sync.
   * If sync is in progress, returns status without attempting connection
   * to avoid interrupting the active sync.
   */
  async testConnection(): Promise<{ success: boolean; info: any; skipped?: boolean }> {
    // Don't attempt connection test during sync - it would interrupt the sync
    if (this.syncInProgress) {
      this.logger.log('Test connection skipped: sync in progress')
      return {
        success: true, // Connection is known-good since sync is running
        skipped: true, // Indicates test was not actually performed
        info: {
          ...this.ftpService.getConnectionInfo(),
          note: 'Sync in progress - connection test skipped (connection assumed active)',
        },
      }
    }

    try {
      const success = await this.ftpService.testConnection()
      return {
        success,
        info: this.ftpService.getConnectionInfo(),
      }
    } catch (error) {
      return {
        success: false,
        info: {
          error: error instanceof Error ? error.message : String(error),
          ...this.ftpService.getConnectionInfo(),
        },
      }
    }
  }

  // ============================================================================
  // SYNC HISTORY PERSISTENCE
  // ============================================================================

  /**
   * Create a sync history record at the start of a sync run.
   */
  private async createSyncHistoryRecord(options: FtpSyncOptions): Promise<string | null> {
    try {
      const result = await this.db.db
        .insert(cruiseSyncHistory)
        .values({
          status: 'running',
          options: options as any,
          metrics: null,
          errorCount: 0,
          errors: [],
        })
        .returning({ id: cruiseSyncHistory.id })

      const id = result[0]?.id
      if (id) {
        this.logger.log(`Created sync history record: ${id}`)
      }
      return id ?? null
    } catch (error) {
      this.logger.warn(`Failed to create sync history record: ${error}`)
      return null
    }
  }

  /**
   * Update sync history progress periodically during processing.
   */
  private async updateSyncHistoryProgress(): Promise<void> {
    if (!this.currentSyncHistoryId || !this.currentMetrics) return

    try {
      const metrics: SyncHistoryMetrics = {
        filesFound: this.currentMetrics.filesFound,
        filesProcessed: this.currentMetrics.filesProcessed,
        filesSkipped: this.currentMetrics.filesSkipped,
        filesFailed: this.currentMetrics.filesFailed,
        sailingsUpserted: this.currentMetrics.sailingsUpserted,
        sailingsCreated: this.currentMetrics.sailingsCreated,
        sailingsUpdated: this.currentMetrics.sailingsUpdated,
        pricesInserted: this.currentMetrics.pricesInserted,
        stopsInserted: this.currentMetrics.stopsInserted,
      }

      await this.db.db
        .update(cruiseSyncHistory)
        .set({
          metrics: metrics as any,
          errorCount: this.currentErrors.length,
          errors: this.currentErrors as any,
        })
        .where(eq(cruiseSyncHistory.id, this.currentSyncHistoryId))
    } catch (error) {
      // Don't fail sync for history update errors
      this.logger.warn(`Failed to update sync history progress: ${error}`)
    }
  }

  /**
   * Finalize sync history record on completion/cancellation/failure.
   */
  private async finalizeSyncHistory(
    status: 'completed' | 'cancelled' | 'failed',
    metrics: ImportMetrics
  ): Promise<void> {
    if (!this.currentSyncHistoryId) return

    try {
      const historyMetrics: SyncHistoryMetrics = {
        filesFound: metrics.filesFound,
        filesProcessed: metrics.filesProcessed,
        filesSkipped: metrics.filesSkipped,
        filesFailed: metrics.filesFailed,
        sailingsUpserted: metrics.sailingsUpserted,
        sailingsCreated: metrics.sailingsCreated,
        sailingsUpdated: metrics.sailingsUpdated,
        pricesInserted: metrics.pricesInserted,
        stopsInserted: metrics.stopsInserted,
      }

      await this.db.db
        .update(cruiseSyncHistory)
        .set({
          status,
          completedAt: new Date(),
          metrics: historyMetrics as any,
          errorCount: this.currentErrors.length,
          errors: this.currentErrors as any,
        })
        .where(eq(cruiseSyncHistory.id, this.currentSyncHistoryId))

      this.logger.log(`Finalized sync history record: ${this.currentSyncHistoryId} (${status})`)
    } catch (error) {
      this.logger.warn(`Failed to finalize sync history: ${error}`)
    }
  }

  /**
   * Add an error to current errors list (capped at 100).
   */
  private addSyncHistoryError(filePath: string, error: string, errorType: SyncHistoryError['errorType']): void {
    const syncError: SyncHistoryError = { filePath, error, errorType }

    // Cap at 100 errors (remove oldest first)
    if (this.currentErrors.length >= 100) {
      this.currentErrors.shift()
    }
    this.currentErrors.push(syncError)
  }

  /**
   * Check if we should update progress (every N files).
   */
  private shouldUpdateProgress(): boolean {
    if (!this.currentMetrics) return false
    const processed = this.currentMetrics.filesProcessed + this.currentMetrics.filesFailed
    if (processed - this.lastProgressUpdate >= this.PROGRESS_UPDATE_INTERVAL) {
      this.lastProgressUpdate = processed
      return true
    }
    return false
  }

  /**
   * Get sync history for admin dashboard.
   */
  async getSyncHistory(limit = 10): Promise<any[]> {
    const records = await this.db.db
      .select()
      .from(cruiseSyncHistory)
      .orderBy(desc(cruiseSyncHistory.startedAt))
      .limit(limit)

    return records.map((r) => ({
      id: r.id,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      durationMs: r.completedAt ? r.completedAt.getTime() - r.startedAt.getTime() : null,
      status: r.status,
      metrics: r.metrics,
      errorCount: r.errorCount,
      errors: r.errors,
    }))
  }

  /**
   * Get current sync status with progress metrics.
   */
  getSyncStatus(): { inProgress: boolean; cancelRequested: boolean; progress?: any } {
    const status: any = {
      inProgress: this.syncInProgress,
      cancelRequested: this.cancelRequested,
    }

    if (this.syncInProgress && this.currentMetrics) {
      status.progress = {
        filesFound: this.currentMetrics.filesFound,
        filesProcessed: this.currentMetrics.filesProcessed,
        filesFailed: this.currentMetrics.filesFailed,
        sailingsUpserted: this.currentMetrics.sailingsUpserted,
        startedAt: this.currentMetrics.startedAt.toISOString(),
      }
    }

    return status
  }

  // ============================================================================
  // SCHEDULED SYNC (CRON JOB)
  // ============================================================================

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Check if an error is retryable (connection/network issues)
   */
  private isRetryableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    return (
      message.includes('connect') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network') ||
      message.includes('ftp') ||
      message.includes('socket')
    )
  }

  /**
   * Scheduled daily sync at 2 AM Toronto time.
   * Controlled by ENABLE_SCHEDULED_CRUISE_SYNC env var.
   * Uses PostgreSQL advisory lock to prevent concurrent execution across replicas.
   * Implements retry logic with exponential backoff for transient FTP failures.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: 'America/Toronto' })
  async scheduledSync(): Promise<void> {
    // Check if scheduled sync is enabled
    const enabled = this.configService.get('ENABLE_SCHEDULED_CRUISE_SYNC')
    if (!enabled || enabled === 'false') {
      return
    }

    // Acquire distributed lock to prevent concurrent syncs across replicas
    const lockAcquired = await this.acquireSyncLock()
    if (!lockAcquired) {
      this.logger.warn('Scheduled sync skipped - another instance holds the lock')
      return
    }

    try {
      if (this.isSyncInProgress()) {
        this.logger.warn('Scheduled sync skipped - sync already in progress locally')
        return
      }

      // Retry loop with exponential backoff
      let lastError: unknown
      for (let attempt = 1; attempt <= this.SCHEDULED_SYNC_MAX_RETRIES; attempt++) {
        try {
          this.logger.log(
            `Starting scheduled Traveltek cruise sync (attempt ${attempt}/${this.SCHEDULED_SYNC_MAX_RETRIES})`
          )
          await this.runSync({ concurrency: 4 })
          this.logger.log('Scheduled sync completed successfully')
          return // Success - exit the retry loop
        } catch (error) {
          lastError = error
          const errorMessage = error instanceof Error ? error.message : String(error)

          if (attempt < this.SCHEDULED_SYNC_MAX_RETRIES && this.isRetryableError(error)) {
            // Calculate delay with exponential backoff: 5min, 10min, 20min
            const delayMs = this.SCHEDULED_SYNC_INITIAL_DELAY_MS * Math.pow(2, attempt - 1)
            const delayMinutes = Math.round(delayMs / 60000)

            this.logger.warn(
              `Scheduled sync attempt ${attempt}/${this.SCHEDULED_SYNC_MAX_RETRIES} failed: ${errorMessage}. ` +
                `Retrying in ${delayMinutes} minutes...`
            )

            await this.sleep(delayMs)
          } else {
            // Non-retryable error or final attempt
            this.logger.error(
              `Scheduled sync failed (attempt ${attempt}/${this.SCHEDULED_SYNC_MAX_RETRIES}): ${errorMessage}`
            )
            break
          }
        }
      }

      // All retries exhausted
      if (lastError) {
        this.logger.error(
          `Scheduled sync failed after ${this.SCHEDULED_SYNC_MAX_RETRIES} attempts. ` +
            `Will retry at next scheduled time (2 AM tomorrow).`
        )
      }
    } finally {
      await this.releaseSyncLock()
    }
  }

  /**
   * Acquire PostgreSQL advisory lock for distributed sync coordination.
   * Returns true if lock was acquired, false if another process holds it.
   */
  private async acquireSyncLock(): Promise<boolean> {
    try {
      const result = await this.db.db.execute(
        sql`SELECT pg_try_advisory_lock(hashtext('cruise_sync_lock')) as acquired`
      )
      const row = (result as any)[0]
      return row?.acquired === true
    } catch (error) {
      this.logger.warn(`Failed to acquire sync lock: ${error}`)
      return false
    }
  }

  /**
   * Release PostgreSQL advisory lock after sync completes.
   */
  private async releaseSyncLock(): Promise<void> {
    try {
      await this.db.db.execute(
        sql`SELECT pg_advisory_unlock(hashtext('cruise_sync_lock'))`
      )
    } catch (error) {
      this.logger.warn(`Failed to release sync lock: ${error}`)
    }
  }
}
