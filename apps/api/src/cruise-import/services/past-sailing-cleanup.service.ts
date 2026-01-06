/**
 * Past Sailing Cleanup Service
 *
 * Removes sailings that have fully completed (end_date < TODAY).
 * Runs daily after the purge job to clean up stale data.
 *
 * Cleanup strategy:
 * - Delete sailings where end_date < TODAY (not sail_date!)
 * - This ensures mid-trip sailings are NOT removed
 * - Cascade deletes: stops, prices, regions via FK
 * - Log counts before/after for visibility
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { DatabaseService } from '../../db/database.service'
import { PastSailingCleanupResult } from '../cruise-import.types'

@Injectable()
export class PastSailingCleanupService {
  private readonly logger = new Logger(PastSailingCleanupService.name)

  constructor(private readonly db: DatabaseService) {}

  // ============================================================================
  // SCHEDULED CLEANUP (Daily at 4 AM, after raw JSON purge at 3 AM)
  // ============================================================================

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'past-sailing-cleanup',
    timeZone: 'America/Toronto', // EST/EDT - adjust as needed
  })
  async scheduledCleanup(): Promise<void> {
    const startTime = new Date()
    this.logger.log(`[${startTime.toISOString()}] Starting scheduled past sailing cleanup...`)

    try {
      const result = await this.cleanupPastSailings()

      const endTime = new Date()
      this.logger.log(
        `[${endTime.toISOString()}] Scheduled cleanup complete: ` +
          `${result.deletedSailings} sailings, ` +
          `${result.deletedStops} stops, ` +
          `${result.deletedPrices} prices removed ` +
          `(cutoff: ${result.cutoffDate}, duration: ${result.durationMs}ms)`
      )
    } catch (error) {
      this.logger.error(`Scheduled cleanup failed: ${error}`)
    }
  }

  // ============================================================================
  // MANUAL CLEANUP
  // ============================================================================

  /**
   * Clean up sailings that have fully completed.
   * By default, removes sailings where end_date < TODAY (not sail_date!).
   * This ensures mid-trip sailings spanning midnight are NOT removed.
   * @param daysBuffer - Optional buffer (e.g., 1 = keep sailings until day after end)
   */
  async cleanupPastSailings(daysBuffer: number = 0): Promise<PastSailingCleanupResult> {
    const startTime = Date.now()

    // Calculate cutoff date
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysBuffer)
    const cutoffDate = cutoff.toISOString().split('T')[0] ?? ''

    this.logger.log(`Cleaning up sailings with end_date < ${cutoffDate} (fully completed trips only)`)

    // 1. Get counts BEFORE cleanup for logging
    const beforeCounts = await this.getCountsBeforeCleanup(cutoffDate)

    this.logger.log(
      `Found ${beforeCounts.sailings} past sailings to clean up ` +
        `(${beforeCounts.stops} stops, ${beforeCounts.prices} prices, ${beforeCounts.regions} region links)`
    )

    if (beforeCounts.sailings === 0) {
      return {
        deletedSailings: 0,
        deletedStops: 0,
        deletedPrices: 0,
        deletedRegions: 0,
        cutoffDate,
        durationMs: Date.now() - startTime,
      }
    }

    // 2. Delete in order (children first due to FK constraints)
    // Note: If FKs have ON DELETE CASCADE, we could just delete sailings.
    // Being explicit here for clarity and logging.

    // Delete region links (use end_date to ensure mid-trip sailings are kept)
    const regionsDeleted = await this.db.db.execute(sql`
      DELETE FROM cruise_sailing_regions
      WHERE sailing_id IN (
        SELECT id FROM cruise_sailings WHERE end_date < ${cutoffDate}::date
      )
      RETURNING 1
    `)

    // Delete stops
    const stopsDeleted = await this.db.db.execute(sql`
      DELETE FROM cruise_sailing_stops
      WHERE sailing_id IN (
        SELECT id FROM cruise_sailings WHERE end_date < ${cutoffDate}::date
      )
      RETURNING 1
    `)

    // Delete prices
    const pricesDeleted = await this.db.db.execute(sql`
      DELETE FROM cruise_sailing_cabin_prices
      WHERE sailing_id IN (
        SELECT id FROM cruise_sailings WHERE end_date < ${cutoffDate}::date
      )
      RETURNING 1
    `)

    // Delete raw JSON for past sailings
    const rawDeleted = await this.db.db.execute(sql`
      DELETE FROM cruise_sync_raw
      WHERE provider_sailing_id IN (
        SELECT provider_identifier FROM cruise_sailings WHERE end_date < ${cutoffDate}::date
      )
      RETURNING 1
    `)

    // Delete sailings (only those that have fully completed)
    const sailingsDeleted = await this.db.db.execute(sql`
      DELETE FROM cruise_sailings
      WHERE end_date < ${cutoffDate}::date
      RETURNING 1
    `)

    const durationMs = Date.now() - startTime

    const rawDeletedCount = rawDeleted.length

    const result: PastSailingCleanupResult = {
      deletedSailings: sailingsDeleted.length,
      deletedStops: stopsDeleted.length,
      deletedPrices: pricesDeleted.length,
      deletedRegions: regionsDeleted.length,
      cutoffDate,
      durationMs,
    }

    this.logger.log(
      `Cleanup complete: ${result.deletedSailings} sailings, ` +
        `${result.deletedStops} stops, ${result.deletedPrices} prices, ` +
        `${result.deletedRegions} regions, ${rawDeletedCount} raw rows removed in ${durationMs}ms`
    )

    return result
  }

  // ============================================================================
  // STATS QUERIES
  // ============================================================================

  private async getCountsBeforeCleanup(cutoffDate: string): Promise<{
    sailings: number
    stops: number
    prices: number
    regions: number
  }> {
    const result = await this.db.db.execute<{
      sailings: string
      stops: string
      prices: string
      regions: string
    }>(sql`
      WITH completed_sailings AS (
        SELECT id, provider_identifier FROM cruise_sailings WHERE end_date < ${cutoffDate}::date
      )
      SELECT
        (SELECT COUNT(*) FROM completed_sailings)::text as sailings,
        (SELECT COUNT(*) FROM cruise_sailing_stops WHERE sailing_id IN (SELECT id FROM completed_sailings))::text as stops,
        (SELECT COUNT(*) FROM cruise_sailing_cabin_prices WHERE sailing_id IN (SELECT id FROM completed_sailings))::text as prices,
        (SELECT COUNT(*) FROM cruise_sailing_regions WHERE sailing_id IN (SELECT id FROM completed_sailings))::text as regions
    `)

    const row = result[0]
    return {
      sailings: parseInt(row?.sailings || '0', 10),
      stops: parseInt(row?.stops || '0', 10),
      prices: parseInt(row?.prices || '0', 10),
      regions: parseInt(row?.regions || '0', 10),
    }
  }

  /**
   * Get statistics about completed sailings (preview before cleanup).
   * Only includes sailings where end_date < cutoff (fully completed trips).
   */
  async getCleanupPreview(daysBuffer: number = 0): Promise<{
    sailingsToDelete: number
    stopsToDelete: number
    pricesToDelete: number
    regionsToDelete: number
    cutoffDate: string
    oldestEndDate: string | null
  }> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysBuffer)
    const cutoffDate = cutoff.toISOString().split('T')[0] ?? ''

    const counts = await this.getCountsBeforeCleanup(cutoffDate)

    const oldestResult = await this.db.db.execute<{ oldest: string | null }>(sql`
      SELECT MIN(end_date)::text as oldest
      FROM cruise_sailings
      WHERE end_date < ${cutoffDate}::date
    `)

    return {
      sailingsToDelete: counts.sailings,
      stopsToDelete: counts.stops,
      pricesToDelete: counts.prices,
      regionsToDelete: counts.regions,
      cutoffDate,
      oldestEndDate: oldestResult[0]?.oldest || null,
    }
  }
}
