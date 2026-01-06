/**
 * Service Fees React Query Hooks
 *
 * Provides hooks for managing service fees including:
 * - CRUD operations
 * - Status transitions (send, mark paid, refund, cancel)
 * - Stripe invoice creation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ServiceFeeResponseDto,
  CreateServiceFeeDto,
  UpdateServiceFeeDto,
  RefundServiceFeeDto,
} from '@tailfire/shared-types/api'
import { useToast } from './use-toast'

// ============================================================================
// Query Keys
// ============================================================================

export const serviceFeeKeys = {
  all: ['service-fees'] as const,
  byTrip: (tripId: string) => [...serviceFeeKeys.all, 'trip', tripId] as const,
  byId: (id: string) => [...serviceFeeKeys.all, 'detail', id] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all service fees for a trip
 */
export function useServiceFees(tripId: string) {
  return useQuery({
    queryKey: serviceFeeKeys.byTrip(tripId),
    queryFn: async () => {
      return api.get<ServiceFeeResponseDto[]>(`/trips/${tripId}/service-fees`)
    },
    enabled: !!tripId,
  })
}

/**
 * Fetch a single service fee by ID
 */
export function useServiceFee(id: string) {
  return useQuery({
    queryKey: serviceFeeKeys.byId(id),
    queryFn: async () => {
      return api.get<ServiceFeeResponseDto>(`/service-fees/${id}`)
    },
    enabled: !!id,
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new service fee
 */
export function useCreateServiceFee(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateServiceFeeDto) => {
      return api.post<ServiceFeeResponseDto>(`/trips/${tripId}/service-fees`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Service fee created',
        description: 'The service fee has been created successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create service fee',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update a service fee
 */
export function useUpdateServiceFee(tripId: string, serviceFeeId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateServiceFeeDto) => {
      return api.patch<ServiceFeeResponseDto>(`/service-fees/${serviceFeeId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byId(serviceFeeId) })
      toast({
        title: 'Service fee updated',
        description: 'The service fee has been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update service fee',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a service fee
 */
export function useDeleteServiceFee(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (serviceFeeId: string) => {
      return api.delete(`/service-fees/${serviceFeeId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Service fee deleted',
        description: 'The service fee has been deleted successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete service fee',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Send a service fee (transition from draft to sent)
 */
export function useSendServiceFee(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (serviceFeeId: string) => {
      return api.post<ServiceFeeResponseDto>(`/service-fees/${serviceFeeId}/send`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Service fee sent',
        description: 'The service fee has been marked as sent.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send service fee',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Mark a service fee as paid
 */
export function useMarkServiceFeePaid(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      serviceFeeId,
    }: {
      serviceFeeId: string
    }) => {
      return api.post<ServiceFeeResponseDto>(`/service-fees/${serviceFeeId}/mark-paid`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Payment recorded',
        description: 'The service fee has been marked as paid.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to record payment',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Refund a service fee
 */
export function useRefundServiceFee(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      serviceFeeId,
      data,
    }: {
      serviceFeeId: string
      data: RefundServiceFeeDto
    }) => {
      return api.post<ServiceFeeResponseDto>(`/service-fees/${serviceFeeId}/refund`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Refund processed',
        description: 'The refund has been processed successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to process refund',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Cancel a service fee
 */
export function useCancelServiceFee(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (serviceFeeId: string) => {
      return api.post<ServiceFeeResponseDto>(`/service-fees/${serviceFeeId}/cancel`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Service fee cancelled',
        description: 'The service fee has been cancelled.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to cancel service fee',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Create and send Stripe invoice for a service fee
 */
export function useCreateStripeInvoice(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      serviceFeeId,
      agencyId,
      recipientEmail,
      recipientName,
    }: {
      serviceFeeId: string
      agencyId: string
      recipientEmail: string
      recipientName: string
    }) => {
      return api.post<{ invoiceId: string; hostedInvoiceUrl: string }>(
        `/service-fees/${serviceFeeId}/invoice`,
        { agencyId, recipientEmail, recipientName }
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Invoice created',
        description: 'Stripe invoice has been created and sent.',
      })
      return data
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create invoice',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Process Stripe refund for a service fee
 */
export function useProcessStripeRefund(tripId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      serviceFeeId,
      agencyId,
      amountCents,
      reason,
    }: {
      serviceFeeId: string
      agencyId: string
      amountCents?: number
      reason?: string
    }) => {
      return api.post<{ refundId: string }>(`/service-fees/${serviceFeeId}/stripe-refund`, {
        agencyId,
        amountCents,
        reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceFeeKeys.byTrip(tripId) })
      toast({
        title: 'Refund processed',
        description: 'Stripe refund has been processed successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to process refund',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    },
  })
}
