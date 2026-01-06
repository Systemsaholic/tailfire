/**
 * Port Info Details Service
 *
 * Handles CRUD operations for port info-specific data.
 * Works with the port_info_details table.
 */

import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type { PortInfoDetailsDto } from '@tailfire/shared-types'

@Injectable()
export class PortInfoDetailsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get port info details for a component
   */
  async findByComponentId(activityId: string): Promise<PortInfoDetailsDto | null> {
    const [details] = await this.db.client
      .select()
      .from(this.db.schema.portInfoDetails)
      .where(eq(this.db.schema.portInfoDetails.activityId, activityId))
      .limit(1)

    if (!details) {
      return null
    }

    return this.formatPortInfoDetails(details)
  }

  /**
   * Create port info details for a component
   */
  async create(activityId: string, data: PortInfoDetailsDto): Promise<void> {
    await this.db.client.insert(this.db.schema.portInfoDetails).values({
      activityId,
      portName: data.portName || null,
      portLocation: data.portLocation || null,
      arrivalDate: data.arrivalDate || null,
      arrivalTime: data.arrivalTime || null,
      departureDate: data.departureDate || null,
      departureTime: data.departureTime || null,
      timezone: data.timezone || null,
      dockName: data.dockName || null,
      address: data.address || null,
      coordinates: data.coordinates || null,
      phone: data.phone || null,
      website: data.website || null,
      excursionNotes: data.excursionNotes || null,
      tenderRequired: data.tenderRequired ?? false,
      specialRequests: data.specialRequests || null,
    })
  }

  /**
   * Bulk create port info details for multiple activities
   * Used for optimized cruise port schedule generation
   */
  async bulkCreate(items: Array<{ activityId: string; data: PortInfoDetailsDto }>): Promise<void> {
    if (items.length === 0) return

    const values = items.map(({ activityId, data }) => ({
      activityId,
      portName: data.portName || null,
      portLocation: data.portLocation || null,
      arrivalDate: data.arrivalDate || null,
      arrivalTime: data.arrivalTime || null,
      departureDate: data.departureDate || null,
      departureTime: data.departureTime || null,
      timezone: data.timezone || null,
      dockName: data.dockName || null,
      address: data.address || null,
      coordinates: data.coordinates || null,
      phone: data.phone || null,
      website: data.website || null,
      excursionNotes: data.excursionNotes || null,
      tenderRequired: data.tenderRequired ?? false,
      specialRequests: data.specialRequests || null,
    }))

    await this.db.client.insert(this.db.schema.portInfoDetails).values(values)
  }

  /**
   * Update port info details for a component
   */
  async update(activityId: string, data: PortInfoDetailsDto): Promise<void> {
    await this.db.client
      .update(this.db.schema.portInfoDetails)
      .set({
        ...(data.portName !== undefined && { portName: data.portName }),
        ...(data.portLocation !== undefined && { portLocation: data.portLocation }),
        ...(data.arrivalDate !== undefined && { arrivalDate: data.arrivalDate }),
        ...(data.arrivalTime !== undefined && { arrivalTime: data.arrivalTime }),
        ...(data.departureDate !== undefined && { departureDate: data.departureDate }),
        ...(data.departureTime !== undefined && { departureTime: data.departureTime }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.dockName !== undefined && { dockName: data.dockName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.coordinates !== undefined && { coordinates: data.coordinates }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.excursionNotes !== undefined && { excursionNotes: data.excursionNotes }),
        ...(data.tenderRequired !== undefined && { tenderRequired: data.tenderRequired }),
        ...(data.specialRequests !== undefined && { specialRequests: data.specialRequests }),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.portInfoDetails.activityId, activityId))
  }

  /**
   * Delete port info details (called automatically via cascade)
   */
  async delete(activityId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.portInfoDetails)
      .where(eq(this.db.schema.portInfoDetails.activityId, activityId))
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatPortInfoDetails(details: any): PortInfoDetailsDto {
    return {
      portName: details.portName || null,
      portLocation: details.portLocation || null,
      arrivalDate: details.arrivalDate || null,
      arrivalTime: details.arrivalTime || null,
      departureDate: details.departureDate || null,
      departureTime: details.departureTime || null,
      timezone: details.timezone || null,
      dockName: details.dockName || null,
      address: details.address || null,
      coordinates: details.coordinates || null,
      phone: details.phone || null,
      website: details.website || null,
      excursionNotes: details.excursionNotes || null,
      tenderRequired: details.tenderRequired ?? false,
      specialRequests: details.specialRequests || null,
    }
  }
}
