/**
 * Port Info Details Schema
 *
 * Extended details for port/cruise information.
 * One-to-one relationship with itinerary_activities.
 */

import { pgTable, uuid, varchar, text, date, time, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities, portTypeEnum } from './activities.schema'

// Coordinates type for location data
export interface PortCoordinates {
  lat: number
  lng: number
}

export const portInfoDetails = pgTable('port_info_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Port type (departure, arrival, sea_day, port_call)
  portType: portTypeEnum('port_type'),

  // Port information
  portName: varchar('port_name', { length: 255 }),
  portLocation: varchar('port_location', { length: 255 }), // City/Country

  // Arrival/Departure timing
  arrivalDate: date('arrival_date'),
  arrivalTime: time('arrival_time'),
  departureDate: date('departure_date'),
  departureTime: time('departure_time'),
  timezone: varchar('timezone', { length: 100 }),

  // Port details
  dockName: varchar('dock_name', { length: 255 }),
  address: text('address'),
  coordinates: jsonb('coordinates').$type<PortCoordinates>(),

  // Contact info
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),

  // Shore excursion info
  excursionNotes: text('excursion_notes'),
  tenderRequired: boolean('tender_required').default(false),

  // Additional info
  specialRequests: text('special_requests'),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const portInfoDetailsRelations = relations(portInfoDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [portInfoDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type PortInfoDetails = typeof portInfoDetails.$inferSelect
export type NewPortInfoDetails = typeof portInfoDetails.$inferInsert
