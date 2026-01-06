/**
 * Query Key Factory
 *
 * Centralizes React Query key generation for consistent caching behavior.
 * All keys follow the pattern: [base, 'list'|'detail', ...params]
 *
 * Usage:
 * ```typescript
 * const tripKeys = createQueryKeys<TripFilterDto>('trips')
 *
 * // In queries:
 * queryKey: tripKeys.list(filters)
 * queryKey: tripKeys.detail(id)
 *
 * // In invalidations:
 * queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
 * ```
 *
 * IMPORTANT: Do not change key shapes without coordinating cache invalidations.
 * The factory produces identical arrays to existing inline patterns.
 */

/**
 * Creates a standard query key factory for an entity.
 *
 * @param base - The base key name (e.g., 'trips', 'amenities')
 * @returns Object with key generator functions
 */
export function createQueryKeys<TFilters = Record<string, unknown>>(base: string) {
  const keys = {
    /** Root key - invalidates all queries for this entity */
    all: [base] as const,

    /** Parent key for all list queries */
    lists: () => [...keys.all, 'list'] as const,

    /** Key for filtered list query - includes filters for cache differentiation */
    list: (filters: TFilters) => [...keys.lists(), filters] as const,

    /** Parent key for all detail queries */
    details: () => [...keys.all, 'detail'] as const,

    /** Key for single entity detail query */
    detail: (id: string) => [...keys.details(), id] as const,
  }

  return keys
}

/**
 * Type helper for extracting key types from a query keys object
 */
export type QueryKeysOf<T extends ReturnType<typeof createQueryKeys>> = {
  all: T['all']
  lists: ReturnType<T['lists']>
  list: ReturnType<T['list']>
  details: ReturnType<T['details']>
  detail: ReturnType<T['detail']>
}
