/**
 * Cruise Sync React Query Hooks
 *
 * Provides hooks for managing cruise data synchronization:
 * - Sync status with live polling during active sync
 * - Sync history (past runs with metrics/errors)
 * - Coverage statistics (ships, lines, ports, regions)
 * - Storage and cache stats
 * - Mutations for sync control (start, cancel, purge, cleanup)
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export interface SyncStatus {
  inProgress: boolean
  cancelRequested: boolean
  progress?: {
    filesFound: number
    filesProcessed: number
    filesFailed: number
    sailingsUpserted: number
    startedAt: string
  }
}

export interface SyncHistoryEntry {
  id: string
  startedAt: string
  completedAt: string | null
  durationMs: number | null
  status: 'running' | 'completed' | 'cancelled' | 'failed'
  metrics: {
    filesFound: number
    filesProcessed: number
    filesSkipped: number
    filesFailed: number
    sailingsUpserted: number
    sailingsCreated: number
    sailingsUpdated: number
    pricesInserted: number
    stopsInserted: number
  } | null
  errorCount: number
  errors: Array<{
    filePath: string
    error: string
    errorType: 'parse_error' | 'download_failed' | 'missing_fields' | 'oversized' | 'unknown'
  }>
}

export interface CoverageStats {
  ships: { total: number; withImage: number; withDeckPlans: number; needsReview: number }
  cruiseLines: { total: number; withLogo: number; needsReview: number }
  ports: { total: number; active: number; withCoordinates: number; needsReview: number }
  regions: { total: number; needsReview: number }
  sailings: { total: number; activeFuture: number }
}

export interface StorageStats {
  totalRecords: number
  totalSizeBytes: number
  avgSizeBytes: number
  maxSizeBytes: number
  expiredCount: number
  expiringIn24HoursCount: number
}

export interface CacheStats {
  cruiseLines: number
  ships: number
  ports: number
  regions: number
  totalEntries: number
  maxEntries: number
  hitRate: number
  hits: number
  misses: number
}

export interface StubsReport {
  totalPending: number
  cruiseLines: number
  ships: number
  ports: number
  regions: number
  oldestStubs: Array<{ type: string; name: string; createdAt: string }>
}

export interface ConnectionTestResult {
  success: boolean
  skipped?: boolean
  info: Record<string, unknown>
}

export interface CleanupPreview {
  sailingsToDelete: number
  stopsToDelete: number
  pricesToDelete: number
  regionsToDelete: number
  cutoffDate: string
  oldestEndDate: string | null
}

export interface CleanupResult {
  sailingsDeleted: number
  stopsDeleted: number
  pricesToDelete: number
  regionsDeleted: number
  durationMs: number
}

export interface PurgeResult {
  deletedCount: number
  durationMs: number
}

export interface SyncOptions {
  dryRun?: boolean
  forceFullSync?: boolean
  deltaSync?: boolean
  targetYear?: number
  targetMonth?: number
  cruiseLineId?: string
  shipId?: string
  concurrency?: number
}

// ============================================================================
// Query Keys
// ============================================================================

export const cruiseSyncKeys = {
  all: ['cruise-sync'] as const,
  status: () => [...cruiseSyncKeys.all, 'status'] as const,
  history: (limit?: number) => [...cruiseSyncKeys.all, 'history', limit] as const,
  coverage: () => [...cruiseSyncKeys.all, 'coverage'] as const,
  storage: () => [...cruiseSyncKeys.all, 'storage'] as const,
  cache: () => [...cruiseSyncKeys.all, 'cache'] as const,
  stubs: () => [...cruiseSyncKeys.all, 'stubs'] as const,
  connection: () => [...cruiseSyncKeys.all, 'connection'] as const,
  cleanupPreview: (daysBuffer?: number) => [...cruiseSyncKeys.all, 'cleanup-preview', daysBuffer] as const,
  availableYears: () => [...cruiseSyncKeys.all, 'available-years'] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get current sync status. Polls every 2 seconds when sync is in progress.
 */
export function useSyncStatus(
  options?: Omit<UseQueryOptions<SyncStatus>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.status(),
    queryFn: async () => {
      return api.get<SyncStatus>('/cruise-import/sync/status')
    },
    refetchInterval: (query) => {
      // Poll every 2 seconds while sync is in progress
      return query.state.data?.inProgress ? 2000 : false
    },
    ...options,
  })
}

/**
 * Get sync history (past runs with metrics and errors).
 */
export function useSyncHistory(
  limit = 10,
  options?: Omit<UseQueryOptions<SyncHistoryEntry[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.history(limit),
    queryFn: async () => {
      return api.get<SyncHistoryEntry[]>(`/cruise-import/sync/history?limit=${limit}`)
    },
    staleTime: 30_000, // 30 seconds
    ...options,
  })
}

/**
 * Get coverage statistics for ships, cruise lines, ports, regions, sailings.
 */
export function useCoverageStats(
  options?: Omit<UseQueryOptions<CoverageStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.coverage(),
    queryFn: async () => {
      return api.get<CoverageStats>('/cruise-import/coverage-stats')
    },
    staleTime: 60_000, // 1 minute
    ...options,
  })
}

/**
 * Get raw JSON storage statistics.
 */
export function useStorageStats(
  options?: Omit<UseQueryOptions<StorageStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.storage(),
    queryFn: async () => {
      return api.get<StorageStats>('/cruise-import/storage-stats')
    },
    staleTime: 60_000, // 1 minute
    ...options,
  })
}

/**
 * Get reference data cache statistics.
 */
export function useCacheStats(
  options?: Omit<UseQueryOptions<CacheStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.cache(),
    queryFn: async () => {
      return api.get<CacheStats>('/cruise-import/cache-stats')
    },
    staleTime: 30_000, // 30 seconds
    ...options,
  })
}

/**
 * Get pending stubs report (items needing manual review).
 */
export function useStubsReport(
  options?: Omit<UseQueryOptions<StubsReport>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.stubs(),
    queryFn: async () => {
      return api.get<StubsReport>('/cruise-import/stubs-report')
    },
    staleTime: 60_000, // 1 minute
    ...options,
  })
}

/**
 * Test FTP connection.
 */
export function useConnectionTest(
  options?: Omit<UseQueryOptions<ConnectionTestResult>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.connection(),
    queryFn: async () => {
      return api.get<ConnectionTestResult>('/cruise-import/test-connection')
    },
    enabled: false, // Only fetch on demand
    ...options,
  })
}

/**
 * Get cleanup preview (what would be deleted).
 */
export function useCleanupPreview(
  daysBuffer = 0,
  options?: Omit<UseQueryOptions<CleanupPreview>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.cleanupPreview(daysBuffer),
    queryFn: async () => {
      return api.get<CleanupPreview>(`/cruise-import/cleanup/preview?daysBuffer=${daysBuffer}`)
    },
    staleTime: 60_000, // 1 minute
    ...options,
  })
}

/**
 * Get available year folders from FTP server.
 */
export function useAvailableYears(
  options?: Omit<UseQueryOptions<{ years: number[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cruiseSyncKeys.availableYears(),
    queryFn: async () => {
      return api.get<{ years: number[] }>('/cruise-import/available-years')
    },
    staleTime: 5 * 60_000, // 5 minutes - year folders don't change often
    ...options,
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Start a sync operation.
 */
export function useStartSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options: SyncOptions = {}) => {
      return api.post<unknown>('/cruise-import/sync', options)
    },
    onMutate: async () => {
      // Optimistically update sync status to show it's starting
      await queryClient.cancelQueries({ queryKey: cruiseSyncKeys.status() })
    },
    onSettled: () => {
      // Invalidate all related queries after sync completes
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.all })
    },
  })
}

/**
 * Start a dry-run sync (lists files without importing).
 */
export function useDryRunSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options: SyncOptions = {}) => {
      return api.post<unknown>('/cruise-import/sync/dry-run', options)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.status() })
    },
  })
}

/**
 * Cancel a running sync operation.
 */
export function useCancelSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return api.post<{ success: boolean; message: string }>('/cruise-import/sync/cancel')
    },
    onSuccess: () => {
      // Refetch status immediately to show cancel requested
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.status() })
    },
  })
}

/**
 * Clear reference data cache.
 */
export function useClearCache() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return api.post<{ cleared: boolean }>('/cruise-import/cache/clear')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.cache() })
    },
  })
}

/**
 * Run raw JSON purge (delete expired records).
 */
export function useRunPurge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return api.post<PurgeResult>('/cruise-import/purge')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.storage() })
    },
  })
}

/**
 * Run past sailing cleanup.
 */
export function useRunCleanup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (daysBuffer: number = 0) => {
      return api.post<CleanupResult>('/cruise-import/cleanup', { daysBuffer })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cruiseSyncKeys.all })
    },
  })
}
