/**
 * Suppliers API Types
 *
 * TypeScript definitions for supplier management endpoints.
 * Shared between API (NestJS) and client (React/Next.js).
 */

// =============================================================================
// Contact Information
// =============================================================================

/**
 * Supplier contact information stored as JSONB
 */
export interface SupplierContactInfo {
  email?: string
  phone?: string
  website?: string
  address?: string
}

// =============================================================================
// Response DTOs
// =============================================================================

/**
 * Supplier Response DTO
 * Represents a supplier in the system
 */
export interface SupplierDto {
  id: string
  name: string
  legalName: string | null
  supplierType: string | null
  contactInfo: SupplierContactInfo | null
  defaultCommissionRate: string | null
  isActive: boolean
  isPreferred: boolean
  notes: string | null
  defaultTermsAndConditions: string | null
  defaultCancellationPolicy: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Supplier List Response DTO
 * Paginated list of suppliers
 */
export interface SupplierListResponseDto {
  suppliers: SupplierDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// =============================================================================
// Request DTOs
// =============================================================================

/**
 * Create Supplier DTO
 */
export interface CreateSupplierDto {
  name: string
  legalName?: string
  supplierType?: string
  contactInfo?: SupplierContactInfo
  defaultCommissionRate?: string
  isActive?: boolean
  isPreferred?: boolean
  notes?: string
  defaultTermsAndConditions?: string
  defaultCancellationPolicy?: string
}

/**
 * Update Supplier DTO
 */
export interface UpdateSupplierDto {
  name?: string
  legalName?: string
  supplierType?: string
  contactInfo?: SupplierContactInfo
  defaultCommissionRate?: string
  isActive?: boolean
  isPreferred?: boolean
  notes?: string
  defaultTermsAndConditions?: string
  defaultCancellationPolicy?: string
}

/**
 * List Suppliers Query Params DTO
 */
export interface ListSuppliersParamsDto {
  /** Search by name */
  search?: string
  /** Filter by supplier type */
  supplierType?: string
  /** Filter by active status */
  isActive?: boolean
  /** Page number (1-based) */
  page?: number
  /** Items per page */
  limit?: number
}

// =============================================================================
// Supplier Types Constants
// =============================================================================

/**
 * Common supplier types
 */
export const SUPPLIER_TYPES = [
  'hotel',
  'airline',
  'tour_operator',
  'cruise_line',
  'transfer',
  'restaurant',
  'activity_provider',
  'insurance',
  'other',
] as const

export type SupplierType = (typeof SUPPLIER_TYPES)[number]
