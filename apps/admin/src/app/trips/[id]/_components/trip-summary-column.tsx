'use client'

import { FileText, Pencil } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import type { ItineraryDayWithActivitiesDto } from '@tailfire/shared-types/api'
import { cn } from '@/lib/utils'
import {
  SUMMARY_COLUMN_WIDTH,
  ITINERARY_CARD_STYLES,
  DROP_ZONE_BASE,
  DROP_ZONE_ACTIVE,
  DROP_ZONE_INACTIVE,
  DROP_ZONE_MIN_HEIGHT,
  FOCUS_VISIBLE_RING,
} from '@/lib/itinerary-styles'
import { Button } from '@/components/ui/button'
import { useDroppable } from '@dnd-kit/core'
import { ActivitySummaryItem } from './activity-summary-item'
import { filterItineraryActivities } from '@/lib/activity-constants'

interface TripSummaryColumnProps {
  days: ItineraryDayWithActivitiesDto[]
  itineraryId: string
  itineraryName: string
}

export function TripSummaryColumn({ days, itineraryId, itineraryName }: TripSummaryColumnProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  // Droppable zone for the summary column
  const { setNodeRef, isOver } = useDroppable({
    id: 'trip-summary',
    data: {
      type: 'trip-summary',
      itineraryId,
    },
  })

  // Collect all activities from all days (filter out packages - they belong in Bookings tab)
  const allActivities = days.flatMap((day) =>
    filterItineraryActivities(day.activities).map((activity) => ({
      ...activity,
      dayId: day.id,
      dayDate: day.date,
    }))
  )

  return (
    <div className={cn(SUMMARY_COLUMN_WIDTH, ITINERARY_CARD_STYLES, 'p-0 bg-tern-gray-50/50')}>
      {/* Summary Header */}
      <div className="p-3 border-b border-tern-gray-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-tern-gray-500" />
            <h3 className="font-semibold text-sm text-tern-gray-900">Trip Summary</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit trip"
            className={cn('h-8 w-8 p-0 hover:bg-tern-gray-100', FOCUS_VISIBLE_RING)}
            onClick={() => router.push(`/trips/${params.id}/edit`)}
          >
            <Pencil className="h-4 w-4 text-tern-gray-500" />
          </Button>
        </div>
        <p className="text-xs text-tern-gray-500 line-clamp-1" title={itineraryName}>
          {itineraryName}
        </p>
      </div>

      {/* Instructional Text */}
      <div className="p-2 border-b border-tern-gray-200">
        <p className="text-xs text-tern-gray-500 leading-snug">
          Drag and drop activities here to add them to both the summary and their scheduled day.
        </p>
      </div>

      {/* Drop Zone for All Activities */}
      <div
        ref={setNodeRef}
        aria-label="Drop zone for trip summary activities"
        className={cn(
          DROP_ZONE_MIN_HEIGHT,
          DROP_ZONE_BASE,
          'p-2.5',
          isOver ? DROP_ZONE_ACTIVE : DROP_ZONE_INACTIVE
        )}
      >
        {allActivities.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-tern-gray-300 mx-auto mb-2" />
            <p className="text-xs text-tern-gray-500">No activities yet</p>
            <p className="text-xs text-tern-gray-400 mt-1">
              Drag components from the sidebar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Flat list of all activities with subtle day indicators */}
            {allActivities.map((activity, index) => {
              // Show day label only when day changes
              const prevActivity = allActivities[index - 1]
              const showDayLabel = index === 0 || prevActivity?.dayId !== activity.dayId
              const day = days.find(d => d.id === activity.dayId)

              return (
                <div key={activity.id}>
                  {showDayLabel && day && (
                    <p className="text-[10px] font-medium text-tern-gray-400 uppercase tracking-wide mb-1 mt-2 first:mt-0">
                      {day.title || `Day ${day.dayNumber}`}
                    </p>
                  )}
                  <ActivitySummaryItem
                    itineraryId={itineraryId}
                    activity={activity}
                    dayId={activity.dayId}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
