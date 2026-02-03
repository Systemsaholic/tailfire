/**
 * Tour Day Details Service
 *
 * Handles CRUD operations for tour day-specific data.
 * Works with the tour_day_details table.
 */

import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type { TourDayDetailsDto } from '@tailfire/shared-types'

@Injectable()
export class TourDayDetailsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get tour day details for a component
   */
  async findByComponentId(activityId: string): Promise<TourDayDetailsDto | null> {
    const [details] = await this.db.client
      .select()
      .from(this.db.schema.tourDayDetails)
      .where(eq(this.db.schema.tourDayDetails.activityId, activityId))
      .limit(1)

    if (!details) {
      return null
    }

    return this.formatTourDayDetails(details)
  }

  /**
   * Create tour day details for a component
   */
  async create(activityId: string, data: TourDayDetailsDto): Promise<void> {
    await this.db.client.insert(this.db.schema.tourDayDetails).values({
      activityId,
      dayNumber: data.dayNumber ?? null,
      overnightCity: data.overnightCity || null,
      isLocked: data.isLocked ?? true,
    })
  }

  /**
   * Update tour day details for a component
   */
  async update(activityId: string, data: TourDayDetailsDto): Promise<void> {
    await this.db.client
      .update(this.db.schema.tourDayDetails)
      .set({
        ...(data.dayNumber !== undefined && { dayNumber: data.dayNumber }),
        ...(data.overnightCity !== undefined && { overnightCity: data.overnightCity }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.tourDayDetails.activityId, activityId))
  }

  /**
   * Delete tour day details for a component
   */
  async delete(activityId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.tourDayDetails)
      .where(eq(this.db.schema.tourDayDetails.activityId, activityId))
  }

  /**
   * Check if tour day details exist for a component
   */
  async exists(activityId: string): Promise<boolean> {
    const [row] = await this.db.client
      .select({ id: this.db.schema.tourDayDetails.id })
      .from(this.db.schema.tourDayDetails)
      .where(eq(this.db.schema.tourDayDetails.activityId, activityId))
      .limit(1)
    return !!row
  }

  /**
   * Upsert tour day details (create if not exists, update if exists)
   */
  async upsert(activityId: string, data: TourDayDetailsDto): Promise<void> {
    const exists = await this.exists(activityId)
    if (exists) {
      await this.update(activityId, data)
    } else {
      await this.create(activityId, data)
    }
  }

  /**
   * Format database row to DTO
   */
  private formatTourDayDetails(details: typeof this.db.schema.tourDayDetails.$inferSelect): TourDayDetailsDto {
    return {
      dayNumber: details.dayNumber,
      overnightCity: details.overnightCity,
      isLocked: details.isLocked,
    }
  }
}
