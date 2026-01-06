/**
 * Cruise Ships Schema
 *
 * Reference table for cruise ships.
 * Links to cruise lines with provider-agnostic ID mapping.
 */

import { uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseLines } from './cruise-lines.schema'

export type CruiseShipMetadata = {
  year_built?: number
  tonnage?: number
  passenger_capacity?: number
  crew_count?: number
  amenities?: string[]
  [key: string]: unknown
}

export const cruiseShips = catalogSchema.table('cruise_ships', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),

  // Provider mapping
  provider: varchar('provider', { length: 100 }).notNull().default('traveltek'),
  providerIdentifier: varchar('provider_identifier', { length: 100 }).notNull(),

  // FK to cruise line
  cruiseLineId: uuid('cruise_line_id').references(() => cruiseLines.id, { onDelete: 'set null' }),

  // Ship details
  shipClass: varchar('ship_class', { length: 100 }),
  imageUrl: text('image_url'),

  // Extensible metadata
  metadata: jsonb('metadata').$type<CruiseShipMetadata>().default({}),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TypeScript types
export type CruiseShip = typeof cruiseShips.$inferSelect
export type NewCruiseShip = typeof cruiseShips.$inferInsert
