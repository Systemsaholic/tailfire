/**
 * Trip Date Warning Component
 *
 * Displays a warning when an activity date falls outside the trip's date range.
 * Purely presentational - has no form-level side effects.
 */

import { AlertTriangle } from 'lucide-react'
import { isDateOutOfTripRange } from '@/lib/date-utils'

interface TripDateWarningProps {
  /** The activity date to check (ISO datetime or YYYY-MM-DD) */
  date: string | null | undefined
  /** Trip start date (YYYY-MM-DD) */
  tripStartDate: string | null | undefined
  /** Trip end date (YYYY-MM-DD) */
  tripEndDate: string | null | undefined
  /** Optional label for the date field (e.g., "Departure date", "Check-in") */
  fieldLabel?: string
}

/**
 * Renders a warning message when a date is outside the trip's date range.
 * Returns null (renders nothing) when:
 * - The date is empty/null/undefined
 * - The trip dates are missing or invalid
 * - The date is within the valid range
 */
export function TripDateWarning({
  date,
  tripStartDate,
  tripEndDate,
  fieldLabel,
}: TripDateWarningProps) {
  // Only render when date has a value AND is out of range
  if (!isDateOutOfTripRange(date, tripStartDate, tripEndDate)) {
    return null
  }

  return (
    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      {fieldLabel || 'This date'} is outside trip dates ({tripStartDate} – {tripEndDate})
    </p>
  )
}
