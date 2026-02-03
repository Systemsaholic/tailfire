/**
 * Tour Departure Pricing Schema
 *
 * Per-cabin/category pricing for tour departures.
 */

import { uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tourDepartures } from './tour-departures.schema'

export const tourDeparturePricing = catalogSchema.table('tour_departure_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Departure reference
  departureId: uuid('departure_id')
    .notNull()
    .references(() => tourDepartures.id, { onDelete: 'cascade' }),

  // Pricing details
  cabinCategory: varchar('cabin_category', { length: 100 }),
  priceCents: integer('price_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  currency: varchar('currency', { length: 10 }).default('CAD'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// TypeScript types
export type TourDeparturePricing = typeof tourDeparturePricing.$inferSelect
export type NewTourDeparturePricing = typeof tourDeparturePricing.$inferInsert
