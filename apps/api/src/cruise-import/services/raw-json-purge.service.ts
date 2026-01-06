/**
 * Raw JSON Purge Service
 *
 * Handles TTL cleanup of expired raw JSON records.
 * Logs before/after counts for visibility.
 * Should be run as a cron job (daily recommended).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { DatabaseService } from '../../db/database.service'
import { PurgeResult } from '../cruise-import.types'

@Injectable()
export class RawJsonPurgeService {
  private readonly logger = new Logger(RawJsonPurgeService.name)

  constructor(private readonly db: DatabaseService) {}

  // ============================================================================
  // SCHEDULED PURGE (Daily at 3 AM EST/EDT)
  // ============================================================================

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'raw-json-purge',
    timeZone: 'America/Toronto', // EST/EDT - adjust as needed
  })
  async scheduledPurge(): Promise<void> {
    const startTime = new Date()
    this.logger.log(`[${startTime.toISOString()}] Starting scheduled raw JSON purge...`)

    try {
      const result = await this.purgeExpiredRawJson()

      const endTime = new Date()
      this.logger.log(
        `[${endTime.toISOString()}] Scheduled purge complete: ` +
          `${result.purgedCount} records removed in ${result.durationMs}ms`
      )
    } catch (error) {
      const endTime = new Date()
      this.logger.error(`[${endTime.toISOString()}] Scheduled purge failed: ${error}`)
    }
  }

  // ============================================================================
  // MANUAL PURGE
  // ============================================================================

  /**
   * Purge expired raw JSON records.
   * Returns stats about what was purged.
   */
  async purgeExpiredRawJson(): Promise<PurgeResult> {
    const startTime = Date.now()

    // 1. Get stats BEFORE purge for logging
    const beforeStats = await this.getExpiredStats()

    this.logger.log(
      `Found ${beforeStats.count} expired records to purge ` +
        `(max size: ${beforeStats.maxSizeBytes} bytes, ` +
        `oldest expires: ${beforeStats.oldestExpiredAt?.toISOString() || 'N/A'})`
    )

    if (beforeStats.count === 0) {
      return {
        purgedCount: 0,
        maxSizeBytes: 0,
        durationMs: Date.now() - startTime,
      }
    }

    // 2. Delete expired records
    const deleteResult = await this.db.db.execute(sql`
      DELETE FROM cruise_sync_raw
      WHERE expires_at < NOW()
      RETURNING 1
    `)

    const purgedCount = deleteResult.length

    // 3. Log results
    const durationMs = Date.now() - startTime

    this.logger.log(
      `Purged ${purgedCount} expired raw JSON records ` +
        `(max size: ${beforeStats.maxSizeBytes} bytes) ` +
        `in ${durationMs}ms`
    )

    return {
      purgedCount,
      maxSizeBytes: beforeStats.maxSizeBytes,
      oldestExpiredAt: beforeStats.oldestExpiredAt ?? undefined,
      durationMs,
    }
  }

  // ============================================================================
  // STATS QUERIES
  // ============================================================================

  /**
   * Get statistics about expired records (before purge).
   */
  private async getExpiredStats(): Promise<{
    count: number
    maxSizeBytes: number
    oldestExpiredAt: Date | null
  }> {
    const result = await this.db.db.execute<{
      count: string
      max_size: string | null
      oldest_expired: Date | null
    }>(sql`
      SELECT
        COUNT(*)::text as count,
        MAX(pg_column_size(raw_data))::text as max_size,
        MIN(expires_at) as oldest_expired
      FROM cruise_sync_raw
      WHERE expires_at < NOW()
    `)

    const row = result[0]
    return {
      count: parseInt(row?.count || '0', 10),
      maxSizeBytes: parseInt(row?.max_size || '0', 10),
      oldestExpiredAt: row?.oldest_expired ?? null,
    }
  }

  /**
   * Get overall storage statistics (not just expired).
   */
  async getStorageStats(): Promise<{
    totalRecords: number
    totalSizeBytes: number
    avgSizeBytes: number
    maxSizeBytes: number
    expiredCount: number
    expiringIn24HoursCount: number
  }> {
    const result = await this.db.db.execute<{
      total_records: string
      total_size: string | null
      avg_size: string | null
      max_size: string | null
      expired_count: string
      expiring_soon_count: string
    }>(sql`
      SELECT
        COUNT(*)::text as total_records,
        SUM(pg_column_size(raw_data))::text as total_size,
        AVG(pg_column_size(raw_data))::text as avg_size,
        MAX(pg_column_size(raw_data))::text as max_size,
        COUNT(*) FILTER (WHERE expires_at < NOW())::text as expired_count,
        COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '24 hours' AND expires_at >= NOW())::text as expiring_soon_count
      FROM cruise_sync_raw
    `)

    const row = result[0]
    return {
      totalRecords: parseInt(row?.total_records || '0', 10),
      totalSizeBytes: parseInt(row?.total_size || '0', 10),
      avgSizeBytes: Math.round(parseFloat(row?.avg_size || '0')),
      maxSizeBytes: parseInt(row?.max_size || '0', 10),
      expiredCount: parseInt(row?.expired_count || '0', 10),
      expiringIn24HoursCount: parseInt(row?.expiring_soon_count || '0', 10),
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Extend TTL for a specific sailing's raw data.
   * Useful if you need to keep data longer for debugging.
   */
  async extendTtl(providerSailingId: string, additionalDays: number = 30): Promise<boolean> {
    const result = await this.db.db.execute(sql`
      UPDATE cruise_sync_raw
      SET expires_at = expires_at + ${additionalDays} * INTERVAL '1 day'
      WHERE provider_sailing_id = ${providerSailingId}
      RETURNING 1
    `)

    const updated = result.length > 0
    if (updated) {
      this.logger.log(`Extended TTL for ${providerSailingId} by ${additionalDays} days`)
    }
    return updated
  }

  /**
   * Delete raw JSON for a specific sailing (manual cleanup).
   */
  async deleteRawJson(providerSailingId: string): Promise<boolean> {
    const result = await this.db.db.execute(sql`
      DELETE FROM cruise_sync_raw
      WHERE provider_sailing_id = ${providerSailingId}
      RETURNING 1
    `)

    const deleted = result.length > 0
    if (deleted) {
      this.logger.log(`Deleted raw JSON for ${providerSailingId}`)
    }
    return deleted
  }
}
