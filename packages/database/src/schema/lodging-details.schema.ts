/**
 * Lodging Details Schema
 *
 * Lodging-specific fields extending the base component model
 * (hotels, resorts, vacation rentals, etc.)
 */

import { pgTable, uuid, varchar, text, integer, date, time, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

// Amenities type for structured storage
export type LodgingAmenities = string[]

export const lodgingDetails = pgTable('lodging_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Property information
  propertyName: varchar('property_name', { length: 255 }),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),

  // Check-in/out details
  checkInDate: date('check_in_date').notNull(),
  checkInTime: time('check_in_time'),
  checkOutDate: date('check_out_date').notNull(),
  checkOutTime: time('check_out_time'),
  timezone: varchar('timezone', { length: 100 }), // IANA timezone

  // Room details
  roomType: varchar('room_type', { length: 100 }),
  roomCount: integer('room_count').notNull().default(1),
  amenities: jsonb('amenities').$type<LodgingAmenities>().default([]),

  // Additional info
  specialRequests: text('special_requests'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const lodgingDetailsRelations = relations(lodgingDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [lodgingDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type LodgingDetails = typeof lodgingDetails.$inferSelect
export type NewLodgingDetails = typeof lodgingDetails.$inferInsert
