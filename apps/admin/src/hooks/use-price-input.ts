/**
 * Reusable Price Input Hook
 *
 * Solves the cursor jumping bug by tracking editing state and only syncing
 * with external changes when the user is not actively typing.
 * Formats display value only on blur.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { dollarsToCents, centsToDollars } from '@/lib/pricing'

export interface UsePriceInputReturn {
  /** Raw display value (what user sees and types) */
  displayValue: string
  /** Parsed cents value (for state/submission) */
  centsValue: number
  /** Handler for input onChange */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for input onBlur (formats display) */
  onBlur: () => void
}

/**
 * Hook for price input fields that prevents cursor jumping
 *
 * @param initialCents - Initial value in cents
 * @param currency - Optional currency for formatting (currently unused, reserved for future)
 * @returns Display value, cents value, and event handlers
 */
export function usePriceInput(
  initialCents: number = 0,
  _currency?: string
): UsePriceInputReturn {
  // Store both raw input (for editing) and formatted display
  const [displayValue, setDisplayValue] = useState<string>(centsToDollars(initialCents))
  const [centsValue, setCentsValue] = useState<number>(initialCents)

  // Track the last initialCents value we've applied to avoid unnecessary updates
  const lastInitialRef = useRef<number | null>(null)
  // Track if user is actively typing to prevent formatting mid-keystroke
  const isEditingRef = useRef(false)

  // Sync with external changes (e.g., when edit mode loads data)
  // Only update if not currently editing AND the value actually changed
  useEffect(() => {
    if (isEditingRef.current) return
    if (initialCents !== lastInitialRef.current) {
      setDisplayValue(centsToDollars(initialCents))
      setCentsValue(initialCents)
      lastInitialRef.current = initialCents
    }
  }, [initialCents])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Mark as actively editing to prevent useEffect from reformatting
    isEditingRef.current = true

    // Store raw value during typing (no formatting)
    setDisplayValue(value)

    // Convert to cents for state
    const cents = dollarsToCents(value)
    setCentsValue(cents)
  }, [])

  const onBlur = useCallback(() => {
    // Mark editing as complete BEFORE formatting so useEffect can run if needed
    isEditingRef.current = false

    // Format to 2 decimals only on blur
    const formatted = centsToDollars(centsValue)
    setDisplayValue(formatted)

    // Update lastInitialRef to reflect the current state after blur
    lastInitialRef.current = centsValue
  }, [centsValue])

  return {
    displayValue,
    centsValue,
    onChange,
    onBlur,
  }
}
