/**
 * Agency Settings React Query Hooks
 *
 * Provides hooks for managing agency settings including:
 * - Stripe Connect onboarding and status
 * - Agency branding and compliance settings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AgencySettingsResponseDto,
  UpdateAgencySettingsDto,
  StripeOnboardingResponseDto,
  StripeAccountStatusResponseDto,
} from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const agencySettingsKeys = {
  all: ['agency-settings'] as const,
  byAgency: (agencyId: string) => [...agencySettingsKeys.all, agencyId] as const,
  stripeStatus: (agencyId: string) => [...agencySettingsKeys.all, agencyId, 'stripe-status'] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch agency settings
 */
export function useAgencySettings(agencyId: string | null) {
  return useQuery({
    queryKey: agencySettingsKeys.byAgency(agencyId || ''),
    queryFn: async () => {
      if (!agencyId) return null
      return api.get<AgencySettingsResponseDto>(`/agencies/${agencyId}/settings`)
    },
    enabled: !!agencyId,
  })
}

/**
 * Fetch Stripe account status
 */
export function useStripeAccountStatus(agencyId: string | null) {
  return useQuery({
    queryKey: agencySettingsKeys.stripeStatus(agencyId || ''),
    queryFn: async () => {
      if (!agencyId) return null
      return api.get<StripeAccountStatusResponseDto>(`/agencies/${agencyId}/stripe/status`)
    },
    enabled: !!agencyId,
    // Refresh status periodically when pending
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && data.status === 'pending') {
        return 30000 // Refresh every 30 seconds while pending
      }
      return false
    },
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Update agency settings
 */
export function useUpdateAgencySettings(agencyId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateAgencySettingsDto) => {
      return api.patch<AgencySettingsResponseDto>(`/agencies/${agencyId}/settings`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencySettingsKeys.byAgency(agencyId) })
      toast({
        title: 'Settings updated',
        description: 'Agency settings have been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update settings',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Start Stripe Connect onboarding
 */
export function useStartStripeOnboarding(agencyId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      returnUrl,
      refreshUrl,
    }: {
      returnUrl: string
      refreshUrl: string
    }) => {
      return api.post<StripeOnboardingResponseDto>(`/agencies/${agencyId}/stripe/onboard`, {
        returnUrl,
        refreshUrl,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agencySettingsKeys.byAgency(agencyId) })
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start onboarding',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Refresh Stripe account status
 */
export function useRefreshStripeStatus(agencyId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      return api.get<StripeAccountStatusResponseDto>(`/agencies/${agencyId}/stripe/status`)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(agencySettingsKeys.stripeStatus(agencyId), data)
      queryClient.invalidateQueries({ queryKey: agencySettingsKeys.byAgency(agencyId) })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to refresh status',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Get Stripe Express Dashboard link
 */
export function useStripeDashboardLink(agencyId: string) {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      return api.post<{ url: string }>(`/agencies/${agencyId}/stripe/dashboard`, {})
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank')
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to open dashboard',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
