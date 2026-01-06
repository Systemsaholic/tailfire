/**
 * Hooks for fetching cruise reference data (cruise lines, ships, regions, ports).
 *
 * Uses React Query for caching and stale-while-revalidate pattern.
 * Data is loaded from the database-backed API with TTL caching.
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useMemo } from 'react'
import type { ComboboxOption } from './use-combobox-options'

// ============================================================================
// Types (matching API DTOs)
// ============================================================================

export interface CruiseLine {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

export interface CruiseShip {
  id: string
  name: string
  slug: string
  providerIdentifier: string
  cruiseLineId: string | null
  cruiseLineName: string | null
}

export interface CruiseRegion {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

export interface CruisePort {
  id: string
  name: string
  slug: string
  providerIdentifier: string
}

export interface ReferenceDataMetadata {
  counts: {
    cruiseLines: number
    cruiseShips: number
    cruiseRegions: number
    cruisePorts: number
  }
  cacheStatus: string
}

// ============================================================================
// Query Keys
// ============================================================================

export const referenceDataKeys = {
  all: ['reference-data'] as const,
  cruiseLines: () => [...referenceDataKeys.all, 'cruise-lines'] as const,
  cruiseShips: (cruiseLineId?: string) =>
    cruiseLineId !== undefined
      ? ([...referenceDataKeys.all, 'cruise-ships', cruiseLineId] as const)
      : ([...referenceDataKeys.all, 'cruise-ships'] as const),
  cruiseRegions: () => [...referenceDataKeys.all, 'cruise-regions'] as const,
  cruisePorts: () => [...referenceDataKeys.all, 'cruise-ports'] as const,
  metadata: () => [...referenceDataKeys.all, 'metadata'] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all cruise lines
 */
export function useCruiseLines() {
  return useQuery({
    queryKey: referenceDataKeys.cruiseLines(),
    queryFn: async () => api.get<CruiseLine[]>('/reference-data/cruise-lines'),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches API cache TTL)
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch cruise ships, optionally filtered by cruise line UUID
 */
export function useCruiseShips(cruiseLineId?: string) {
  return useQuery({
    queryKey: referenceDataKeys.cruiseShips(cruiseLineId),
    queryFn: async () => {
      const url = cruiseLineId !== undefined
        ? `/reference-data/cruise-ships?cruiseLineId=${cruiseLineId}`
        : '/reference-data/cruise-ships'
      return api.get<CruiseShip[]>(url)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch all cruise regions
 */
export function useCruiseRegions() {
  return useQuery({
    queryKey: referenceDataKeys.cruiseRegions(),
    queryFn: async () => api.get<CruiseRegion[]>('/reference-data/cruise-regions'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch all cruise ports
 */
export function useCruisePorts() {
  return useQuery({
    queryKey: referenceDataKeys.cruisePorts(),
    queryFn: async () => api.get<CruisePort[]>('/reference-data/cruise-ports'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch reference data metadata
 */
export function useReferenceDataMetadata() {
  return useQuery({
    queryKey: referenceDataKeys.metadata(),
    queryFn: async () => api.get<ReferenceDataMetadata>('/reference-data/metadata'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// ============================================================================
// Combobox Options Hooks
// ============================================================================

/**
 * Cruise lines as combobox options
 * Value is the internal UUID, label is the name
 */
export function useCruiseLineOptions(): ComboboxOption<CruiseLine>[] | undefined {
  const { data: lines, isLoading } = useCruiseLines()

  return useMemo(() => {
    if (isLoading || !lines) return undefined

    return lines.map((line) => ({
      value: line.id,
      label: line.name,
      data: line,
    }))
  }, [lines, isLoading])
}

/**
 * Cruise ships as combobox options (optionally filtered by cruise line UUID)
 * Value is the internal UUID, label is the name
 */
export function useCruiseShipOptions(cruiseLineId?: string): ComboboxOption<CruiseShip>[] | undefined {
  const { data: ships, isLoading } = useCruiseShips(cruiseLineId)

  return useMemo(() => {
    if (isLoading || !ships) return undefined

    return ships.map((ship) => ({
      value: ship.id,
      label: ship.name,
      data: ship,
    }))
  }, [ships, isLoading])
}

/**
 * Cruise regions as combobox options
 * Value is the internal UUID, label is the name
 */
export function useCruiseRegionOptions(): ComboboxOption<CruiseRegion>[] | undefined {
  const { data: regions, isLoading } = useCruiseRegions()

  return useMemo(() => {
    if (isLoading || !regions) return undefined

    return regions.map((region) => ({
      value: region.id,
      label: region.name,
      data: region,
    }))
  }, [regions, isLoading])
}

/**
 * Cruise ports as combobox options
 * Value is the internal UUID, label is the name
 */
export function useCruisePortOptions(): ComboboxOption<CruisePort>[] | undefined {
  const { data: ports, isLoading } = useCruisePorts()

  return useMemo(() => {
    if (isLoading || !ports) return undefined

    return ports.map((port) => ({
      value: port.id,
      label: port.name,
      data: port,
    }))
  }, [ports, isLoading])
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Find cruise line by internal UUID
 */
export function useFindCruiseLine(id: string | null) {
  const { data: lines } = useCruiseLines()

  return useMemo(() => {
    if (!lines || id === null) return null
    return lines.find((line) => line.id === id) || null
  }, [lines, id])
}

/**
 * Find cruise ship by internal UUID
 */
export function useFindCruiseShip(id: string | null) {
  const { data: ships } = useCruiseShips()

  return useMemo(() => {
    if (!ships || id === null) return null
    return ships.find((ship) => ship.id === id) || null
  }, [ships, id])
}

/**
 * Find cruise region by internal UUID
 */
export function useFindCruiseRegion(id: string | null) {
  const { data: regions } = useCruiseRegions()

  return useMemo(() => {
    if (!regions || id === null) return null
    return regions.find((region) => region.id === id) || null
  }, [regions, id])
}

/**
 * Find cruise port by internal UUID
 */
export function useFindCruisePort(id: string | null) {
  const { data: ports } = useCruisePorts()

  return useMemo(() => {
    if (!ports || id === null) return null
    return ports.find((port) => port.id === id) || null
  }, [ports, id])
}

/**
 * Get ships for a specific cruise line by cruise line UUID
 */
export function useShipsForLine(cruiseLineId: string | null) {
  const { data: allShips } = useCruiseShips()

  return useMemo(() => {
    if (!allShips || cruiseLineId === null) return []
    return allShips.filter((ship) => ship.cruiseLineId === cruiseLineId)
  }, [allShips, cruiseLineId])
}
