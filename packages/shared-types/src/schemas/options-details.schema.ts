/**
 * Options Details Schemas
 *
 * Zod schemas for Options DTOs.
 * Mirrors existing OptionsDetailsDto from components.types.ts.
 */

import { z } from 'zod'

// =============================================================================
// Option Category Enum
// =============================================================================

export const optionCategorySchema = z.enum([
  'upgrade',
  'add_on',
  'tour',
  'excursion',
  'insurance',
  'meal_plan',
  'other',
])

export type OptionCategory = z.infer<typeof optionCategorySchema>

// =============================================================================
// Options Details Schema
// =============================================================================

/**
 * Schema for options details (upsell options: upgrades, tours, excursions, etc.).
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const optionsDetailsDtoSchema = z.object({
  // Option Classification
  optionCategory: optionCategorySchema.nullable().optional(),

  // Selection & Availability
  isSelected: z.boolean().nullable().optional(),
  availabilityStartDate: z.string().nullable().optional(),
  availabilityEndDate: z.string().nullable().optional(),
  bookingDeadline: z.string().nullable().optional(),

  // Capacity
  minParticipants: z.number().int().nonnegative().nullable().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  spotsAvailable: z.number().int().nonnegative().nullable().optional(),

  // Duration
  durationMinutes: z.number().int().nonnegative().nullable().optional(),
  meetingPoint: z.string().nullable().optional(),
  meetingTime: z.string().nullable().optional(),

  // Provider/Vendor information
  providerName: z.string().nullable().optional(),
  providerPhone: z.string().nullable().optional(),
  providerEmail: z.string().nullable().optional(),
  providerWebsite: z.string().nullable().optional(),

  // Details (arrays - always returns [] not null in responses)
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  whatToBring: z.array(z.string()).optional(),

  // Display
  displayOrder: z.number().int().nonnegative().nullable().optional(),
  highlightText: z.string().nullable().optional(),
  instructionsText: z.string().nullable().optional(),
})

export type OptionsDetailsDto = z.infer<typeof optionsDetailsDtoSchema>
