'use client'

/**
 * Shared Itinerary Tabs Component
 *
 * A simpler wrapper around itinerary selection that can be used by both:
 * - Itinerary Page (full editing capabilities via ItinerarySelector)
 * - Bookings Page (filter-only mode with "All" option)
 *
 * For full itinerary management (create, edit, delete), use ItinerarySelector directly.
 * This component provides a consistent visual appearance for the itinerary tabs header.
 */

import { Check, Layers } from 'lucide-react'
import type { ItineraryResponseDto } from '@tailfire/shared-types/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TripItineraryTabsProps {
  itineraries: ItineraryResponseDto[]
  selectedItineraryId: string | 'all' | null
  onSelectItinerary: (itineraryId: string | 'all') => void
  isLoading?: boolean
  /** Show "All Itineraries" option (useful for filtering views) */
  showAllOption?: boolean
  /** Label to show before the tabs */
  label?: string
}

/**
 * Shared itinerary tabs component for consistent header layout.
 *
 * SSR-safe: No client-side hooks for data fetching, data passed via props.
 * Parent page responsible for fetching itineraries.
 */
export function TripItineraryTabs({
  itineraries,
  selectedItineraryId,
  onSelectItinerary,
  isLoading = false,
  showAllOption = false,
  label = 'Filter by Itinerary:',
}: TripItineraryTabsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-500 mr-2">
          <Layers className="h-4 w-4 inline mr-1" />
          {label}
        </span>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  // Don't render if only one itinerary and no "All" option
  if (!showAllOption && itineraries.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
      <span className="text-sm font-medium text-gray-500 mr-2">
        <Layers className="h-4 w-4 inline mr-1" />
        {label}
      </span>

      {/* All Itineraries Option */}
      {showAllOption && (
        <Button
          variant={selectedItineraryId === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectItinerary('all')}
          className={cn(
            'h-8 px-3',
            selectedItineraryId === 'all' && 'bg-teal-600 hover:bg-teal-700'
          )}
        >
          {selectedItineraryId === 'all' && <Check className="h-3 w-3 mr-1" />}
          All Itineraries
        </Button>
      )}

      {/* Individual Itinerary Options */}
      {itineraries.map((itinerary) => (
        <Button
          key={itinerary.id}
          variant={selectedItineraryId === itinerary.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectItinerary(itinerary.id)}
          className={cn(
            'h-8 px-3',
            selectedItineraryId === itinerary.id && 'bg-teal-600 hover:bg-teal-700'
          )}
        >
          {selectedItineraryId === itinerary.id && <Check className="h-3 w-3 mr-1" />}
          {itinerary.name}
        </Button>
      ))}
    </div>
  )
}
