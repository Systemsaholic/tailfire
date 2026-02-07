/**
 * Trip Access Service
 *
 * Core access control logic for trips.
 * Determines who can read/write trip data based on ownership and sharing.
 *
 * Access Levels:
 * - Admin: Full read/write access to all trips in agency
 * - Owner: Full read/write access to owned trips
 * - Write Share: Read/write access via explicit share (access_level = 'write')
 * - Read Share: Read-only access via explicit share (access_level = 'read')
 * - Agency (no share): No access to other users' trips
 *
 * NOTE: Unlike contacts (which have basic agency-wide visibility),
 * trips are private by default and require explicit sharing for access.
 */

import { Injectable } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type { AuthContext } from '../auth/auth.types'

export interface TripAccessResult {
  canRead: boolean
  canWrite: boolean
  reason: string
}

@Injectable()
export class TripAccessService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Check what level of access a user has to a trip
   */
  async canAccessTrip(
    tripId: string,
    auth: AuthContext,
  ): Promise<TripAccessResult> {
    // Admins have full access
    if (auth.role === 'admin') {
      return {
        canRead: true,
        canWrite: true,
        reason: 'Admin has full access',
      }
    }

    // Get the trip to check ownership
    const [trip] = await this.db.client
      .select({
        ownerId: this.db.schema.trips.ownerId,
        agencyId: this.db.schema.trips.agencyId,
      })
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, tripId))
      .limit(1)

    if (!trip) {
      return {
        canRead: false,
        canWrite: false,
        reason: 'Trip not found',
      }
    }

    // Check agency match
    if (trip.agencyId !== auth.agencyId) {
      return {
        canRead: false,
        canWrite: false,
        reason: 'Trip belongs to different agency',
      }
    }

    // Owner has full access
    if (trip.ownerId === auth.userId) {
      return {
        canRead: true,
        canWrite: true,
        reason: 'User owns this trip',
      }
    }

    // Check for explicit share
    const [share] = await this.db.client
      .select({ accessLevel: this.db.schema.tripShares.accessLevel })
      .from(this.db.schema.tripShares)
      .where(
        and(
          eq(this.db.schema.tripShares.tripId, tripId),
          eq(this.db.schema.tripShares.sharedWithUserId, auth.userId),
        ),
      )
      .limit(1)

    if (share) {
      if (share.accessLevel === 'write') {
        return {
          canRead: true,
          canWrite: true,
          reason: 'Write share granted',
        }
      }
      return {
        canRead: true,
        canWrite: false,
        reason: 'Read-only share granted',
      }
    }

    // Inbound trips (no owner) - agency users can view but not edit
    if (trip.ownerId === null) {
      return {
        canRead: true,
        canWrite: false,
        reason: 'Inbound trip (no owner) - read-only access',
      }
    }

    // Default: No access to other users' trips
    return {
      canRead: false,
      canWrite: false,
      reason: 'No access to this trip',
    }
  }

  /**
   * Quick check if user can read a trip
   * Use this for simple read permission checks
   */
  async canRead(tripId: string, auth: AuthContext): Promise<boolean> {
    const access = await this.canAccessTrip(tripId, auth)
    return access.canRead
  }

  /**
   * Quick check if user can write to a trip
   * Use this for simple write permission checks
   */
  async canWrite(tripId: string, auth: AuthContext): Promise<boolean> {
    const access = await this.canAccessTrip(tripId, auth)
    return access.canWrite
  }

  /**
   * Verify read access and throw ForbiddenException if not allowed
   * Returns the access result for additional context
   */
  async verifyReadAccess(
    tripId: string,
    auth: AuthContext,
  ): Promise<TripAccessResult> {
    const access = await this.canAccessTrip(tripId, auth)
    if (!access.canRead) {
      const { ForbiddenException } = await import('@nestjs/common')
      throw new ForbiddenException(access.reason)
    }
    return access
  }

  /**
   * Verify write access and throw ForbiddenException if not allowed
   * Returns the access result for additional context
   */
  async verifyWriteAccess(
    tripId: string,
    auth: AuthContext,
  ): Promise<TripAccessResult> {
    const access = await this.canAccessTrip(tripId, auth)
    if (!access.canWrite) {
      const { ForbiddenException } = await import('@nestjs/common')
      throw new ForbiddenException(
        access.canRead
          ? 'You have read-only access to this trip'
          : access.reason,
      )
    }
    return access
  }

  /**
   * Get all trips a user can access (for filtering queries)
   * Returns trip IDs the user can read
   */
  async getAccessibleTripIds(auth: AuthContext): Promise<string[] | 'all'> {
    // Admins can access all trips in agency
    if (auth.role === 'admin') {
      return 'all'
    }

    // Get owned trips
    const ownedTrips = await this.db.client
      .select({ id: this.db.schema.trips.id })
      .from(this.db.schema.trips)
      .where(
        and(
          eq(this.db.schema.trips.ownerId, auth.userId),
          eq(this.db.schema.trips.agencyId, auth.agencyId),
        ),
      )

    // Get shared trips
    const sharedTrips = await this.db.client
      .select({ tripId: this.db.schema.tripShares.tripId })
      .from(this.db.schema.tripShares)
      .where(eq(this.db.schema.tripShares.sharedWithUserId, auth.userId))

    // Get inbound trips (no owner - visible to all agency users)
    const inboundTrips = await this.db.client
      .select({ id: this.db.schema.trips.id })
      .from(this.db.schema.trips)
      .where(
        and(
          eq(this.db.schema.trips.agencyId, auth.agencyId),
          eq(this.db.schema.trips.status, 'inbound'),
        ),
      )

    // Combine all accessible trip IDs
    const tripIds = new Set<string>()
    for (const trip of ownedTrips) {
      tripIds.add(trip.id)
    }
    for (const share of sharedTrips) {
      tripIds.add(share.tripId)
    }
    for (const trip of inboundTrips) {
      tripIds.add(trip.id)
    }

    return Array.from(tripIds)
  }
}
