/**
 * Database Entity Types
 *
 * These types are inferred from the Drizzle schema in @tailfire/database.
 * Use these for type-safe database queries and mutations.
 *
 * @example
 * ```typescript
 * import type { Trip, Contact } from '@tailfire/shared-types/database'
 *
 * const trip: Trip = {
 *   id: 'uuid',
 *   name: 'Hawaiian Adventure',
 *   // ...
 * }
 * ```
 */

import { schema } from '@tailfire/database'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'

const {
  contacts,
  contactRelationships,
  contactGroups,
  contactGroupMembers,
  trips,
  tripCollaborators,
  tripTravelers,
  travelerGroups,
  travelerGroupMembers,
  itineraries,
} = schema as {
  contacts: PgTableWithColumns<any>
  contactRelationships: PgTableWithColumns<any>
  contactGroups: PgTableWithColumns<any>
  contactGroupMembers: PgTableWithColumns<any>
  trips: PgTableWithColumns<any>
  tripCollaborators: PgTableWithColumns<any>
  tripTravelers: PgTableWithColumns<any>
  travelerGroups: PgTableWithColumns<any>
  travelerGroupMembers: PgTableWithColumns<any>
  itineraries: PgTableWithColumns<any>
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export type Contact = typeof contacts.$inferSelect
export type ContactInsert = typeof contacts.$inferInsert

export type ContactRelationship = typeof contactRelationships.$inferSelect
export type ContactRelationshipInsert = typeof contactRelationships.$inferInsert

export type ContactGroup = typeof contactGroups.$inferSelect
export type ContactGroupInsert = typeof contactGroups.$inferInsert

export type ContactGroupMember = typeof contactGroupMembers.$inferSelect
export type ContactGroupMemberInsert = typeof contactGroupMembers.$inferInsert

// ============================================================================
// TRIP TYPES
// ============================================================================

export type Trip = typeof trips.$inferSelect
export type TripInsert = typeof trips.$inferInsert

export type TripCollaborator = typeof tripCollaborators.$inferSelect
export type TripCollaboratorInsert = typeof tripCollaborators.$inferInsert

export type TripTraveler = typeof tripTravelers.$inferSelect
export type TripTravelerInsert = typeof tripTravelers.$inferInsert

export type TravelerGroup = typeof travelerGroups.$inferSelect
export type TravelerGroupInsert = typeof travelerGroups.$inferInsert

export type TravelerGroupMember = typeof travelerGroupMembers.$inferSelect
export type TravelerGroupMemberInsert = typeof travelerGroupMembers.$inferInsert

export type Itinerary = typeof itineraries.$inferSelect
export type ItineraryInsert = typeof itineraries.$inferInsert
