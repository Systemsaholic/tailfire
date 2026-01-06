/**
 * Dining Details Schema
 *
 * Extended details for dining/restaurant reservations.
 * One-to-one relationship with itinerary_activities.
 */

import { pgTable, uuid, varchar, text, date, time, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

// Coordinates type for location data
export interface DiningCoordinates {
  lat: number
  lng: number
}

export const diningDetails = pgTable('dining_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Restaurant information
  restaurantName: varchar('restaurant_name', { length: 255 }),
  cuisineType: varchar('cuisine_type', { length: 100 }),
  mealType: varchar('meal_type', { length: 50 }), // breakfast, lunch, dinner, brunch, etc.

  // Reservation details
  reservationDate: date('reservation_date'),
  reservationTime: time('reservation_time'),
  timezone: varchar('timezone', { length: 100 }),
  partySize: integer('party_size'), // CHECK constraint in migration (1-100)

  // Location
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),
  coordinates: jsonb('coordinates').$type<DiningCoordinates>(),

  // Additional info (free-text for flexibility)
  priceRange: varchar('price_range', { length: 50 }), // e.g., "$", "$$", "$$$", "$$$$"
  dressCode: varchar('dress_code', { length: 100 }), // e.g., "casual", "smart casual", "formal"
  dietaryRequirements: text('dietary_requirements').array(), // e.g., ["vegetarian", "gluten-free"]
  specialRequests: text('special_requests'),
  menuUrl: varchar('menu_url', { length: 500 }),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const diningDetailsRelations = relations(diningDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [diningDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type DiningDetails = typeof diningDetails.$inferSelect
export type NewDiningDetails = typeof diningDetails.$inferInsert
