import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CredentialMetadataDto,
  CredentialSecretsDto,
  CreateCredentialDto,
  UpdateCredentialDto,
  RotateCredentialDto,
} from '@tailfire/shared-types/api'

/**
 * Credential source policy
 * - env-only: Managed via Doppler (environment variables) - CRUD disabled in UI
 * - db-only: Managed via Admin UI (database) - full CRUD enabled
 * - hybrid: Try env first, fall back to DB - limited CRUD
 */
export type SourcePolicy = 'env-only' | 'db-only' | 'hybrid'

// Provider metadata type (matches backend ProviderMetadataDto)
export interface CredentialFieldDefinition {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'select'
  description: string
  required: boolean
  placeholder?: string
  pattern?: string
  options?: Array<{ value: string; label: string }>
}

export interface ProviderMetadata {
  provider: string
  displayName: string
  description: string
  documentation: string
  requiredFields: CredentialFieldDefinition[]
  isAvailable: boolean
  costTier: 'free' | 'low' | 'medium' | 'high'
  features: string[]
  /** Credential source policy - determines how credentials are managed */
  sourcePolicy: SourcePolicy
  /** Environment variable names for this provider (for env-only/hybrid) */
  envVars?: Record<string, string>
  /** Whether credentials are shared across all environments */
  isShared?: boolean
}

// Query Keys
export const apiCredentialKeys = {
  all: ['api-credentials'] as const,
  lists: () => [...apiCredentialKeys.all, 'list'] as const,
  details: () => [...apiCredentialKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiCredentialKeys.details(), id] as const,
  history: (id: string) => [...apiCredentialKeys.detail(id), 'history'] as const,
  providerMetadata: () => [...apiCredentialKeys.all, 'provider-metadata'] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch list of all API credentials (metadata only)
 */
export function useApiCredentials() {
  return useQuery({
    queryKey: apiCredentialKeys.lists(),
    queryFn: async () => {
      return api.get<CredentialMetadataDto[]>('/api-credentials')
    },
  })
}

/**
 * Fetch single credential by ID (metadata only)
 */
export function useApiCredential(id: string | null) {
  return useQuery({
    queryKey: apiCredentialKeys.detail(id || ''),
    queryFn: () => api.get<CredentialMetadataDto>(`/api-credentials/${id}`),
    enabled: !!id,
  })
}

/**
 * Fetch credential version history
 */
export function useCredentialHistory(id: string | null) {
  return useQuery({
    queryKey: apiCredentialKeys.history(id || ''),
    queryFn: () => api.get<CredentialMetadataDto[]>(`/api-credentials/${id}/history`),
    enabled: !!id,
  })
}

/**
 * Fetch provider metadata (for dynamic form rendering)
 */
export function useProviderMetadata() {
  return useQuery({
    queryKey: apiCredentialKeys.providerMetadata(),
    queryFn: () => api.get<ProviderMetadata[]>('/api-credentials/providers'),
    staleTime: 5 * 60 * 1000, // 5 minutes - metadata rarely changes
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create new API credential
 */
export function useCreateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCredentialDto) =>
      api.post<CredentialMetadataDto>('/api-credentials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.lists() })
    },
  })
}

/**
 * Update credential metadata
 */
export function useUpdateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCredentialDto }) =>
      api.put<CredentialMetadataDto>(`/api-credentials/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.detail(variables.id) })
    },
  })
}

/**
 * Reveal decrypted credentials
 * Note: This should be used sparingly and with user confirmation
 */
export function useRevealCredential() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<CredentialSecretsDto>(`/api-credentials/${id}/reveal`, {}),
  })
}

/**
 * Rotate credentials (creates new version)
 */
export function useRotateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RotateCredentialDto }) =>
      api.post<CredentialMetadataDto>(`/api-credentials/${id}/rotate`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.history(variables.id) })
    },
  })
}

/**
 * Rollback to previous version
 */
export function useRollbackCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<CredentialMetadataDto>(`/api-credentials/${id}/rollback`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.history(id) })
    },
  })
}

/**
 * Delete (revoke) credential
 */
export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api-credentials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiCredentialKeys.lists() })
    },
  })
}

/**
 * Test connection for a credential
 * Validates that the credentials work without affecting active credentials
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean; message: string; error?: string }>(
        `/api-credentials/${id}/test-connection`,
        {}
      ),
  })
}
