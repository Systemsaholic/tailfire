/**
 * Activity Travelers Service
 *
 * Manages the link between travelers and activities.
 * Primarily used for package activities but can be used for any activity type.
 *
 * Uses the activity_travelers junction table which replaces the old package_travelers table.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and, inArray } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'

export interface ActivityTravelerDto {
  id: string
  activityId: string
  tripTravelerId: string
  travelerName: string
  createdAt: string
}

export interface LinkTravelersDto {
  tripTravelerIds: string[]
}

@Injectable()
export class ActivityTravelersService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all travelers linked to an activity
   */
  async findByActivityId(activityId: string): Promise<ActivityTravelerDto[]> {
    // Join through tripTravelers -> contacts to get names
    const results = await this.db.client
      .select({
        id: this.db.schema.activityTravelers.id,
        activityId: this.db.schema.activityTravelers.activityId,
        tripTravelerId: this.db.schema.activityTravelers.tripTravelerId,
        createdAt: this.db.schema.activityTravelers.createdAt,
        contactSnapshot: this.db.schema.tripTravelers.contactSnapshot,
        contactFirstName: this.db.schema.contacts.firstName,
        contactLastName: this.db.schema.contacts.lastName,
      })
      .from(this.db.schema.activityTravelers)
      .innerJoin(
        this.db.schema.tripTravelers,
        eq(this.db.schema.activityTravelers.tripTravelerId, this.db.schema.tripTravelers.id)
      )
      .leftJoin(
        this.db.schema.contacts,
        eq(this.db.schema.tripTravelers.contactId, this.db.schema.contacts.id)
      )
      .where(eq(this.db.schema.activityTravelers.activityId, activityId))

    return results.map((r) => {
      // Prefer contactSnapshot (booking-time data), fall back to linked contact
      const snapshot = r.contactSnapshot as { firstName?: string; lastName?: string } | null
      const firstName = snapshot?.firstName || r.contactFirstName || ''
      const lastName = snapshot?.lastName || r.contactLastName || ''
      return {
        id: r.id,
        activityId: r.activityId,
        tripTravelerId: r.tripTravelerId,
        travelerName: `${firstName} ${lastName}`.trim() || 'Unknown',
        createdAt: r.createdAt.toISOString(),
      }
    })
  }

  /**
   * Link travelers to an activity
   * Skips duplicates (uses onConflictDoNothing)
   */
  async linkTravelers(activityId: string, dto: LinkTravelersDto): Promise<ActivityTravelerDto[]> {
    if (dto.tripTravelerIds.length === 0) {
      return this.findByActivityId(activityId)
    }

    // Verify activity exists
    const [activity] = await this.db.client
      .select({
        id: this.db.schema.itineraryActivities.id,
      })
      .from(this.db.schema.itineraryActivities)
      .where(eq(this.db.schema.itineraryActivities.id, activityId))
      .limit(1)

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`)
    }

    // Verify all travelers exist
    const travelers = await this.db.client
      .select({
        id: this.db.schema.tripTravelers.id,
        tripId: this.db.schema.tripTravelers.tripId,
      })
      .from(this.db.schema.tripTravelers)
      .where(inArray(this.db.schema.tripTravelers.id, dto.tripTravelerIds))

    if (travelers.length !== dto.tripTravelerIds.length) {
      throw new BadRequestException('One or more traveler IDs are invalid')
    }

    // Insert with conflict handling (skip duplicates)
    const tripId = travelers[0]?.tripId
    if (!tripId) {
      throw new BadRequestException('Unable to resolve tripId for travelers')
    }
    const hasMixedTrips = travelers.some((traveler) => traveler.tripId !== tripId)
    if (hasMixedTrips) {
      throw new BadRequestException('All travelers must belong to the same trip')
    }

    const values = dto.tripTravelerIds.map((tripTravelerId) => ({
      tripId,
      activityId,
      tripTravelerId,
    }))

    await this.db.client
      .insert(this.db.schema.activityTravelers)
      .values(values)
      .onConflictDoNothing()

    return this.findByActivityId(activityId)
  }

  /**
   * Unlink specific travelers from an activity
   */
  async unlinkTravelers(activityId: string, tripTravelerIds: string[]): Promise<ActivityTravelerDto[]> {
    if (tripTravelerIds.length === 0) {
      return this.findByActivityId(activityId)
    }

    await this.db.client
      .delete(this.db.schema.activityTravelers)
      .where(
        and(
          eq(this.db.schema.activityTravelers.activityId, activityId),
          inArray(this.db.schema.activityTravelers.tripTravelerId, tripTravelerIds)
        )
      )

    return this.findByActivityId(activityId)
  }

  /**
   * Unlink all travelers from an activity
   */
  async unlinkAllTravelers(activityId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.activityTravelers)
      .where(eq(this.db.schema.activityTravelers.activityId, activityId))
  }

  /**
   * Get traveler count for an activity
   */
  async getTravelerCount(activityId: string): Promise<number> {
    const travelers = await this.findByActivityId(activityId)
    return travelers.length
  }

  /**
   * Copy travelers from one activity to another (used in duplication)
   */
  async copyTravelers(sourceActivityId: string, targetActivityId: string): Promise<void> {
    const sourceTravelers = await this.db.client
      .select({
        tripTravelerId: this.db.schema.activityTravelers.tripTravelerId,
        tripId: this.db.schema.activityTravelers.tripId,
      })
      .from(this.db.schema.activityTravelers)
      .where(eq(this.db.schema.activityTravelers.activityId, sourceActivityId))

    if (sourceTravelers.length === 0) {
      return
    }

    const [targetActivity] = await this.db.client
      .select({ id: this.db.schema.itineraryActivities.id })
      .from(this.db.schema.itineraryActivities)
      .where(eq(this.db.schema.itineraryActivities.id, targetActivityId))
      .limit(1)

    if (!targetActivity) {
      throw new NotFoundException(`Activity ${targetActivityId} not found`)
    }

    const sourceTripId = sourceTravelers[0]?.tripId
    if (!sourceTripId) {
      return
    }

    const values = sourceTravelers.map((t) => ({
      tripId: sourceTripId,
      activityId: targetActivityId,
      tripTravelerId: t.tripTravelerId,
    }))

    await this.db.client
      .insert(this.db.schema.activityTravelers)
      .values(values)
      .onConflictDoNothing()
  }
}
