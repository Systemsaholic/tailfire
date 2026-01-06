'use client'

import { TernBadge } from '@/components/tern/core/tern-badge'
import { getTripStatusLabel, getTripStatusVariant, type TripStatus } from '@/lib/trip-status-constants'

interface TripStatusBadgeProps {
  status: TripStatus
  className?: string
}

/**
 * Trip Status Badge
 * Displays a colored badge for trip status using TernBadge variants
 */
export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const variant = getTripStatusVariant(status)
  const label = getTripStatusLabel(status)

  return (
    <TernBadge variant={variant} className={className}>
      {label}
    </TernBadge>
  )
}
