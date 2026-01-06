/**
 * Generic Auto-Save Hook
 *
 * Provides automatic save functionality with debouncing, validation gating,
 * and lifecycle safety. Reusable across all activity component types.
 *
 * Features:
 * - Debounced saves (default 500ms)
 * - Validation gating (only save when valid)
 * - Prerequisite gating (only save when enabled)
 * - Snapshot comparison (avoid redundant saves)
 * - Timer cleanup on unmount
 * - Post-unmount safety guards
 * - Manual force save option
 * - Status tracking (idle | saving | saved | error)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom debounce hook with proper cleanup
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set new timeout
    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay)

    // Cleanup: cancel pending timeout on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

export interface UseAutoSaveOptions<TResponse> {
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number
  /** Whether the data is valid (from validation schema) */
  isValid?: boolean
  /** Whether auto-save is enabled (false until prerequisites loaded) */
  enabled?: boolean
  /** Callback on successful save */
  onSuccess?: (response: TResponse) => void
  /** Callback on save error */
  onError?: (error: Error) => void
}

export interface UseAutoSaveReturn {
  /** Current save status */
  status: 'idle' | 'saving' | 'saved' | 'error'
  /** Error from last failed save */
  error: Error | null
  /** Timestamp of last successful save */
  lastSavedAt: Date | null
  /** Whether a save is currently in progress */
  isSaving: boolean
  /** Force an immediate save (bypasses debounce) */
  forceSave: () => void
}

/**
 * Generic auto-save hook
 *
 * @param data - Current form data to save
 * @param saveFn - Async function that performs the save
 * @param options - Configuration options
 * @returns Save status and control functions
 *
 * @example
 * ```tsx
 * const { status, lastSavedAt, forceSave } = useAutoSave(
 *   componentData,
 *   (data) => updateFlight.mutateAsync(data),
 *   {
 *     isValid: !hasValidationErrors(errors),
 *     enabled: Boolean(dayId),
 *     onSuccess: (response) => {
 *       setActivityPricingId(response.activityPricingId)
 *     }
 *   }
 * )
 * ```
 */
export function useAutoSave<TData, TResponse>(
  data: TData,
  saveFn: (data: TData) => Promise<TResponse>,
  options: UseAutoSaveOptions<TResponse> = {}
): UseAutoSaveReturn {
  const {
    debounceMs = 500,
    isValid = true,
    enabled = true,
    onSuccess,
    onError,
  } = options

  // Refs (persist across renders, don't trigger re-renders)
  const lastSavedSnapshotRef = useRef<TData | null>(null)
  const isMountedRef = useRef(true)

  // State
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Debounce the data
  const debouncedData = useDebounce(data, debounceMs)

  // Perform save operation
  const performSave = useCallback(
    async (dataToSave: TData) => {
      if (!isMountedRef.current) return

      setStatus('saving')
      setError(null)

      try {
        const response = await saveFn(dataToSave)

        if (!isMountedRef.current) return

        // CRITICAL: Update snapshot from saved data to prevent immediate re-save
        lastSavedSnapshotRef.current = dataToSave

        setStatus('saved')
        setLastSavedAt(new Date())
        onSuccess?.(response)
      } catch (err) {
        if (!isMountedRef.current) return

        const error = err instanceof Error ? err : new Error('Save failed')
        setStatus('error')
        setError(error)
        onError?.(error)
      }
    },
    [saveFn, onSuccess, onError]
  )

  // Auto-save effect (triggered by debounced data changes)
  useEffect(() => {
    // Guard conditions
    if (!enabled || !isValid) {
      return
    }

    // Compare against last saved snapshot to avoid redundant saves
    // Using JSON.stringify for deep comparison (can swap to fast-deep-equal if perf issues)
    const currentDataStr = JSON.stringify(debouncedData)
    const lastSavedStr = lastSavedSnapshotRef.current
      ? JSON.stringify(lastSavedSnapshotRef.current)
      : null

    if (currentDataStr === lastSavedStr) {
      return
    }

    // Trigger save
    performSave(debouncedData)
  }, [debouncedData, enabled, isValid, performSave])

  // Lifecycle management: cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Force save function (bypasses debounce, uses latest data)
  const forceSave = useCallback(() => {
    performSave(data) // Use latest data, not debounced
  }, [data, performSave])

  return {
    status,
    error,
    lastSavedAt,
    isSaving: status === 'saving',
    forceSave,
  }
}
