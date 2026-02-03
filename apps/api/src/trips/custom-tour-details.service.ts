/**
 * Custom Tour Details Service
 *
 * Handles CRUD operations for custom tour-specific data.
 * Works with the custom_tour_details table.
 */

import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type { CustomTourDetailsDto } from '@tailfire/shared-types'

@Injectable()
export class CustomTourDetailsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get custom tour details for a component
   */
  async findByComponentId(activityId: string): Promise<CustomTourDetailsDto | null> {
    const [details] = await this.db.client
      .select()
      .from(this.db.schema.customTourDetails)
      .where(eq(this.db.schema.customTourDetails.activityId, activityId))
      .limit(1)

    if (!details) {
      return null
    }

    return this.formatCustomTourDetails(details)
  }

  /**
   * Create custom tour details for a component
   */
  async create(activityId: string, data: CustomTourDetailsDto): Promise<void> {
    await this.db.client.insert(this.db.schema.customTourDetails).values({
      activityId,

      // Catalog linkage
      tourId: data.tourId || null,
      operatorCode: data.operatorCode || null,
      provider: data.provider || 'globus',
      providerIdentifier: data.providerIdentifier || null,

      // Departure selection
      departureId: data.departureId || null,
      departureCode: data.departureCode || null,
      departureStartDate: data.departureStartDate || null,
      departureEndDate: data.departureEndDate || null,
      currency: data.currency || 'CAD',
      basePriceCents: data.basePriceCents ?? null,

      // Snapshot/metadata
      tourName: data.tourName || null,
      days: data.days ?? null,
      nights: data.nights ?? null,
      startCity: data.startCity || null,
      endCity: data.endCity || null,

      // JSON data
      itineraryJson: data.itineraryJson || [],
      inclusionsJson: data.inclusionsJson || [],
      hotelsJson: data.hotelsJson || [],
    })
  }

  /**
   * Update custom tour details for a component
   */
  async update(activityId: string, data: CustomTourDetailsDto): Promise<void> {
    await this.db.client
      .update(this.db.schema.customTourDetails)
      .set({
        // Catalog linkage
        ...(data.tourId !== undefined && { tourId: data.tourId }),
        ...(data.operatorCode !== undefined && { operatorCode: data.operatorCode }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.providerIdentifier !== undefined && { providerIdentifier: data.providerIdentifier }),

        // Departure selection
        ...(data.departureId !== undefined && { departureId: data.departureId }),
        ...(data.departureCode !== undefined && { departureCode: data.departureCode }),
        ...(data.departureStartDate !== undefined && { departureStartDate: data.departureStartDate }),
        ...(data.departureEndDate !== undefined && { departureEndDate: data.departureEndDate }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.basePriceCents !== undefined && { basePriceCents: data.basePriceCents }),

        // Snapshot/metadata
        ...(data.tourName !== undefined && { tourName: data.tourName }),
        ...(data.days !== undefined && { days: data.days }),
        ...(data.nights !== undefined && { nights: data.nights }),
        ...(data.startCity !== undefined && { startCity: data.startCity }),
        ...(data.endCity !== undefined && { endCity: data.endCity }),

        // JSON data
        ...(data.itineraryJson !== undefined && { itineraryJson: data.itineraryJson }),
        ...(data.inclusionsJson !== undefined && { inclusionsJson: data.inclusionsJson }),
        ...(data.hotelsJson !== undefined && { hotelsJson: data.hotelsJson }),

        // Update timestamp
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.customTourDetails.activityId, activityId))
  }

  /**
   * Delete custom tour details for a component
   */
  async delete(activityId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.customTourDetails)
      .where(eq(this.db.schema.customTourDetails.activityId, activityId))
  }

  /**
   * Check if custom tour details exist for a component
   */
  async exists(activityId: string): Promise<boolean> {
    const [row] = await this.db.client
      .select({ id: this.db.schema.customTourDetails.id })
      .from(this.db.schema.customTourDetails)
      .where(eq(this.db.schema.customTourDetails.activityId, activityId))
      .limit(1)
    return !!row
  }

  /**
   * Upsert custom tour details (create if not exists, update if exists)
   */
  async upsert(activityId: string, data: CustomTourDetailsDto): Promise<void> {
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
  private formatCustomTourDetails(details: typeof this.db.schema.customTourDetails.$inferSelect): CustomTourDetailsDto {
    return {
      tourId: details.tourId,
      operatorCode: details.operatorCode,
      provider: details.provider,
      providerIdentifier: details.providerIdentifier,
      departureId: details.departureId,
      departureCode: details.departureCode,
      departureStartDate: details.departureStartDate,
      departureEndDate: details.departureEndDate,
      currency: details.currency,
      basePriceCents: details.basePriceCents,
      tourName: details.tourName,
      days: details.days,
      nights: details.nights,
      startCity: details.startCity,
      endCity: details.endCity,
      itineraryJson: (details.itineraryJson ?? []) as CustomTourDetailsDto['itineraryJson'],
      inclusionsJson: (details.inclusionsJson ?? []) as CustomTourDetailsDto['inclusionsJson'],
      hotelsJson: (details.hotelsJson ?? []) as CustomTourDetailsDto['hotelsJson'],
    }
  }
}
