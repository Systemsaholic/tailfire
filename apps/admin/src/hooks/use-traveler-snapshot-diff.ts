/**
 * React Hook: Traveler Snapshot Diff
 *
 * Fetches traveler snapshot and current contact data, then computes the diff.
 * Provides both data fetching and pure comparison logic.
 */

import { useQuery } from '@tanstack/react-query'
import { compareSnapshots, type SnapshotDiff, type TravelerSnapshot, type Contact } from '@/lib/snapshot-utils'
import { api, ApiError } from '@/lib/api'

type UseTravelerSnapshotDiffParams = {
  tripId: string
  travelerId: string
  contactId?: string | null
  enabled?: boolean
}

type UseTravelerSnapshotDiffReturn = {
  diff: SnapshotDiff | null
  snapshot: TravelerSnapshot | null
  currentContact: Contact | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Fetch traveler snapshot for a given trip and contact
 */
async function fetchTravelerSnapshot(
  tripId: string,
  travelerId: string
): Promise<TravelerSnapshot | null> {
  try {
    return await api.get<TravelerSnapshot>(`/trips/${tripId}/travelers/${travelerId}/snapshot`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // No snapshot exists yet (e.g., trip just created)
      return null
    }
    throw error
  }
}

/**
 * Fetch current contact data
 */
async function fetchContact(contactId: string): Promise<Contact> {
  return api.get<Contact>(`/contacts/${contactId}`)
}

/**
 * Hook to fetch snapshot and current contact, then compute the diff
 */
export function useTravelerSnapshotDiff({
  tripId,
  travelerId,
  contactId,
  enabled = true,
}: UseTravelerSnapshotDiffParams): UseTravelerSnapshotDiffReturn {
  const shouldFetchSnapshot = enabled && Boolean(travelerId)
  const shouldFetchContact = enabled && Boolean(contactId)

  // Fetch snapshot
  const {
    data: snapshot,
    isLoading: isLoadingSnapshot,
    isError: isErrorSnapshot,
    error: errorSnapshot,
  } = useQuery({
    queryKey: ['travelerSnapshot', tripId, travelerId],
    queryFn: () => fetchTravelerSnapshot(tripId, travelerId),
    enabled: shouldFetchSnapshot,
  })

  // Fetch current contact
  const {
    data: currentContact,
    isLoading: isLoadingContact,
    isError: isErrorContact,
    error: errorContact,
  } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => fetchContact(contactId as string),
    enabled: shouldFetchContact,
  })

  // Compute diff when both snapshot and current contact are available
  const diff =
    snapshot && currentContact
      ? compareSnapshots(snapshot, currentContact)
      : null

  return {
    diff,
    snapshot: snapshot ?? null,
    currentContact: currentContact ?? null,
    isLoading: isLoadingSnapshot || isLoadingContact,
    isError: isErrorSnapshot || isErrorContact,
    error: (errorSnapshot || errorContact) as Error | null,
  }
}

/**
 * Pure version: Compute diff from already-fetched data
 *
 * Use this when you already have the snapshot and contact data
 * and just need to compute the diff without fetching.
 */
export function useTravelerSnapshotDiffPure(
  snapshot: TravelerSnapshot | null,
  currentContact: Contact | null
): SnapshotDiff | null {
  if (!snapshot || !currentContact) {
    return null
  }

  return compareSnapshots(snapshot, currentContact)
}
