/**
 * Tour Hotels Schema
 *
 * Hotels used on tours.
 */

import { uuid, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { catalogSchema } from './catalog.schema'
import { tours } from './tours.schema'

export const tourHotels = catalogSchema.table('tour_hotels', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tour reference
  tourId: uuid('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),

  // Hotel details
  dayNumber: integer('day_number'),
  hotelName: varchar('hotel_name', { length: 500 }).notNull(),
  city: varchar('city', { length: 255 }),
  description: text('description'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// TypeScript types
export type TourHotel = typeof tourHotels.$inferSelect
export type NewTourHotel = typeof tourHotels.$inferInsert
