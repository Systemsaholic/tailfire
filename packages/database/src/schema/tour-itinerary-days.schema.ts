/**
 * Tour Itinerary Days Schema
 *
 * Day-by-day itinerary for tours.
 */

import { uuid, integer, varchar, text, timestamp, unique, numeric } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tours } from './tours.schema'

export const tourItineraryDays = catalogSchema.table(
  'tour_itinerary_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tour reference
    tourId: uuid('tour_id')
      .notNull()
      .references(() => tours.id, { onDelete: 'cascade' }),

    // Day details
    dayNumber: integer('day_number').notNull(),
    title: varchar('title', { length: 500 }),
    description: text('description'),
    overnightCity: varchar('overnight_city', { length: 255 }),

    // Overnight city geocoding
    overnightCityLat: numeric('overnight_city_lat', { precision: 10, scale: 7 }),
    overnightCityLng: numeric('overnight_city_lng', { precision: 10, scale: 7 }),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // One entry per tour+day
    tourDayUnique: unique('tour_itinerary_days_unique').on(table.tourId, table.dayNumber),
  })
)

// TypeScript types
export type TourItineraryDay = typeof tourItineraryDays.$inferSelect
export type NewTourItineraryDay = typeof tourItineraryDays.$inferInsert
