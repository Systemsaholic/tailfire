'use client'

/**
 * Aircraft Popover
 *
 * Hover popover displaying aircraft details from Aerodatabox API.
 * Shows aircraft image (lazy loaded), model name, and registration.
 *
 * Features:
 * - Lazy loading images to avoid blocking render
 * - Fallback placeholder when no image URL
 * - Error handling for broken images
 * - No-data guard: renders children only when no aircraft data
 */

import * as React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Plane, Hash, Camera } from 'lucide-react'

export interface AircraftInfo {
  model?: string | null
  registration?: string | null
  modeS?: string | null
  imageUrl?: string | null
  imageAuthor?: string | null
}

interface AircraftPopoverProps {
  /** Aircraft information to display in the popover */
  aircraft: AircraftInfo | null
  /** Content to wrap with the hover trigger */
  children: React.ReactNode
  /** Side to display the popover on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment of the popover */
  align?: 'start' | 'center' | 'end'
}

/**
 * AircraftPopover - Hover popover displaying aircraft details
 *
 * Wraps children with a HoverCard that shows aircraft information
 * including image (with photographer credit), model, and registration.
 *
 * @example
 * ```tsx
 * <AircraftPopover
 *   aircraft={{
 *     model: 'Boeing 777-300ER',
 *     registration: 'N12345',
 *     imageUrl: 'https://...',
 *     imageAuthor: 'John Doe',
 *   }}
 * >
 *   <Plane className="w-4 h-4" />
 * </AircraftPopover>
 * ```
 */
export function AircraftPopover({
  aircraft,
  children,
  side = 'top',
  align = 'center',
}: AircraftPopoverProps) {
  // Track image loading error state
  const [imageError, setImageError] = React.useState(false)

  // Reset error state when imageUrl changes
  React.useEffect(() => {
    setImageError(false)
  }, [aircraft?.imageUrl])

  // If no aircraft info or no model, just render children without popover
  if (!aircraft || !aircraft.model) {
    return <>{children}</>
  }

  const showImage = aircraft.imageUrl && !imageError

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80"
        side={side}
        align={align}
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Aircraft Image (with lazy loading and fallback) */}
          <div className="relative w-full h-32 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
            {showImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aircraft.imageUrl!}
                  alt={aircraft.model || 'Aircraft'}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                {aircraft.imageAuthor && (
                  <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                    <Camera className="h-2.5 w-2.5" />
                    {aircraft.imageAuthor}
                  </div>
                )}
              </>
            ) : (
              // Fallback placeholder when no image or image failed to load
              <div className="w-full h-full flex items-center justify-center">
                <Plane className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              </div>
            )}
          </div>

          {/* Aircraft Model */}
          <div className="flex items-start gap-2">
            <Plane className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{aircraft.model}</p>
            </div>
          </div>

          {/* Registration */}
          {aircraft.registration && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono">{aircraft.registration}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
