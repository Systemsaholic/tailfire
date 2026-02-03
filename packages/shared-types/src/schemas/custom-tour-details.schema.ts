/**
 * Custom Tour Details Schemas
 *
 * Zod schemas for Custom Tour DTOs.
 * Mirrors CustomTourDetailsDto from components.types.ts.
 */

import { z } from 'zod'

// =============================================================================
// Tour Itinerary Day Schema
// =============================================================================

export const tourItineraryDaySchema = z.object({
  dayNumber: z.number().int(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  overnightCity: z.string().nullable().optional(),
})

export type TourItineraryDay = z.infer<typeof tourItineraryDaySchema>

// =============================================================================
// Tour Hotel Schema
// =============================================================================

export const tourHotelSchema = z.object({
  dayNumber: z.number().int().nullable().optional(),
  hotelName: z.string(),
  city: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export type TourHotel = z.infer<typeof tourHotelSchema>

// =============================================================================
// Tour Inclusion Schema
// =============================================================================

export const tourInclusionSchema = z.object({
  inclusionType: z.enum(['included', 'excluded', 'highlight']),
  category: z.string().nullable().optional(),
  description: z.string(),
})

export type TourInclusion = z.infer<typeof tourInclusionSchema>

// =============================================================================
// Custom Tour Details Schema
// =============================================================================

/**
 * Schema for custom tour details.
 * Used for tour bookings from catalog.
 * All fields nullable/optional to match existing DTO permissiveness.
 */
export const customTourDetailsDtoSchema = z.object({
  // Catalog linkage
  tourId: z.string().uuid().nullable().optional(),
  operatorCode: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  providerIdentifier: z.string().nullable().optional(),

  // Departure selection
  departureId: z.string().uuid().nullable().optional(),
  departureCode: z.string().nullable().optional(),
  departureStartDate: z.string().nullable().optional(),
  departureEndDate: z.string().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  basePriceCents: z.number().int().nullable().optional(),

  // Snapshot/metadata
  tourName: z.string().nullable().optional(),
  days: z.number().int().nonnegative().nullable().optional(),
  nights: z.number().int().nonnegative().nullable().optional(),
  startCity: z.string().nullable().optional(),
  endCity: z.string().nullable().optional(),

  // JSON data
  itineraryJson: z.array(tourItineraryDaySchema).nullable().optional(),
  inclusionsJson: z.array(tourInclusionSchema).nullable().optional(),
  hotelsJson: z.array(tourHotelSchema).nullable().optional(),
})

export type CustomTourDetailsSchema = z.infer<typeof customTourDetailsDtoSchema>

// =============================================================================
// Tour Day Details Schema (for tour_day child activities)
// =============================================================================

export const tourDayDetailsDtoSchema = z.object({
  dayNumber: z.number().int().nullable().optional(),
  overnightCity: z.string().nullable().optional(),
  isLocked: z.boolean().nullable().optional(),
})

export type TourDayDetailsSchema = z.infer<typeof tourDayDetailsDtoSchema>
