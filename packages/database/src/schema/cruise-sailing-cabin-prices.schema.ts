/**
 * Cruise Sailing Cabin Prices Schema
 *
 * Price matrix for each sailing.
 * All prices stored in CAD (canonical currency).
 * Uniqueness: (sailing_id, cabin_code, occupancy)
 */

import {
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { cruiseSailings } from './cruise-sailings.schema'

export const cruiseSailingCabinPrices = catalogSchema.table(
  'cruise_sailing_cabin_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK to sailing
    sailingId: uuid('sailing_id')
      .notNull()
      .references(() => cruiseSailings.id, { onDelete: 'cascade' }),

    // Cabin identification
    cabinCode: varchar('cabin_code', { length: 20 }).notNull(),
    cabinCategory: varchar('cabin_category', { length: 50 }).notNull(),

    // Occupancy (default 2 for double occupancy)
    occupancy: integer('occupancy').notNull().default(2),

    // All prices in CAD (canonical currency)
    basePriceCents: integer('base_price_cents').notNull(),
    taxesCents: integer('taxes_cents').notNull().default(0),
    // total_price_cents is a generated column in the database (base + taxes)
    // Drizzle doesn't support generated columns in schema, defined in migration

    // Future-proofing fields (will be 'CAD' for now)
    // Kept for potential multi-currency feeds in the future
    originalCurrency: varchar('original_currency', { length: 3 }).notNull().default('CAD'),
    originalAmountCents: integer('original_amount_cents').notNull(),

    // Per-person pricing flag (some cruises price per person, some per cabin)
    isPerPerson: integer('is_per_person').notNull().default(1),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Uniqueness: one price per sailing+cabin_code+occupancy
    sailingCabinOccupancyUnique: unique('cruise_sailing_cabin_prices_unique').on(
      table.sailingId,
      table.cabinCode,
      table.occupancy
    ),
  })
)

// TypeScript types
export type CruiseSailingCabinPrice = typeof cruiseSailingCabinPrices.$inferSelect
export type NewCruiseSailingCabinPrice = typeof cruiseSailingCabinPrices.$inferInsert
