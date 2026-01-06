/**
 * Amenities Hooks
 *
 * React Query hooks for managing amenities in the admin panel.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { buildQueryString } from '@/lib/query-params'
import type {
  AmenityResponseDto,
  AmenitiesByCategory,
  AmenityCategory,
  AmenitySource,
  BulkUpsertAmenitiesResponseDto,
} from '@tailfire/shared-types'

// ============================================================================
// Query Keys
// ============================================================================

export const amenityKeys = {
  all: ['amenities'] as const,
  list: (filters?: { search?: string; category?: AmenityCategory }) =>
    [...amenityKeys.all, 'list', filters] as const,
  grouped: () => [...amenityKeys.all, 'grouped'] as const,
  detail: (id: string) => [...amenityKeys.all, 'detail', id] as const,
  forActivity: (activityId: string) =>
    [...amenityKeys.all, 'activity', activityId] as const,
}

// ============================================================================
// Queries
// ============================================================================

interface UseAmenitiesOptions {
  search?: string
  category?: AmenityCategory
  source?: AmenitySource
}

/**
 * Fetch all amenities with optional filtering
 */
export function useAmenities(options: UseAmenitiesOptions = {}) {
  const query = buildQueryString({
    search: options.search,
    category: options.category,
    source: options.source,
  })

  return useQuery({
    queryKey: amenityKeys.list(options),
    queryFn: () => api.get<AmenityResponseDto[]>(`/amenities${query}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch amenities grouped by category for UI display
 */
export function useAmenitiesGrouped() {
  return useQuery({
    queryKey: amenityKeys.grouped(),
    queryFn: () => api.get<AmenitiesByCategory[]>('/amenities/grouped'),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single amenity by ID
 */
export function useAmenity(id: string) {
  return useQuery({
    queryKey: amenityKeys.detail(id),
    queryFn: () => api.get<AmenityResponseDto>(`/amenities/${id}`),
    enabled: !!id,
  })
}

/**
 * Fetch amenities for a specific activity
 */
export function useActivityAmenities(activityId: string | undefined) {
  return useQuery({
    queryKey: amenityKeys.forActivity(activityId!),
    queryFn: () =>
      api.get<AmenityResponseDto[]>(`/activities/${activityId}/amenities`),
    enabled: !!activityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================================================
// Mutations
// ============================================================================

interface CreateAmenityInput {
  name: string
  category?: AmenityCategory
  icon?: string
  description?: string
}

interface UpdateAmenityInput {
  id: string
  data: {
    name?: string
    category?: AmenityCategory
    icon?: string | null
    description?: string | null
  }
}

/**
 * Create a new amenity
 */
export function useCreateAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAmenityInput) =>
      api.post<AmenityResponseDto>('/amenities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.all })
    },
  })
}

/**
 * Update an amenity
 */
export function useUpdateAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdateAmenityInput) =>
      api.patch<AmenityResponseDto>(`/amenities/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.all })
      queryClient.invalidateQueries({ queryKey: amenityKeys.detail(variables.id) })
    },
  })
}

/**
 * Delete an amenity
 */
export function useDeleteAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/amenities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.all })
    },
  })
}

/**
 * Bulk upsert amenities (creates missing, returns all)
 */
export function useBulkUpsertAmenities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { names: string[]; source: AmenitySource }) =>
      api.post<BulkUpsertAmenitiesResponseDto>('/amenities/bulk-upsert', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.all })
    },
  })
}

// ============================================================================
// Activity Amenities Mutations
// ============================================================================

interface UpdateActivityAmenitiesInput {
  activityId: string
  amenityIds: string[]
}

/**
 * Replace all amenities for an activity
 */
export function useUpdateActivityAmenities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, amenityIds }: UpdateActivityAmenitiesInput) =>
      api.put<AmenityResponseDto[]>(`/activities/${activityId}/amenities`, {
        amenityIds,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: amenityKeys.forActivity(variables.activityId),
      })
    },
  })
}

/**
 * Add amenities to an activity (append)
 */
export function useAddActivityAmenities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, amenityIds }: UpdateActivityAmenitiesInput) =>
      api.post<AmenityResponseDto[]>(`/activities/${activityId}/amenities`, {
        amenityIds,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: amenityKeys.forActivity(variables.activityId),
      })
    },
  })
}

/**
 * Remove specific amenities from an activity
 */
export function useRemoveActivityAmenities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, amenityIds }: UpdateActivityAmenitiesInput) =>
      api.delete<AmenityResponseDto[]>(`/activities/${activityId}/amenities`, {
        body: JSON.stringify({ amenityIds }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: amenityKeys.forActivity(variables.activityId),
      })
    },
  })
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Category labels for display
 */
export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  connectivity: 'Connectivity',
  facilities: 'Facilities',
  dining: 'Dining',
  services: 'Services',
  parking: 'Parking',
  accessibility: 'Accessibility',
  room_features: 'Room Features',
  family: 'Family',
  pets: 'Pets',
  other: 'Other',
}

/**
 * Get display label for a category
 */
export function getCategoryLabel(category: AmenityCategory): string {
  return AMENITY_CATEGORY_LABELS[category] || category
}
