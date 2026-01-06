/**
 * Dining Details Schemas
 *
 * Zod schemas for Dining DTOs.
 * Mirrors existing DiningDetailsDto from components.types.ts.
 */

import { z } from 'zod'
import { coordinatesSchema } from './common.schema'

// =============================================================================
// Dining Details Schema
// =============================================================================

/**
 * Schema for dining details.
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const diningDetailsDtoSchema = z.object({
  restaurantName: z.string().nullable().optional(),
  cuisineType: z.string().nullable().optional(),
  mealType: z.string().nullable().optional(),
  reservationDate: z.string().nullable().optional(),
  reservationTime: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  partySize: z.number().int().min(1).max(100).nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  coordinates: coordinatesSchema.nullable().optional(),
  priceRange: z.string().nullable().optional(),
  dressCode: z.string().nullable().optional(),
  dietaryRequirements: z.array(z.string()).nullable().optional(),
  specialRequests: z.string().nullable().optional(),
  menuUrl: z.string().nullable().optional(),
})

export type DiningDetailsDto = z.infer<typeof diningDetailsDtoSchema>
