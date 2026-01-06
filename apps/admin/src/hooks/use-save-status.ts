/**
 * Save Status Hook
 *
 * Provides save status state tracking for activity forms.
 * Initializes status based on whether editing an existing activity.
 *
 * Features:
 * - Auto-initializes to 'saved' when editing existing activities
 * - Validates updatedAt timestamps before creating Date objects
 * - Provides consistent API across all activity forms
 */

import { useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseSaveStatusOptions {
  /** Activity ID - if present, initializes as 'saved' */
  activityId?: string | null
  /** Activity updatedAt timestamp - used to initialize lastSavedAt */
  updatedAt?: string | Date | null
}

export interface UseSaveStatusReturn {
  /** Current save status */
  saveStatus: SaveStatus
  /** Update save status */
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>
  /** Timestamp of last successful save */
  lastSavedAt: Date | null
  /** Update last saved timestamp */
  setLastSavedAt: React.Dispatch<React.SetStateAction<Date | null>>
}

/**
 * Safely parse a date value, returning null if invalid
 */
function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  // Check for Invalid Date
  if (isNaN(date.getTime())) return null

  return date
}

/**
 * Hook for tracking save status in activity forms.
 *
 * @param options - Configuration with activityId and updatedAt
 * @returns Save status state and setters
 *
 * @example
 * ```tsx
 * const { saveStatus, setSaveStatus, lastSavedAt, setLastSavedAt } = useSaveStatus({
 *   activityId: activity?.id,
 *   updatedAt: activity?.updatedAt,
 * })
 * ```
 */
export function useSaveStatus(options: UseSaveStatusOptions = {}): UseSaveStatusReturn {
  const { activityId, updatedAt } = options

  // Initialize status to 'saved' if editing existing activity
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(activityId ? 'saved' : 'idle')

  // Initialize lastSavedAt from updatedAt with date validation
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => parseDate(updatedAt))

  return {
    saveStatus,
    setSaveStatus,
    lastSavedAt,
    setLastSavedAt,
  }
}
