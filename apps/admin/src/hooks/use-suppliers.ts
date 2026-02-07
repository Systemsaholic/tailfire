/**
 * Suppliers React Query Hooks
 *
 * Provides hooks for managing suppliers (hotels, airlines, tour operators, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type {
  SupplierDto,
  SupplierListResponseDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  ListSuppliersParamsDto,
} from '@tailfire/shared-types/api'

// ============================================================================
// Query Keys
// ============================================================================

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  list: (params: ListSuppliersParamsDto) =>
    [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, 'detail'] as const,
  detail: (id: string) => [...suppliersKeys.details(), id] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * List suppliers with optional filtering and pagination
 */
export function useSuppliers(params: ListSuppliersParamsDto = {}) {
  return useQuery({
    queryKey: suppliersKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.search) queryParams.set('search', params.search)
      if (params.supplierType) queryParams.set('supplierType', params.supplierType)
      if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive))
      if (params.page) queryParams.set('page', String(params.page))
      if (params.limit) queryParams.set('limit', String(params.limit))

      const queryString = queryParams.toString()
      return api.get<SupplierListResponseDto>(
        `/suppliers${queryString ? `?${queryString}` : ''}`
      )
    },
    staleTime: 5 * 60_000, // 5 minutes
  })
}

/**
 * Get a single supplier by ID
 */
export function useSupplier(id: string | null | undefined) {
  return useQuery({
    queryKey: suppliersKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Supplier ID is required')
      return api.get<SupplierDto>(`/suppliers/${id}`)
    },
    enabled: !!id,
    staleTime: 5 * 60_000, // 5 minutes
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (dto: CreateSupplierDto) => {
      return api.post<SupplierDto>('/suppliers', dto)
    },
    onSuccess: (supplier) => {
      // Invalidate supplier list queries
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() })

      toast({
        title: 'Supplier created',
        description: `${supplier.name} has been created successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create supplier',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Update an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierDto }) => {
      return api.patch<SupplierDto>(`/suppliers/${id}`, data)
    },
    onSuccess: (supplier) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(supplier.id) })

      toast({
        title: 'Supplier updated',
        description: `${supplier.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update supplier',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Delete a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`)
      return id
    },
    onSuccess: (id) => {
      // Invalidate list queries and remove from cache
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() })
      queryClient.removeQueries({ queryKey: suppliersKeys.detail(id) })

      toast({
        title: 'Supplier deleted',
        description: 'The supplier has been deleted successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete supplier',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
