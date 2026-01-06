/**
 * Itinerary Template Schemas
 *
 * Zod schemas for itinerary template validation.
 * Templates store reusable itinerary structures with day offsets and activities.
 */

import { z } from 'zod'
import { activityTypeSchema } from './enums.schema'

// =============================================================================
// Shared Sub-Schemas
// =============================================================================

/**
 * Coordinates schema
 */
export const templateCoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

/**
 * Pricing schema for template activities
 */
export const templatePricingSchema = z.object({
  totalPriceCents: z.number().int().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),
  taxesCents: z.number().int().nullable().optional(),
  commissionAmountCents: z.number().int().nullable().optional(),
  commissionSplitPercent: z.number().nullable().optional(),
})

/**
 * Payment schedule item schema (relative timing)
 */
export const templatePaymentItemSchema = z.object({
  paymentName: z.string().min(1),
  percentage: z.number().nullable().optional(),
  fixedAmountCents: z.number().int().nullable().optional(),
  daysFromBooking: z.number().int().nullable().optional(),
  daysBeforeDeparture: z.number().int().nullable().optional(),
})

/**
 * Payment schedule schema
 */
export const templatePaymentScheduleSchema = z.object({
  scheduleType: z.string(),
  items: z.array(templatePaymentItemSchema),
})

/**
 * Media reference schema (URLs preserved)
 */
export const templateMediaSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string(),
  caption: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0),
})

// =============================================================================
// Template Activity Schema
// =============================================================================

/**
 * Template activity - represents a single activity within a template
 * Times are stored as HH:MM format (absolute dates stripped)
 */
export const templateActivitySchema = z.object({
  componentType: activityTypeSchema,
  activityType: activityTypeSchema,
  name: z.string().min(1),
  sequenceOrder: z.number().int().min(0),

  // Time handling (dates stripped, times preserved as HH:MM)
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format')
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format')
    .nullable()
    .optional(),
  timezone: z.string().nullable().optional(),

  // Location
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  coordinates: templateCoordinatesSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  confirmationNumber: z.string().nullable().optional(),

  // Pricing
  pricing: templatePricingSchema.optional(),

  // Payment schedule (relative timing)
  paymentSchedule: templatePaymentScheduleSchema.optional(),

  // Media references
  media: z.array(templateMediaSchema).optional(),

  // Type-specific details (opaque JSONB)
  details: z.record(z.unknown()).optional(),
})

export type TemplateActivity = z.infer<typeof templateActivitySchema>

// =============================================================================
// Itinerary Template Payload Schema
// =============================================================================

/**
 * Day offset within a template
 */
export const templateDayOffsetSchema = z.object({
  dayIndex: z.number().int().min(0),
  activities: z.array(templateActivitySchema),
})

/**
 * Itinerary template payload - stored as JSONB
 */
export const itineraryTemplatePayloadSchema = z.object({
  dayOffsets: z.array(templateDayOffsetSchema),
})

export type ItineraryTemplatePayload = z.infer<typeof itineraryTemplatePayloadSchema>

// =============================================================================
// CRUD Schemas
// =============================================================================

/**
 * Create itinerary template DTO
 */
export const createItineraryTemplateSchema = z.object({
  agencyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  payload: itineraryTemplatePayloadSchema,
})

export type CreateItineraryTemplateDto = z.infer<typeof createItineraryTemplateSchema>

/**
 * Update itinerary template DTO (all fields optional)
 */
export const updateItineraryTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  payload: itineraryTemplatePayloadSchema.optional(),
  isActive: z.boolean().optional(),
})

export type UpdateItineraryTemplateDto = z.infer<typeof updateItineraryTemplateSchema>

// =============================================================================
// Apply Schema
// =============================================================================

/**
 * Apply itinerary template DTO
 */
export const applyItineraryTemplateSchema = z.object({
  anchorDay: z.string().optional(), // ISO date string (YYYY-MM-DD), defaults to trip start
})

export type ApplyItineraryTemplateDto = z.infer<typeof applyItineraryTemplateSchema>

// =============================================================================
// Save as Template Schema
// =============================================================================

/**
 * Save itinerary as template DTO
 */
export const saveItineraryAsTemplateSchema = z.object({
  agencyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
})

export type SaveItineraryAsTemplateDto = z.infer<typeof saveItineraryAsTemplateSchema>
