import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { createQueryKeys } from '@/lib/query-keys'
import { buildQueryString } from '@/lib/query-params'
import type {
  TagResponseDto,
  TagWithUsageDto,
  CreateTagDto,
  UpdateTagDto,
  TagFilterDto,
  UpdateEntityTagsDto,
  CreateAndAssignTagDto,
} from '@tailfire/shared-types/api'

// Query Keys - uses shared factory with custom entity tag extensions
const baseKeys = createQueryKeys<TagFilterDto>('tags')
export const tagKeys = {
  ...baseKeys,
  tripTags: (tripId: string) => [...baseKeys.all, 'trip', tripId] as const,
  contactTags: (contactId: string) => [...baseKeys.all, 'contact', contactId] as const,
}

// ============================================================================
// GLOBAL TAG QUERIES
// ============================================================================

/**
 * Fetch all tags with optional filtering and usage counts
 */
export function useTags(filters: TagFilterDto = {}) {
  const query = buildQueryString({
    search: filters.search,
    category: filters.category,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    limit: filters.limit,
    offset: filters.offset,
  })

  return useQuery({
    queryKey: tagKeys.list(filters),
    queryFn: () => api.get<TagWithUsageDto[]>(`/tags${query}`),
  })
}

/**
 * Fetch single tag by ID
 */
export function useTag(id: string | null) {
  return useQuery({
    queryKey: tagKeys.detail(id || ''),
    queryFn: () => api.get<TagResponseDto>(`/tags/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// GLOBAL TAG MUTATIONS
// ============================================================================

/**
 * Create new global tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTagDto) =>
      api.post<TagResponseDto>('/tags', data),
    onSuccess: () => {
      // Invalidate all tag lists to show the new tag
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}

/**
 * Update existing tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagDto }) =>
      api.patch<TagResponseDto>(`/tags/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific tag and all lists
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}

/**
 * Delete tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}

// ============================================================================
// TRIP TAG QUERIES & MUTATIONS
// ============================================================================

/**
 * Fetch tags for a specific trip
 */
export function useTripTags(tripId: string | null) {
  return useQuery({
    queryKey: tagKeys.tripTags(tripId || ''),
    queryFn: () => api.get<TagResponseDto[]>(`/trips/${tripId}/tags`),
    enabled: !!tripId,
  })
}

/**
 * Update tags for a trip with optimistic updates
 */
export function useUpdateTripTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, tagIds }: { tripId: string; tagIds: string[] }) =>
      api.put<TagResponseDto[]>(`/trips/${tripId}/tags`, { tagIds } as UpdateEntityTagsDto),

    // Optimistic update
    onMutate: async (variables) => {
      const { tripId } = variables

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagKeys.tripTags(tripId) })

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<TagResponseDto[]>(
        tagKeys.tripTags(tripId)
      )

      // Return context for rollback
      return { previousTags, tripId }
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          tagKeys.tripTags(context.tripId),
          context.previousTags
        )
      }
    },

    // Refetch to ensure consistency
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.tripTags(variables.tripId),
      })
      // Also invalidate tag lists to update usage counts
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },

    retry: 2,
  })
}

/**
 * Create new tag and assign it to a trip in one operation
 */
export function useCreateAndAssignTripTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: CreateAndAssignTagDto }) =>
      api.post<TagResponseDto>(`/trips/${tripId}/tags`, data),

    onSuccess: (_, variables) => {
      // Invalidate trip tags and global tag lists
      queryClient.invalidateQueries({
        queryKey: tagKeys.tripTags(variables.tripId),
      })
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}

// ============================================================================
// CONTACT TAG QUERIES & MUTATIONS
// ============================================================================

/**
 * Fetch tags for a specific contact
 */
export function useContactTags(contactId: string | null) {
  return useQuery({
    queryKey: tagKeys.contactTags(contactId || ''),
    queryFn: () => api.get<TagResponseDto[]>(`/contacts/${contactId}/tags`),
    enabled: !!contactId,
  })
}

/**
 * Update tags for a contact with optimistic updates
 */
export function useUpdateContactTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId, tagIds }: { contactId: string; tagIds: string[] }) =>
      api.put<TagResponseDto[]>(`/contacts/${contactId}/tags`, { tagIds } as UpdateEntityTagsDto),

    // Optimistic update
    onMutate: async (variables) => {
      const { contactId } = variables

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagKeys.contactTags(contactId) })

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<TagResponseDto[]>(
        tagKeys.contactTags(contactId)
      )

      // Return context for rollback
      return { previousTags, contactId }
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          tagKeys.contactTags(context.contactId),
          context.previousTags
        )
      }
    },

    // Refetch to ensure consistency
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.contactTags(variables.contactId),
      })
      // Also invalidate tag lists to update usage counts
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },

    retry: 2,
  })
}

/**
 * Create new tag and assign it to a contact in one operation
 */
export function useCreateAndAssignContactTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: CreateAndAssignTagDto }) =>
      api.post<TagResponseDto>(`/contacts/${contactId}/tags`, data),

    onSuccess: (_, variables) => {
      // Invalidate contact tags and global tag lists
      queryClient.invalidateQueries({
        queryKey: tagKeys.contactTags(variables.contactId),
      })
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}
