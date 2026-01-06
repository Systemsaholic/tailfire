/**
 * Flight Segments Schema
 *
 * Multi-segment flight support - stores individual flight segments
 * for journeys with connections (e.g., YYZ → ORD → LHR)
 *
 * Relationship: One activity can have many flight segments (one-to-many)
 * Unlike flight_details which is one-to-one with activity
 */

import { pgTable, uuid, varchar, date, time, timestamp, integer, doublePrecision, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'

export const flightSegments = pgTable('flight_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' }),
  segmentOrder: integer('segment_order').notNull().default(0),

  // Flight identifiers
  airline: varchar('airline', { length: 255 }),
  flightNumber: varchar('flight_number', { length: 100 }),

  // Departure details
  departureAirportCode: varchar('departure_airport_code', { length: 10 }),
  departureAirportName: varchar('departure_airport_name', { length: 255 }),
  departureAirportCity: varchar('departure_airport_city', { length: 100 }),
  departureAirportLat: doublePrecision('departure_airport_lat'),
  departureAirportLon: doublePrecision('departure_airport_lon'),
  departureDate: date('departure_date'),
  departureTime: time('departure_time'),
  departureTimezone: varchar('departure_timezone', { length: 64 }), // IANA timezone
  departureTerminal: varchar('departure_terminal', { length: 50 }),
  departureGate: varchar('departure_gate', { length: 50 }),

  // Arrival details
  arrivalAirportCode: varchar('arrival_airport_code', { length: 10 }),
  arrivalAirportName: varchar('arrival_airport_name', { length: 255 }),
  arrivalAirportCity: varchar('arrival_airport_city', { length: 100 }),
  arrivalAirportLat: doublePrecision('arrival_airport_lat'),
  arrivalAirportLon: doublePrecision('arrival_airport_lon'),
  arrivalDate: date('arrival_date'),
  arrivalTime: time('arrival_time'),
  arrivalTimezone: varchar('arrival_timezone', { length: 64 }), // IANA timezone
  arrivalTerminal: varchar('arrival_terminal', { length: 50 }),
  arrivalGate: varchar('arrival_gate', { length: 50 }),

  // Aircraft details (from Aerodatabox)
  aircraftModel: varchar('aircraft_model', { length: 255 }),
  aircraftRegistration: varchar('aircraft_registration', { length: 50 }),
  aircraftModeS: varchar('aircraft_mode_s', { length: 10 }),
  aircraftImageUrl: text('aircraft_image_url'),
  aircraftImageAuthor: varchar('aircraft_image_author', { length: 255 }),

  // Audit fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
// Note: UNIQUE(activity_id, segment_order) and INDEX created via migration

// Relations
export const flightSegmentsRelations = relations(flightSegments, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [flightSegments.activityId],
    references: [itineraryActivities.id],
  }),
}))

// TypeScript types
export type FlightSegment = typeof flightSegments.$inferSelect
export type NewFlightSegment = typeof flightSegments.$inferInsert
