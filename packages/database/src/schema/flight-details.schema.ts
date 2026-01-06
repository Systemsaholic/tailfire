/**
 * Flight Details Schema
 *
 * Flight-specific fields extending the base component model
 */

import { pgTable, uuid, varchar, date, time, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

export const flightDetails = pgTable('flight_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' })
    .unique(), // One-to-one relationship

  // Flight identifiers
  airline: varchar('airline', { length: 255 }),
  flightNumber: varchar('flight_number', { length: 100 }),

  // Departure details
  departureAirportCode: varchar('departure_airport_code', { length: 10 }),
  departureDate: date('departure_date'),
  departureTime: time('departure_time'),
  departureTimezone: varchar('departure_timezone', { length: 64 }), // IANA timezone
  departureTerminal: varchar('departure_terminal', { length: 50 }),
  departureGate: varchar('departure_gate', { length: 50 }),

  // Arrival details
  arrivalAirportCode: varchar('arrival_airport_code', { length: 10 }),
  arrivalDate: date('arrival_date'),
  arrivalTime: time('arrival_time'),
  arrivalTimezone: varchar('arrival_timezone', { length: 64 }), // IANA timezone
  arrivalTerminal: varchar('arrival_terminal', { length: 50 }),
  arrivalGate: varchar('arrival_gate', { length: 50 }),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const flightDetailsRelations = relations(flightDetails, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [flightDetails.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type FlightDetails = typeof flightDetails.$inferSelect
export type NewFlightDetails = typeof flightDetails.$inferInsert
