/**
 * Cruise Sync History Schema
 *
 * Tracks sync run history with metrics, errors, and status.
 * Used by the admin dashboard to show sync history and error logs.
 */

import {
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { catalogSchema } from './catalog.schema'

export const cruiseSyncHistory = catalogSchema.table(
  'cruise_sync_history',
  {
    // Primary key
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    // Timing
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Status: 'running' | 'completed' | 'cancelled' | 'failed'
    status: varchar('status', { length: 20 }).notNull().default('running'),

    // Sync options used (FtpSyncOptions)
    options: jsonb('options'),

    // Metrics from ImportMetrics (filesFound, filesProcessed, sailingsUpserted, etc.)
    metrics: jsonb('metrics'),

    // Denormalized error count for quick queries
    errorCount: integer('error_count').notNull().default(0),

    // Bounded error array (max 100 entries, oldest removed first)
    // Each error: { filePath: string, error: string, errorType: string }
    errors: jsonb('errors').notNull().default(sql`'[]'::jsonb`),

    // Audit timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for listing history by date (newest first)
    startedIdx: index('idx_sync_history_started').on(table.startedAt),
    // Partial index for finding running syncs
    runningIdx: index('idx_sync_history_running').on(table.status).where(sql`status = 'running'`),
  })
)

// TypeScript types
export type CruiseSyncHistory = typeof cruiseSyncHistory.$inferSelect
export type NewCruiseSyncHistory = typeof cruiseSyncHistory.$inferInsert

// Type for sync status enum
export type SyncHistoryStatus = 'running' | 'completed' | 'cancelled' | 'failed'

// Type for individual error entry
export interface SyncHistoryError {
  filePath: string
  error: string
  errorType: 'parse_error' | 'download_failed' | 'missing_fields' | 'oversized' | 'unknown'
}

// Type for metrics JSONB field
export interface SyncHistoryMetrics {
  filesFound: number
  filesProcessed: number
  filesSkipped: number
  filesFailed: number
  sailingsUpserted: number
  sailingsCreated: number
  sailingsUpdated: number
  pricesInserted: number
  stopsInserted: number
}
