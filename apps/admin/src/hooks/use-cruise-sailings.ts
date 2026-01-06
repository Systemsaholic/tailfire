/**
 * Cruise Sailings React Query Hooks
 *
 * Hooks for fetching cruise sailing data from the API.
 * Follows the query key factory pattern for cache management.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ============================================================================
// TYPES (mirroring API DTOs)
// ============================================================================

export interface SailingSearchFilters {
  q?: string
  cruiseLineId?: string
  shipId?: string
  regionId?: string
  embarkPortId?: string
  sailDateFrom?: string
  sailDateTo?: string
  nightsMin?: number
  nightsMax?: number
  priceMinCents?: number
  priceMaxCents?: number
  cabinCategory?: 'inside' | 'oceanview' | 'balcony' | 'suite'
  sortBy?: 'sailDate' | 'price' | 'nights' | 'shipName' | 'lineName'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface SailingSearchItem {
  id: string
  name: string
  sailDate: string
  endDate: string
  nights: number
  ship: {
    id: string
    name: string
    imageUrl: string | null
  }
  cruiseLine: {
    id: string
    name: string
    logoUrl: string | null
  }
  embarkPort: {
    id: string | null
    name: string
  }
  disembarkPort: {
    id: string | null
    name: string
  }
  prices: {
    inside: number | null
    oceanview: number | null
    balcony: number | null
    suite: number | null
  }
  lastSyncedAt: string
  pricesUpdating?: boolean
}

export interface SailingSearchResponse {
  items: SailingSearchItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasMore: boolean
  }
  sync: {
    syncInProgress: boolean
    pricesUpdating: boolean
    lastSyncedAt: string | null
  }
  filters: Record<string, unknown>
}

export interface FilterOption {
  id: string
  name: string
  count?: number
}

export interface SailingFiltersResponse {
  cruiseLines: FilterOption[]
  ships: FilterOption[]
  regions: FilterOption[]
  embarkPorts: FilterOption[]
  dateRange: {
    min: string | null
    max: string | null
  }
  nightsRange: {
    min: number | null
    max: number | null
  }
  priceRange: {
    min: number | null
    max: number | null
  }
}

export interface SailingDetailResponse {
  id: string
  providerSailingId: string
  name: string
  sailDate: string
  endDate: string
  nights: number
  seaDays: number | null
  voyageCode: string | null
  ship: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    yearBuilt: number | null
    passengerCapacity: number | null
    tonnage: number | null
  }
  cruiseLine: {
    id: string
    name: string
    logoUrl: string | null
  }
  embarkPort: {
    id: string | null
    name: string
    country: string | null
    latitude: number | null
    longitude: number | null
  }
  disembarkPort: {
    id: string | null
    name: string
    country: string | null
    latitude: number | null
    longitude: number | null
  }
  regions: Array<{
    id: string
    name: string
  }>
  itinerary: Array<{
    dayNumber: number
    portName: string
    portId: string | null
    arriveTime: string | null
    departTime: string | null
    arriveDate: string | null
    departDate: string | null
  }>
  prices: {
    inside: number | null
    oceanview: number | null
    balcony: number | null
    suite: number | null
    cheapest: number | null
  }
  lastSyncedAt: string
  createdAt: string
  updatedAt: string
}

export interface ShipImage {
  id: string
  url: string
  thumbnailUrl: string | null
  altText: string | null
  imageType: string | null
  isHero: boolean
  sortOrder: number
}

export interface ShipImagesResponse {
  images: ShipImage[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasMore: boolean
  }
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const cruiseSailingKeys = {
  all: ['cruise-sailings'] as const,
  lists: () => [...cruiseSailingKeys.all, 'list'] as const,
  list: (filters: SailingSearchFilters) => [...cruiseSailingKeys.lists(), filters] as const,
  details: () => [...cruiseSailingKeys.all, 'detail'] as const,
  detail: (id: string) => [...cruiseSailingKeys.details(), id] as const,
  filters: () => [...cruiseSailingKeys.all, 'filters'] as const,
  shipImages: (shipId: string, page?: number) =>
    [...cruiseSailingKeys.all, 'ship-images', shipId, page ?? 1] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchSailings(filters: SailingSearchFilters): Promise<SailingSearchResponse> {
  const params = new URLSearchParams()

  if (filters.q) params.set('q', filters.q)
  if (filters.cruiseLineId) params.set('cruiseLineId', filters.cruiseLineId)
  if (filters.shipId) params.set('shipId', filters.shipId)
  if (filters.regionId) params.set('regionId', filters.regionId)
  if (filters.embarkPortId) params.set('embarkPortId', filters.embarkPortId)
  if (filters.sailDateFrom) params.set('sailDateFrom', filters.sailDateFrom)
  if (filters.sailDateTo) params.set('sailDateTo', filters.sailDateTo)
  if (filters.nightsMin !== undefined) params.set('nightsMin', String(filters.nightsMin))
  if (filters.nightsMax !== undefined) params.set('nightsMax', String(filters.nightsMax))
  if (filters.priceMinCents !== undefined) params.set('priceMinCents', String(filters.priceMinCents))
  if (filters.priceMaxCents !== undefined) params.set('priceMaxCents', String(filters.priceMaxCents))
  if (filters.cabinCategory) params.set('cabinCategory', filters.cabinCategory)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))

  const qs = params.toString()
  const url = '/cruise-repository/sailings' + (qs ? '?' + qs : '')

  return api.get<SailingSearchResponse>(url)
}

async function fetchSailing(id: string): Promise<SailingDetailResponse> {
  return api.get<SailingDetailResponse>('/cruise-repository/sailings/' + id)
}

async function fetchFilters(): Promise<SailingFiltersResponse> {
  return api.get<SailingFiltersResponse>('/cruise-repository/filters')
}

async function fetchShipImages(shipId: string, page = 1): Promise<ShipImagesResponse> {
  return api.get<ShipImagesResponse>('/cruise-repository/ships/' + shipId + '/images?page=' + page)
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch paginated list of sailings with filters.
 */
export function useCruiseSailings(filters: SailingSearchFilters = {}) {
  return useQuery({
    queryKey: cruiseSailingKeys.list(filters),
    queryFn: () => fetchSailings(filters),
    staleTime: 30 * 1000, // 30 seconds - sailings update during sync
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  })
}

/**
 * Fetch a single sailing by ID.
 */
export function useCruiseSailing(id: string | undefined) {
  return useQuery({
    queryKey: cruiseSailingKeys.detail(id ?? ''),
    queryFn: () => fetchSailing(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch available filter options (cruise lines, ships, regions, ports).
 */
export function useCruiseFilters() {
  return useQuery({
    queryKey: cruiseSailingKeys.filters(),
    queryFn: fetchFilters,
    staleTime: 5 * 60 * 1000, // 5 minutes - filters change less frequently
  })
}

/**
 * Fetch ship images with pagination.
 */
export function useShipImages(shipId: string | undefined, page = 1) {
  return useQuery({
    queryKey: cruiseSailingKeys.shipImages(shipId ?? '', page),
    queryFn: () => fetchShipImages(shipId!, page),
    enabled: !!shipId,
    staleTime: 10 * 60 * 1000, // 10 minutes - images rarely change
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format price from CAD cents to display string.
 * Returns null if price is null/undefined.
 */
export function formatPrice(cents: number | null | undefined): string | null {
  if (cents === null || cents === undefined) return null
  const dollars = cents / 100
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}

/**
 * Format sail date for display (e.g., "Dec 15, 2025").
 */
export function formatSailDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00') // Ensure consistent parsing
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Get the cheapest available price from a prices object.
 */
export function getCheapestPrice(prices: {
  inside: number | null
  oceanview: number | null
  balcony: number | null
  suite: number | null
}): number | null {
  const available = [prices.inside, prices.oceanview, prices.balcony, prices.suite].filter(
    (p): p is number => p !== null
  )
  return available.length > 0 ? Math.min(...available) : null
}
