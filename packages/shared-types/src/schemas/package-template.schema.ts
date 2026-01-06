/**
 * Package Template Schemas
 *
 * Zod schemas for package template validation.
 * Templates store reusable package structures with metadata, day offsets and activities.
 */

import { z } from 'zod'
import { templateDayOffsetSchema } from './itinerary-template.schema'

// =============================================================================
// Package Metadata Schema
// =============================================================================

/**
 * Package metadata within a template
 */
export const packageTemplateMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  pricingType: z.enum(['flat_rate', 'per_person']),
  totalPriceCents: z.number().int().nullable().optional(),
  currency: z.string().max(3).nullable().optional(),
})

export type PackageTemplateMetadata = z.infer<typeof packageTemplateMetadataSchema>

// =============================================================================
// Package Template Payload Schema
// =============================================================================

/**
 * Package template payload - stored as JSONB
 */
export const packageTemplatePayloadSchema = z.object({
  packageMetadata: packageTemplateMetadataSchema,
  dayOffsets: z.array(templateDayOffsetSchema),
})

export type PackageTemplatePayload = z.infer<typeof packageTemplatePayloadSchema>

// =============================================================================
// CRUD Schemas
// =============================================================================

/**
 * Create package template DTO
 */
export const createPackageTemplateSchema = z.object({
  agencyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  payload: packageTemplatePayloadSchema,
})

export type CreatePackageTemplateDto = z.infer<typeof createPackageTemplateSchema>

/**
 * Update package template DTO (all fields optional)
 */
export const updatePackageTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  payload: packageTemplatePayloadSchema.optional(),
  isActive: z.boolean().optional(),
})

export type UpdatePackageTemplateDto = z.infer<typeof updatePackageTemplateSchema>

// =============================================================================
// Apply Schema
// =============================================================================

/**
 * Apply package template DTO
 */
export const applyPackageTemplateSchema = z.object({
  anchorDayId: z.string().uuid(), // Target day UUID
})

export type ApplyPackageTemplateDto = z.infer<typeof applyPackageTemplateSchema>

// =============================================================================
// Save as Template Schema
// =============================================================================

/**
 * Save package as template DTO
 */
export const savePackageAsTemplateSchema = z.object({
  agencyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
})

export type SavePackageAsTemplateDto = z.infer<typeof savePackageAsTemplateSchema>
