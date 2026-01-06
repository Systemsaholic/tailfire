/**
 * Lodging Details Schemas
 *
 * Zod schemas for Lodging DTOs.
 * Mirrors existing LodgingDetailsDto from components.types.ts.
 */

import { z } from 'zod'

// =============================================================================
// Lodging Details Schema
// =============================================================================

/**
 * Schema for lodging details.
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const lodgingDetailsDtoSchema = z.object({
  propertyName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  checkInDate: z.string().nullable().optional(),
  checkInTime: z.string().nullable().optional(),
  checkOutDate: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  roomType: z.string().nullable().optional(),
  roomCount: z.number().int().positive().nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  specialRequests: z.string().nullable().optional(),
})

export type LodgingDetailsDto = z.infer<typeof lodgingDetailsDtoSchema>
