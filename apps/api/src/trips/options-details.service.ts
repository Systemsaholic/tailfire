/**
 * Options Details Service
 *
 * Handles CRUD operations for options-specific data (upsell options).
 * Works with the options_details table.
 */

import { Injectable, BadRequestException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type { OptionsDetailsDto, OptionCategory } from '@tailfire/shared-types'

// Valid option categories (must match DB CHECK constraint)
const VALID_CATEGORIES: OptionCategory[] = [
  'upgrade',
  'add_on',
  'tour',
  'excursion',
  'insurance',
  'meal_plan',
  'other',
]

@Injectable()
export class OptionsDetailsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get options details for a component
   */
  async findByComponentId(activityId: string): Promise<OptionsDetailsDto | null> {
    const [details] = await this.db.client
      .select()
      .from(this.db.schema.optionsDetails)
      .where(eq(this.db.schema.optionsDetails.activityId, activityId))
      .limit(1)

    if (!details) {
      return null
    }

    return this.formatOptionsDetails(details)
  }

  /**
   * Create options details for a component
   */
  async create(activityId: string, data: OptionsDetailsDto): Promise<void> {
    // Validate category if provided
    if (data.optionCategory && !VALID_CATEGORIES.includes(data.optionCategory)) {
      throw new BadRequestException(
        `Invalid option category: ${data.optionCategory}. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      )
    }

    // Validate numeric constraints
    this.validateNumericConstraints(data)

    await this.db.client.insert(this.db.schema.optionsDetails).values({
      activityId,
      optionCategory: data.optionCategory || null,
      isSelected: data.isSelected ?? false,
      availabilityStartDate: data.availabilityStartDate || null,
      availabilityEndDate: data.availabilityEndDate || null,
      bookingDeadline: data.bookingDeadline || null,
      minParticipants: data.minParticipants ?? null,
      maxParticipants: data.maxParticipants ?? null,
      spotsAvailable: data.spotsAvailable ?? null,
      durationMinutes: data.durationMinutes ?? null,
      meetingPoint: data.meetingPoint || null,
      meetingTime: data.meetingTime || null,
      providerName: data.providerName || null,
      providerPhone: data.providerPhone || null,
      providerEmail: data.providerEmail || null,
      providerWebsite: data.providerWebsite || null,
      inclusions: data.inclusions || [],
      exclusions: data.exclusions || [],
      requirements: data.requirements || [],
      whatToBring: data.whatToBring || [],
      displayOrder: data.displayOrder ?? null,
      highlightText: data.highlightText || null,
      instructionsText: data.instructionsText || null,
    })
  }

  /**
   * Update options details for a component
   */
  async update(activityId: string, data: OptionsDetailsDto): Promise<void> {
    // Validate category if provided
    if (data.optionCategory !== undefined && data.optionCategory !== null) {
      if (!VALID_CATEGORIES.includes(data.optionCategory)) {
        throw new BadRequestException(
          `Invalid option category: ${data.optionCategory}. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        )
      }
    }

    // Validate numeric constraints
    this.validateNumericConstraints(data)

    await this.db.client
      .update(this.db.schema.optionsDetails)
      .set({
        ...(data.optionCategory !== undefined && { optionCategory: data.optionCategory }),
        ...(data.isSelected !== undefined && { isSelected: data.isSelected }),
        ...(data.availabilityStartDate !== undefined && { availabilityStartDate: data.availabilityStartDate }),
        ...(data.availabilityEndDate !== undefined && { availabilityEndDate: data.availabilityEndDate }),
        ...(data.bookingDeadline !== undefined && { bookingDeadline: data.bookingDeadline }),
        ...(data.minParticipants !== undefined && { minParticipants: data.minParticipants }),
        ...(data.maxParticipants !== undefined && { maxParticipants: data.maxParticipants }),
        ...(data.spotsAvailable !== undefined && { spotsAvailable: data.spotsAvailable }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.meetingPoint !== undefined && { meetingPoint: data.meetingPoint }),
        ...(data.meetingTime !== undefined && { meetingTime: data.meetingTime }),
        ...(data.providerName !== undefined && { providerName: data.providerName }),
        ...(data.providerPhone !== undefined && { providerPhone: data.providerPhone }),
        ...(data.providerEmail !== undefined && { providerEmail: data.providerEmail }),
        ...(data.providerWebsite !== undefined && { providerWebsite: data.providerWebsite }),
        ...(data.inclusions !== undefined && { inclusions: data.inclusions }),
        ...(data.exclusions !== undefined && { exclusions: data.exclusions }),
        ...(data.requirements !== undefined && { requirements: data.requirements }),
        ...(data.whatToBring !== undefined && { whatToBring: data.whatToBring }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.highlightText !== undefined && { highlightText: data.highlightText }),
        ...(data.instructionsText !== undefined && { instructionsText: data.instructionsText }),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.optionsDetails.activityId, activityId))
  }

  /**
   * Delete options details (called automatically via cascade)
   */
  async delete(activityId: string): Promise<void> {
    await this.db.client
      .delete(this.db.schema.optionsDetails)
      .where(eq(this.db.schema.optionsDetails.activityId, activityId))
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Validate numeric constraints for service-side validation
   * (DB also has CHECK constraints as backup)
   */
  private validateNumericConstraints(data: OptionsDetailsDto): void {
    if (data.minParticipants !== undefined && data.minParticipants !== null && data.minParticipants < 0) {
      throw new BadRequestException('minParticipants must be >= 0')
    }
    if (data.maxParticipants !== undefined && data.maxParticipants !== null && data.maxParticipants < 0) {
      throw new BadRequestException('maxParticipants must be >= 0')
    }
    if (
      data.minParticipants !== undefined &&
      data.minParticipants !== null &&
      data.maxParticipants !== undefined &&
      data.maxParticipants !== null &&
      data.maxParticipants < data.minParticipants
    ) {
      throw new BadRequestException('maxParticipants must be >= minParticipants')
    }
    if (data.durationMinutes !== undefined && data.durationMinutes !== null && data.durationMinutes < 0) {
      throw new BadRequestException('durationMinutes must be >= 0')
    }
    if (data.spotsAvailable !== undefined && data.spotsAvailable !== null && data.spotsAvailable < 0) {
      throw new BadRequestException('spotsAvailable must be >= 0')
    }
  }

  private formatOptionsDetails(details: any): OptionsDetailsDto {
    return {
      optionCategory: details.optionCategory || null,
      isSelected: details.isSelected ?? false,
      availabilityStartDate: details.availabilityStartDate || null,
      availabilityEndDate: details.availabilityEndDate || null,
      bookingDeadline: details.bookingDeadline || null,
      minParticipants: details.minParticipants ?? null,
      maxParticipants: details.maxParticipants ?? null,
      spotsAvailable: details.spotsAvailable ?? null,
      durationMinutes: details.durationMinutes ?? null,
      meetingPoint: details.meetingPoint || null,
      meetingTime: details.meetingTime || null,
      providerName: details.providerName || null,
      providerPhone: details.providerPhone || null,
      providerEmail: details.providerEmail || null,
      providerWebsite: details.providerWebsite || null,
      inclusions: details.inclusions || [],
      exclusions: details.exclusions || [],
      requirements: details.requirements || [],
      whatToBring: details.whatToBring || [],
      displayOrder: details.displayOrder ?? null,
      highlightText: details.highlightText || null,
      instructionsText: details.instructionsText || null,
    }
  }
}
