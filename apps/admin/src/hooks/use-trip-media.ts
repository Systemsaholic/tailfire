import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  TripMediaResponseDto,
  UpdateTripMediaDto,
  AddExternalTripMediaRequest,
} from '@tailfire/shared-types/api'
import { tripKeys } from './use-trips'

// Query Keys
export const tripMediaKeys = {
  all: ['tripMedia'] as const,
  lists: () => [...tripMediaKeys.all, 'list'] as const,
  list: (tripId: string) => [...tripMediaKeys.lists(), tripId] as const,
  details: () => [...tripMediaKeys.all, 'detail'] as const,
  detail: (tripId: string, id: string) =>
    [...tripMediaKeys.details(), tripId, id] as const,
  cover: (tripId: string) => [...tripMediaKeys.all, 'cover', tripId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all media for a trip
 */
export function useTripMedia(tripId: string) {
  return useQuery({
    queryKey: tripMediaKeys.list(tripId),
    queryFn: async () => {
      const response = await api.get<{ media: TripMediaResponseDto[] }>(
        `/trips/${tripId}/media`
      )
      return response.media
    },
    enabled: !!tripId,
  })
}

/**
 * Fetch single media item by ID
 */
export function useTripMediaItem(tripId: string, id: string | null) {
  return useQuery({
    queryKey: tripMediaKeys.detail(tripId, id || ''),
    queryFn: () => api.get<TripMediaResponseDto>(`/trips/${tripId}/media/${id}`),
    enabled: !!tripId && !!id,
  })
}

/**
 * Fetch cover photo for a trip
 */
export function useTripCoverPhoto(tripId: string) {
  return useQuery({
    queryKey: tripMediaKeys.cover(tripId),
    queryFn: async () => {
      const response = await api.get<{ cover: TripMediaResponseDto | null }>(
        `/trips/${tripId}/media/cover`
      )
      return response.cover
    },
    enabled: !!tripId,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Upload new media file
 */
export function useUploadTripMedia(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      caption,
      isCoverPhoto,
    }: {
      file: File
      caption?: string
      isCoverPhoto?: boolean
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (caption) formData.append('caption', caption)
      if (isCoverPhoto) formData.append('isCoverPhoto', 'true')

      return api.postFormData<TripMediaResponseDto>(
        `/trips/${tripId}/media`,
        formData
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.cover(tripId) })
      // Also invalidate trip detail to refresh coverPhotoUrl
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}

/**
 * Add external media from Unsplash
 */
export function useAddExternalTripMedia(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddExternalTripMediaRequest) =>
      api.post<TripMediaResponseDto>(`/trips/${tripId}/media/external`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.cover(tripId) })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}

/**
 * Update media metadata (caption, orderIndex)
 */
export function useUpdateTripMedia(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripMediaDto }) =>
      api.patch<TripMediaResponseDto>(`/trips/${tripId}/media/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tripMediaKeys.detail(tripId, variables.id),
      })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
    },
  })
}

/**
 * Set media as cover photo
 */
export function useSetTripCoverPhoto(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mediaId: string) =>
      api.patch<TripMediaResponseDto>(
        `/trips/${tripId}/media/${mediaId}/set-cover`,
        {}
      ),
    onSuccess: (_, mediaId) => {
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.cover(tripId) })
      queryClient.invalidateQueries({
        queryKey: tripMediaKeys.detail(tripId, mediaId),
      })
      // Also invalidate trip detail to refresh coverPhotoUrl
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}

/**
 * Remove cover photo designation
 */
export function useRemoveTripCoverPhoto(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mediaId: string) =>
      api.patch<TripMediaResponseDto>(
        `/trips/${tripId}/media/${mediaId}/remove-cover`,
        {}
      ),
    onSuccess: (_, mediaId) => {
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.cover(tripId) })
      queryClient.invalidateQueries({
        queryKey: tripMediaKeys.detail(tripId, mediaId),
      })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}

/**
 * Delete media item
 */
export function useDeleteTripMedia(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/trips/${tripId}/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.list(tripId) })
      queryClient.invalidateQueries({ queryKey: tripMediaKeys.cover(tripId) })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}
