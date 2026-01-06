/**
 * Port Info Details Schemas
 *
 * Zod schemas for Port Info DTOs.
 * Mirrors existing PortInfoDetailsDto from components.types.ts.
 */

import { z } from 'zod'
import { portTypeSchema } from './enums.schema'
import { coordinatesSchema } from './common.schema'

// =============================================================================
// Port Info Details Schema
// =============================================================================

/**
 * Schema for port info details.
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const portInfoDetailsDtoSchema = z.object({
  portType: portTypeSchema.nullable().optional(),
  portName: z.string().nullable().optional(),
  portLocation: z.string().nullable().optional(),
  arrivalDate: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  departureDate: z.string().nullable().optional(),
  departureTime: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  dockName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  coordinates: coordinatesSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  excursionNotes: z.string().nullable().optional(),
  tenderRequired: z.boolean().nullable().optional(),
  specialRequests: z.string().nullable().optional(),
})

export type PortInfoDetailsDto = z.infer<typeof portInfoDetailsDtoSchema>
