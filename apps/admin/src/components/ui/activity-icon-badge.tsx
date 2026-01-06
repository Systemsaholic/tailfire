'use client'

/**
 * ActivityIconBadge
 *
 * Reusable component for displaying activity type icons with consistent styling.
 * Uses centralized metadata from activity-constants.ts to ensure icon and color
 * consistency across Itinerary, Bookings, and Payments tabs.
 */

import { cn } from '@/lib/utils'
import { getActivityTypeMetadata, parseColorClass } from '@/lib/activity-constants'

interface ActivityIconBadgeProps {
  /** Activity type (e.g., 'flight', 'lodging', 'tour') */
  type: string | null | undefined
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Shape variant - defaults to 'circle' */
  shape?: 'circle' | 'rounded' | 'square'
  /** Additional className for the wrapper */
  className?: string
}

const sizeClasses = {
  xs: { wrapper: 'p-1', icon: 'h-2.5 w-2.5' },
  sm: { wrapper: 'p-1', icon: 'h-3 w-3' },
  md: { wrapper: 'p-1.5', icon: 'h-4 w-4' },
  lg: { wrapper: 'p-2', icon: 'h-5 w-5' },
}

const shapeClasses = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded',
}

export function ActivityIconBadge({ type, size = 'md', shape = 'circle', className }: ActivityIconBadgeProps) {
  const metadata = getActivityTypeMetadata(type)
  const { iconColor, badgeBg } = parseColorClass(metadata.colorClass)
  const IconComponent = metadata.icon
  const sizes = sizeClasses[size]

  return (
    <div className={cn('flex-shrink-0', shapeClasses[shape], sizes.wrapper, badgeBg, className)}>
      <IconComponent className={cn(sizes.icon, iconColor)} />
    </div>
  )
}
