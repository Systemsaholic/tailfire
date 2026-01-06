/**
 * Agencies Schema
 *
 * Multi-tenant agency management for travel agencies.
 * Each agency represents a single travel agency organization.
 */

import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// TABLE: agencies
// ============================================================================

export const agencies = pgTable('agencies', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Agency Information
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique(), // URL-friendly identifier

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit Fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================

export const agenciesRelations = relations(agencies, () => ({
  // Future relations will be added here:
  // - users: many(userProfiles)
  // - trips: many(trips)
  // - contacts: many(contacts)
}))

// ============================================================================
// TypeScript types
// ============================================================================

export type Agency = typeof agencies.$inferSelect
export type NewAgency = typeof agencies.$inferInsert
