import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ContactRelationshipResponseDto,
  CreateContactRelationshipDto,
  UpdateContactRelationshipDto,
  ContactRelationshipFilterDto,
} from '@tailfire/shared-types/api'

// Query Keys
export const relationshipKeys = {
  all: ['relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (contactId: string, filters?: ContactRelationshipFilterDto) =>
    [...relationshipKeys.lists(), contactId, filters] as const,
  details: () => [...relationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...relationshipKeys.details(), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all relationships for a specific contact
 */
export function useRelationships(
  contactId: string | null,
  filters?: ContactRelationshipFilterDto
) {
  return useQuery({
    queryKey: relationshipKeys.list(contactId || '', filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) {
        params.append('category', filters.category)
      }

      const queryString = params.toString()
      const url = queryString
        ? `/contacts/${contactId}/relationships?${queryString}`
        : `/contacts/${contactId}/relationships`

      return api.get<ContactRelationshipResponseDto[]>(url)
    },
    enabled: !!contactId,
  })
}

/**
 * Fetch a single relationship by ID
 * Note: The API doesn't have a dedicated GET /relationships/:id endpoint,
 * so this would fetch all relationships and filter client-side if needed.
 * For now, we'll keep this simple and rely on useRelationships.
 */
export function useRelationship(contactId: string | null, relationshipId: string | null) {
  const { data: relationships } = useRelationships(contactId)

  return {
    data: relationships?.find(r => r.id === relationshipId),
    isLoading: !relationships && !!contactId && !!relationshipId,
  }
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new relationship
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string
      data: CreateContactRelationshipDto
    }) =>
      api.post<ContactRelationshipResponseDto>(
        `/contacts/${contactId}/relationships`,
        data
      ),
    onSuccess: (_, variables) => {
      // Invalidate relationships list for this contact
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      })
      // Also invalidate the contact detail to refresh relationship count
      queryClient.invalidateQueries({
        queryKey: ['contacts', 'detail', variables.contactId],
      })
      // Invalidate the other contact's relationships too (bidirectional)
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      })
    },
  })
}

/**
 * Update an existing relationship
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contactId,
      relationshipId,
      data,
    }: {
      contactId: string
      relationshipId: string
      data: UpdateContactRelationshipDto
    }) =>
      api.put<ContactRelationshipResponseDto>(
        `/contacts/${contactId}/relationships/${relationshipId}`,
        data
      ),
    onSuccess: (_, variables) => {
      // Invalidate relationships lists
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      })
      // Invalidate specific relationship detail
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.detail(variables.relationshipId),
      })
    },
  })
}

/**
 * Delete a relationship
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contactId,
      relationshipId,
    }: {
      contactId: string
      relationshipId: string
    }) =>
      api.delete(`/contacts/${contactId}/relationships/${relationshipId}`),
    onSuccess: () => {
      // Invalidate all relationship lists (bidirectional invalidation)
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.lists(),
      })
      // Invalidate contact details to refresh relationship counts
      queryClient.invalidateQueries({
        queryKey: ['contacts'],
      })
    },
  })
}
