/**
 * Activity Travelers Schema
 *
 * Junction table linking trip travelers to activities.
 * Primarily used for package activities but can be used for any activity type.
 * Replaces the package_travelers junction table.
 */

import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'
import { tripTravelers, trips } from './trips.schema'

export const activityTravelers = pgTable(
  'activity_travelers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    activityId: uuid('activity_id')
      .notNull()
      .references(() => itineraryActivities.id, { onDelete: 'cascade' }),

    tripTravelerId: uuid('trip_traveler_id')
      .notNull()
      .references(() => tripTravelers.id, { onDelete: 'cascade' }),

    // RLS denormalization: trip_id for agency-scoped access
    // Auto-populated by trigger on INSERT
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Each traveler can only be linked once per activity
    uniqueActivityTraveler: unique('activity_travelers_unique').on(
      table.activityId,
      table.tripTravelerId
    ),
  })
)

// Relations
export const activityTravelersRelations = relations(activityTravelers, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [activityTravelers.activityId],
    references: [itineraryActivities.id],
  }),
  tripTraveler: one(tripTravelers, {
    fields: [activityTravelers.tripTravelerId],
    references: [tripTravelers.id],
  }),
  trip: one(trips, {
    fields: [activityTravelers.tripId],
    references: [trips.id],
  }),
}))

// TypeScript types
export type ActivityTraveler = typeof activityTravelers.$inferSelect
export type NewActivityTraveler = typeof activityTravelers.$inferInsert
