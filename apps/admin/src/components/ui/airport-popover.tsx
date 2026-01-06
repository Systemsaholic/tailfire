'use client'

import * as React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Building2, MapPin, Clock } from 'lucide-react'
import type { AirportInfo } from '@/lib/airport-utils'

interface AirportPopoverProps {
  /** Airport information to display in the popover */
  airport: AirportInfo | null
  /** Content to wrap with the hover trigger */
  children: React.ReactNode
  /** Side to display the popover on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment of the popover */
  align?: 'start' | 'center' | 'end'
}

/**
 * AirportPopover - Hover popover displaying airport details
 *
 * Wraps children with a HoverCard that shows airport information
 * including name, city, country, timezone, and coordinates.
 *
 * @example
 * ```tsx
 * const airport = getAirportInfo('YYZ', persistedData, 'America/Toronto')
 *
 * <AirportPopover airport={airport}>
 *   <div className="airport-code">YYZ</div>
 * </AirportPopover>
 * ```
 */
export function AirportPopover({
  airport,
  children,
  side = 'top',
  align = 'center',
}: AirportPopoverProps) {
  // If no airport info, just render children without popover
  if (!airport) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-72"
        side={side}
        align={align}
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Airport Name & Code */}
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{airport.name}</p>
              <p className="text-xs text-muted-foreground">{airport.code}</p>
            </div>
          </div>

          {/* Location (City, Country) */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              {airport.city}
              {airport.country && `, ${airport.country}`}
            </span>
          </div>

          {/* Timezone */}
          {airport.timezone && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                {formatTimezone(airport.timezone)}
              </span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/**
 * Format IANA timezone string for display
 * "America/New_York" -> "America/New York"
 */
function formatTimezone(timezone: string): string {
  return timezone.replace(/_/g, ' ')
}
