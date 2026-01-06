/**
 * Insurance React Query Hooks
 *
 * Provides hooks for fetching and mutating trip insurance packages
 * and per-traveler insurance records.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  TripInsurancePackageDto,
  CreateTripInsurancePackageDto,
  UpdateTripInsurancePackageDto,
  TripInsurancePackagesListDto,
  TripTravelerInsuranceDto,
  CreateTripTravelerInsuranceDto,
  UpdateTripTravelerInsuranceDto,
  TripTravelersInsuranceListDto,
} from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const insuranceKeys = {
  all: ['insurance'] as const,
  packages: (tripId: string) => [...insuranceKeys.all, 'packages', tripId] as const,
  package: (tripId: string, packageId: string) =>
    [...insuranceKeys.packages(tripId), packageId] as const,
  travelers: (tripId: string) => [...insuranceKeys.all, 'travelers', tripId] as const,
  traveler: (tripId: string, insuranceId: string) =>
    [...insuranceKeys.travelers(tripId), insuranceId] as const,
}

// ============================================================================
// Insurance Packages Queries
// ============================================================================

/**
 * Fetch all insurance packages for a trip
 */
export function useInsurancePackages(tripId: string | null) {
  return useQuery({
    queryKey: insuranceKeys.packages(tripId || ''),
    queryFn: async () => {
      if (!tripId) return null
      return api.get<TripInsurancePackagesListDto>(`/trips/${tripId}/insurance/packages`)
    },
    enabled: !!tripId,
  })
}

/**
 * Fetch a single insurance package
 */
export function useInsurancePackage(tripId: string | null, packageId: string | null) {
  return useQuery({
    queryKey: insuranceKeys.package(tripId || '', packageId || ''),
    queryFn: async () => {
      if (!tripId || !packageId) return null
      return api.get<TripInsurancePackageDto>(`/trips/${tripId}/insurance/packages/${packageId}`)
    },
    enabled: !!tripId && !!packageId,
  })
}

// ============================================================================
// Insurance Packages Mutations
// ============================================================================

/**
 * Create an insurance package
 */
export function useCreateInsurancePackage(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateTripInsurancePackageDto) => {
      return api.post<TripInsurancePackageDto>(`/trips/${tripId}/insurance/packages`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.packages(tripId) })
      toast({
        title: 'Insurance package created',
        description: 'Insurance package has been successfully created.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create insurance package',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an insurance package
 */
export function useUpdateInsurancePackage(tripId: string, packageId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateTripInsurancePackageDto) => {
      return api.patch<TripInsurancePackageDto>(
        `/trips/${tripId}/insurance/packages/${packageId}`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.packages(tripId) })
      queryClient.invalidateQueries({ queryKey: insuranceKeys.package(tripId, packageId) })
      toast({
        title: 'Insurance package updated',
        description: 'Insurance package has been successfully updated.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update insurance package',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete an insurance package
 */
export function useDeleteInsurancePackage(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (packageId: string) => {
      return api.delete(`/trips/${tripId}/insurance/packages/${packageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.packages(tripId) })
      toast({
        title: 'Insurance package deleted',
        description: 'Insurance package has been successfully deleted.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete insurance package',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// Traveler Insurance Queries
// ============================================================================

/**
 * Fetch all traveler insurance records for a trip
 */
export function useTravelerInsurance(tripId: string | null) {
  return useQuery({
    queryKey: insuranceKeys.travelers(tripId || ''),
    queryFn: async () => {
      if (!tripId) return null
      return api.get<TripTravelersInsuranceListDto>(`/trips/${tripId}/insurance/travelers`)
    },
    enabled: !!tripId,
  })
}

/**
 * Fetch a single traveler insurance record
 */
export function useTravelerInsuranceById(tripId: string | null, insuranceId: string | null) {
  return useQuery({
    queryKey: insuranceKeys.traveler(tripId || '', insuranceId || ''),
    queryFn: async () => {
      if (!tripId || !insuranceId) return null
      return api.get<TripTravelerInsuranceDto>(
        `/trips/${tripId}/insurance/travelers/${insuranceId}`
      )
    },
    enabled: !!tripId && !!insuranceId,
  })
}

// ============================================================================
// Traveler Insurance Mutations
// ============================================================================

/**
 * Create a traveler insurance record
 */
export function useCreateTravelerInsurance(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateTripTravelerInsuranceDto) => {
      return api.post<TripTravelerInsuranceDto>(`/trips/${tripId}/insurance/travelers`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.travelers(tripId) })
      toast({
        title: 'Insurance record created',
        description: 'Traveler insurance record has been successfully created.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create insurance record',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update a traveler insurance record
 */
export function useUpdateTravelerInsurance(tripId: string, insuranceId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateTripTravelerInsuranceDto) => {
      return api.patch<TripTravelerInsuranceDto>(
        `/trips/${tripId}/insurance/travelers/${insuranceId}`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.travelers(tripId) })
      queryClient.invalidateQueries({ queryKey: insuranceKeys.traveler(tripId, insuranceId) })
      toast({
        title: 'Insurance record updated',
        description: 'Traveler insurance record has been successfully updated.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update insurance record',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a traveler insurance record
 */
export function useDeleteTravelerInsurance(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (insuranceId: string) => {
      return api.delete(`/trips/${tripId}/insurance/travelers/${insuranceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.travelers(tripId) })
      toast({
        title: 'Insurance record deleted',
        description: 'Traveler insurance record has been successfully deleted.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete insurance record',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
