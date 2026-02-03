/**
 * Tour Day Details Schema
 *
 * Extended details for tour day activities (children of custom_tour).
 * One-to-one relationship with itinerary_activities.
 */

import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

export const tourDayDetails = pgTable('tour_day_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Tour day information
  dayNumber: integer('day_number'),
  overnightCity: text('overnight_city'),

  // Locking flag - when true, the tour day is read-only
  // Default true = locked to parent tour data
  // False = detached/customizable by agent
  isLocked: boolean('is_locked').default(true),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const tourDayDetailsRelations = relations(tourDayDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [tourDayDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type TourDayDetails = typeof tourDayDetails.$inferSelect
export type NewTourDayDetails = typeof tourDayDetails.$inferInsert
