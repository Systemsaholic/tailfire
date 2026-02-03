/**
 * Tour Sync History Schema
 *
 * Tracks tour catalog sync runs per brand.
 */

import { uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'

export const tourSyncHistory = catalogSchema.table('tour_sync_history', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Sync details
  provider: varchar('provider', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  currency: varchar('currency', { length: 10 }).default('CAD'),

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),

  // Status
  status: varchar('status', { length: 50 }).notNull(), // 'running' | 'completed' | 'failed'

  // Metrics
  toursSynced: integer('tours_synced').default(0),
  departuresSynced: integer('departures_synced').default(0),
  errorsCount: integer('errors_count').default(0),
  errorMessage: text('error_message'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// TypeScript types
export type TourSyncHistory = typeof tourSyncHistory.$inferSelect
export type NewTourSyncHistory = typeof tourSyncHistory.$inferInsert
