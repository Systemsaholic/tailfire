'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import type { ItineraryDayWithActivitiesDto } from '@tailfire/shared-types/api'
import { cn } from '@/lib/utils'
import { parseISODate } from '@/lib/date-utils'
import {
  COLUMN_WIDTH,
  ITINERARY_CARD_STYLES,
  DROP_ZONE_BASE,
  DROP_ZONE_ACTIVE,
  DROP_ZONE_INACTIVE,
  DROP_ZONE_MIN_HEIGHT,
  FOCUS_VISIBLE_RING,
} from '@/lib/itinerary-styles'
import { Button } from '@/components/ui/button'
import { TernBadge } from '@/components/tern/core'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ActivityListItem } from './activity-list-item'
import { DayEditModal } from './day-edit-modal'
import { ActivityTypeSelector } from './activity-type-selector'
import { getActivityTypeMetadata, filterItineraryActivities, type UIActivityType } from '@/lib/activity-constants'
import { useActivityNavigation } from '@/hooks/use-activity-navigation'

interface DayColumnProps {
  day: ItineraryDayWithActivitiesDto
  itineraryId: string
}

export function DayColumn({ day, itineraryId }: DayColumnProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [showEditModal, setShowEditModal] = useState(false)
  const { storeReturnContext } = useActivityNavigation()

  // Droppable zone for this day column
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: {
      type: 'day-column',
      dayId: day.id,
    },
  })

  // Filter out packages - they belong in Bookings tab, not itinerary
  const activities = filterItineraryActivities(day.activities)

  // Format date for display (e.g., "Wed, Sep 9")
  // Uses parseISODate to avoid TZ shift when parsing date-only strings
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = parseISODate(dateString)
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get display title for the day header
  const dayHeaderTitle = day.date ? formatDate(day.date) : `Day ${day.dayNumber}`

  const handleSelectActivityType = (type: UIActivityType) => {
    // Store return context for navigation back after form submission
    storeReturnContext({
      tripId: params.id,
      itineraryId: itineraryId,
      dayId: day.id,
      viewMode: 'board',
    })

    const metadata = getActivityTypeMetadata(type)
    const searchParams = new URLSearchParams({
      dayId: day.id,
      itineraryId: itineraryId,
      type: type,
      name: metadata.defaultName,
    })
    router.push(`/trips/${params.id}/activities/new?${searchParams.toString()}`)
  }

  return (
    <>
      <div className={cn(COLUMN_WIDTH, ITINERARY_CARD_STYLES, 'p-0')}>
        {/* Day Header */}
        <div className="group p-3 border-b border-tern-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-tern-gray-900">
                  {dayHeaderTitle}
                </p>
                <TernBadge variant="secondary">
                  {activities.length}
                </TernBadge>
              </div>
              {day.title && (
                <p
                  className="text-xs text-tern-gray-500 truncate mt-0.5"
                  title={day.title}
                >
                  {day.title}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(true)}
              aria-label="Edit day"
              className={cn(
                'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
                FOCUS_VISIBLE_RING
              )}
            >
              <Pencil className="h-3.5 w-3.5 text-tern-gray-500" />
            </Button>
          </div>
        </div>

        {/* Drop Zone for Activities */}
        <div
          ref={setNodeRef}
          aria-label={`Drop zone for ${day.title || dayHeaderTitle}`}
          className={cn(
            DROP_ZONE_MIN_HEIGHT,
            DROP_ZONE_BASE,
            'p-3',
            isOver ? DROP_ZONE_ACTIVE : DROP_ZONE_INACTIVE
          )}
        >
        <SortableContext
          items={activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityListItem
                key={activity.id}
                itineraryId={itineraryId}
                activity={activity}
                dayId={day.id}
                dayDate={day.date}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Activity Button */}
        <ActivityTypeSelector onSelect={handleSelectActivityType}>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Add activity"
            className={cn(
              'w-full mt-2 h-8 text-tern-gray-500 hover:text-tern-gray-900 hover:bg-tern-gray-50',
              FOCUS_VISIBLE_RING
            )}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs">Add Activity</span>
          </Button>
        </ActivityTypeSelector>
        </div>
      </div>

      {/* Day Edit Modal */}
      <DayEditModal
        day={day}
        itineraryId={itineraryId}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />
    </>
  )
}
