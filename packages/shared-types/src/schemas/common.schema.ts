/**
 * Common Schemas
 *
 * Zod schemas for shared nested types used across DTOs.
 */

import { z } from 'zod'

// =============================================================================
// Coordinates
// =============================================================================

export const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export type Coordinates = z.infer<typeof coordinatesSchema>

// =============================================================================
// Photo
// =============================================================================

export const photoSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
})

export type Photo = z.infer<typeof photoSchema>
