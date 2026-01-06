/**
 * Cruise Ship Cabin Types Schema
 *
 * Normalized storage for cabin type definitions per ship.
 * Defines the cabin categories available on a ship (inside, oceanview, balcony, suite).
 */

import {
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseShips } from './cruise-ships.schema'

export type CabinTypeMetadata = {
  square_feet?: number
  max_occupancy?: number
  bed_configuration?: string
  amenities?: string[]
  [key: string]: unknown
}

export const cruiseShipCabinTypes = catalogSchema.table(
  'cruise_ship_cabin_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK to cruise ship
    shipId: uuid('ship_id')
      .notNull()
      .references(() => cruiseShips.id, { onDelete: 'cascade' }),

    // Cabin code (e.g., "IA", "OV", "BL", "GS") - unique per ship
    cabinCode: varchar('cabin_code', { length: 20 }).notNull(),

    // Category for pricing aggregation (inside, oceanview, balcony, suite)
    cabinCategory: varchar('cabin_category', { length: 50 }).notNull(),

    // Display name (e.g., "Interior Stateroom", "Grand Suite")
    name: varchar('name', { length: 255 }).notNull(),

    // Description
    description: text('description'),

    // Image for this cabin type
    imageUrl: text('image_url'),

    // Deck location (which decks have this cabin type)
    deckLocations: varchar('deck_locations', { length: 255 }),

    // Default occupancy
    defaultOccupancy: integer('default_occupancy').notNull().default(2),

    // Extensible metadata
    metadata: jsonb('metadata').$type<CabinTypeMetadata>().default({}),

    // Soft delete / active flag
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint on ship + cabin code
    shipCabinCodeUnique: unique('cruise_ship_cabin_types_code_unique').on(table.shipId, table.cabinCode),
  })
)

// TypeScript types
export type CruiseShipCabinType = typeof cruiseShipCabinTypes.$inferSelect
export type NewCruiseShipCabinType = typeof cruiseShipCabinTypes.$inferInsert
