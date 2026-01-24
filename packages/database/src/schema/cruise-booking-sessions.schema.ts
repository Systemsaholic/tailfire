/**
 * Cruise Booking Sessions Schema
 *
 * Ephemeral FusionAPI session state for cruise booking flow.
 * Supports three booking flows: agent, client_handoff, ota
 *
 * This is separate from the durable booking data in custom_cruise_details.
 * Sessions have a lifecycle: active → completed/expired/cancelled
 */

import { pgTable, uuid, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { itineraryActivities } from './activities.schema'
import { trips, tripTravelers } from './trips.schema'
import { userProfiles } from './user-profiles.schema'

// ============================================================================
// ENUMS (as const arrays for TypeScript + CHECK constraints in migration)
// ============================================================================

export const BOOKING_SESSION_STATUSES = ['active', 'expired', 'completed', 'cancelled'] as const
export type BookingSessionStatus = (typeof BOOKING_SESSION_STATUSES)[number]

export const BOOKING_FLOW_TYPES = ['agent', 'client_handoff', 'ota'] as const
export type BookingFlowType = (typeof BOOKING_FLOW_TYPES)[number]

export const IDEMPOTENCY_STATUSES = ['pending', 'success', 'failed'] as const
export type IdempotencyStatus = (typeof IDEMPOTENCY_STATUSES)[number]

// ============================================================================
// TABLE: cruise_booking_sessions
// ============================================================================

/**
 * Ephemeral FusionAPI session state for cruise booking flow.
 *
 * Key fields:
 * - session_key: FusionAPI sessionkey (varchar for compatibility with API response)
 * - session_expires_at: When the FusionAPI session expires (~2 hours)
 * - hold_expires_at: When the cabin hold expires (typically 15-30 min)
 *
 * Partial unique index ensures only one ACTIVE session per activity,
 * while allowing historical records.
 */
export const cruiseBookingSessions = pgTable('cruise_booking_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .references(() => userProfiles.id, { onDelete: 'set null' }),
  tripId: uuid('trip_id')
    .references(() => trips.id, { onDelete: 'cascade' }),
  tripTravelerId: uuid('trip_traveler_id')
    .references(() => tripTravelers.id, { onDelete: 'set null' }),

  // Session status (lifecycle management)
  status: varchar('status', { length: 20 }).notNull().default('active'),
  // CHECK constraint in migration: status IN ('active', 'expired', 'completed', 'cancelled')

  // Booking flow type
  flowType: varchar('flow_type', { length: 20 }).notNull(),
  // CHECK constraint in migration: flow_type IN ('agent', 'client_handoff', 'ota')

  // FusionAPI session state (varchar not uuid - API may return non-UUID strings)
  sessionKey: varchar('session_key', { length: 100 }).notNull(),
  sessionExpiresAt: timestamp('session_expires_at', { withTimezone: true }).notNull(),

  // Search context (needed for replay/re-booking)
  codetocruiseid: varchar('codetocruiseid', { length: 100 }),
  resultNo: varchar('result_no', { length: 100 }),

  // Selection state (needed to restore if transient failure)
  fareCode: varchar('fare_code', { length: 50 }),
  gradeNo: integer('grade_no'),
  cabinNo: varchar('cabin_no', { length: 20 }),

  // Basket state
  basketItemKey: varchar('basket_item_key', { length: 100 }),
  cabinResult: varchar('cabin_result', { length: 100 }),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// TABLE: cruise_booking_idempotency
// ============================================================================

/**
 * Idempotency tracking for cruise booking retries.
 * Separate from session table to allow multiple booking attempts per activity.
 *
 * The idempotency_key is client-generated UUID for retry safety.
 * TTL is 24 hours; cleanup job should delete expired records.
 */
export const cruiseBookingIdempotency = pgTable('cruise_booking_idempotency', {
  id: uuid('id').primaryKey().defaultRandom(),
  idempotencyKey: uuid('idempotency_key').notNull().unique(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => itineraryActivities.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Booking result
  bookingRef: varchar('booking_ref', { length: 100 }),
  bookingResponse: jsonb('booking_response'),

  // Status: pending → success/failed
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // CHECK constraint in migration: status IN ('pending', 'success', 'failed')

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true })
    .notNull()
    .default(sql`(now() + interval '24 hours')`),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const cruiseBookingSessionsRelations = relations(cruiseBookingSessions, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [cruiseBookingSessions.activityId],
    references: [itineraryActivities.id],
  }),
  user: one(userProfiles, {
    fields: [cruiseBookingSessions.userId],
    references: [userProfiles.id],
  }),
  trip: one(trips, {
    fields: [cruiseBookingSessions.tripId],
    references: [trips.id],
  }),
  tripTraveler: one(tripTravelers, {
    fields: [cruiseBookingSessions.tripTravelerId],
    references: [tripTravelers.id],
  }),
}))

export const cruiseBookingIdempotencyRelations = relations(cruiseBookingIdempotency, ({ one }) => ({
  activity: one(itineraryActivities, {
    fields: [cruiseBookingIdempotency.activityId],
    references: [itineraryActivities.id],
  }),
  user: one(userProfiles, {
    fields: [cruiseBookingIdempotency.userId],
    references: [userProfiles.id],
  }),
}))

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type CruiseBookingSession = typeof cruiseBookingSessions.$inferSelect
export type NewCruiseBookingSession = typeof cruiseBookingSessions.$inferInsert

export type CruiseBookingIdempotency = typeof cruiseBookingIdempotency.$inferSelect
export type NewCruiseBookingIdempotency = typeof cruiseBookingIdempotency.$inferInsert
