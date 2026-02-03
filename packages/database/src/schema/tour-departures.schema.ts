/**
 * Tour Departures Schema
 *
 * Individual tour departure dates with pricing.
 * Links to tours table.
 */

import { uuid, varchar, integer, date, boolean, timestamp, unique, numeric } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tours } from './tours.schema'

export const tourDepartures = catalogSchema.table(
  'tour_departures',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tour reference
    tourId: uuid('tour_id')
      .notNull()
      .references(() => tours.id, { onDelete: 'cascade' }),

    // Departure details
    departureCode: varchar('departure_code', { length: 100 }).notNull(),
    season: varchar('season', { length: 20 }),
    landStartDate: date('land_start_date', { mode: 'string' }),
    landEndDate: date('land_end_date', { mode: 'string' }),
    status: varchar('status', { length: 50 }),

    // Pricing
    basePriceCents: integer('base_price_cents'),
    currency: varchar('currency', { length: 10 }).default('CAD'),

    // Departure info
    guaranteedDeparture: boolean('guaranteed_departure').default(false),
    shipName: varchar('ship_name', { length: 255 }),
    startCity: varchar('start_city', { length: 255 }),
    endCity: varchar('end_city', { length: 255 }),

    // Start/End city geocoding (may differ from tour-level)
    startCityLat: numeric('start_city_lat', { precision: 10, scale: 7 }),
    startCityLng: numeric('start_city_lng', { precision: 10, scale: 7 }),
    endCityLat: numeric('end_city_lat', { precision: 10, scale: 7 }),
    endCityLng: numeric('end_city_lng', { precision: 10, scale: 7 }),

    // Soft delete / active flag
    isActive: boolean('is_active').default(true),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Uniqueness per tour+departure+season+date
    departureUnique: unique('tour_departures_unique').on(
      table.tourId,
      table.departureCode,
      table.season,
      table.landStartDate
    ),
  })
)

// TypeScript types
export type TourDeparture = typeof tourDepartures.$inferSelect
export type NewTourDeparture = typeof tourDepartures.$inferInsert
