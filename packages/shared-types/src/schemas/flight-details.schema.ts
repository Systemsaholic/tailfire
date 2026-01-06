/**
 * Flight Details Schemas
 *
 * Zod schemas for Flight DTOs.
 * Mirrors existing FlightDetailsDto and FlightSegmentDto from components.types.ts.
 */

import { z } from 'zod'

// =============================================================================
// Flight Segment Schema
// =============================================================================

/**
 * Schema for individual flight segment (leg of multi-segment journey).
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const flightSegmentDtoSchema = z.object({
  id: z.string().uuid().optional(),
  segmentOrder: z.number().int().nonnegative(),

  airline: z.string().nullable().optional(),
  flightNumber: z.string().nullable().optional(),

  // Departure details
  departureAirportCode: z.string().max(10).nullable().optional(),
  departureAirportName: z.string().nullable().optional(),
  departureAirportCity: z.string().nullable().optional(),
  departureAirportLat: z.number().nullable().optional(),
  departureAirportLon: z.number().nullable().optional(),
  departureDate: z.string().nullable().optional(),
  departureTime: z.string().nullable().optional(),
  departureTimezone: z.string().nullable().optional(),
  departureTerminal: z.string().nullable().optional(),
  departureGate: z.string().nullable().optional(),

  // Arrival details
  arrivalAirportCode: z.string().max(10).nullable().optional(),
  arrivalAirportName: z.string().nullable().optional(),
  arrivalAirportCity: z.string().nullable().optional(),
  arrivalAirportLat: z.number().nullable().optional(),
  arrivalAirportLon: z.number().nullable().optional(),
  arrivalDate: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  arrivalTimezone: z.string().nullable().optional(),
  arrivalTerminal: z.string().nullable().optional(),
  arrivalGate: z.string().nullable().optional(),

  // Aircraft details (from Aerodatabox)
  aircraftModel: z.string().nullable().optional(),
  aircraftRegistration: z.string().nullable().optional(),
  aircraftModeS: z.string().nullable().optional(),
  aircraftImageUrl: z.string().nullable().optional(),
  aircraftImageAuthor: z.string().nullable().optional(),
})

export type FlightSegmentDto = z.infer<typeof flightSegmentDtoSchema>

// =============================================================================
// Flight Details Schema
// =============================================================================

/**
 * Schema for flight details.
 * Supports both legacy single-segment (flat fields) and multi-segment (segments array).
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const flightDetailsDtoSchema = z.object({
  // Legacy single-segment fields (backwards compatibility)
  airline: z.string().nullable().optional(),
  flightNumber: z.string().nullable().optional(),
  departureAirportCode: z.string().max(10).nullable().optional(),
  departureDate: z.string().nullable().optional(),
  departureTime: z.string().nullable().optional(),
  departureTimezone: z.string().nullable().optional(),
  departureTerminal: z.string().nullable().optional(),
  departureGate: z.string().nullable().optional(),
  arrivalAirportCode: z.string().max(10).nullable().optional(),
  arrivalDate: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  arrivalTimezone: z.string().nullable().optional(),
  arrivalTerminal: z.string().nullable().optional(),
  arrivalGate: z.string().nullable().optional(),

  // Multi-segment support
  segments: z.array(flightSegmentDtoSchema).optional(),
})

export type FlightDetailsDto = z.infer<typeof flightDetailsDtoSchema>
