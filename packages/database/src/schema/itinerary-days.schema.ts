/**
 * Itinerary Days Schema
 *
 * Organizes itinerary activities by day.
 * Day 0 represents pre-travel information.
 */

import { pgTable, uuid, integer, date, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraries } from './trips.schema'
import { itineraryActivities } from './activities.schema'

export const itineraryDays = pgTable('itinerary_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  itineraryId: uuid('itinerary_id')
    .notNull()
    .references(() => itineraries.id, { onDelete: 'cascade' }),

  // Agency Association (denormalized for RLS, required)
  agencyId: uuid('agency_id').notNull(),

  // Day organization
  dayNumber: integer('day_number').notNull(), // 0 for pre-travel, 1+ for actual trip days
  date: date('date'), // Calendar date (nullable for date-flexible trips)
  title: varchar('title', { length: 255 }),
  notes: text('notes'),
  sequenceOrder: integer('sequence_order').notNull().default(0), // Display order

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  itinerary: one(itineraries, {
    fields: [itineraryDays.itineraryId],
    references: [itineraries.id],
  }),
  activities: many(itineraryActivities),
}))

// TypeScript types
export type ItineraryDay = typeof itineraryDays.$inferSelect
export type NewItineraryDay = typeof itineraryDays.$inferInsert
