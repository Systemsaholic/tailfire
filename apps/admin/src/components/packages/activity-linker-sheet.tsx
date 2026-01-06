'use client'

/**
 * Activity Linker Sheet
 *
 * Side panel for linking/unlinking activities to a booking.
 * Shows all activities for the trip, with checkboxes to select which to link.
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBooking,
  useLinkActivities,
  useUnlinkActivities,
} from '@/hooks/use-bookings'
import { useItineraries } from '@/hooks/use-itineraries'
import { useItineraryDaysWithActivities } from '@/hooks/use-itinerary-days'
import { useToast } from '@/hooks/use-toast'
import {
  Link2,
  Unlink,
  AlertCircle,
} from 'lucide-react'
import { ActivityIconBadge } from '@/components/ui/activity-icon-badge'

interface ActivityLinkerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  bookingId: string | null
}

// Activity with day context
interface ActivityWithDay {
  id: string
  name: string
  activityType: string
  dayNumber: number
  dayDate: string | null
  packageId: string | null
}

export function ActivityLinkerSheet({
  open,
  onOpenChange,
  tripId,
  bookingId,
}: ActivityLinkerSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [initialLinkedIds, setInitialLinkedIds] = useState<Set<string>>(new Set())

  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId, { enabled: !!bookingId })
  const { data: itineraries, isLoading: itinerariesLoading } = useItineraries(tripId, { isSelected: true })
  const selectedItinerary = itineraries?.[0] || null
  const { data: days, isLoading: daysLoading } = useItineraryDaysWithActivities(selectedItinerary?.id || null)

  const linkActivities = useLinkActivities()
  const unlinkActivities = useUnlinkActivities()
  const { toast } = useToast()

  // Flatten all activities from all days with day context
  const allActivities: ActivityWithDay[] = useMemo(() => {
    if (!days) return []

    return days.flatMap((day) =>
      (day.activities || []).map((activity) => ({
        id: activity.id,
        name: activity.name,
        activityType: activity.activityType,
        dayNumber: day.dayNumber,
        dayDate: day.date || null,
        packageId: activity.packageId || null,
      }))
    )
  }, [days])

  // Initialize selected activities from booking's linked activities
  useEffect(() => {
    if (open && booking) {
      const linkedIds = new Set(booking.activities.map((a) => a.id))
      setSelectedIds(linkedIds)
      setInitialLinkedIds(linkedIds)
    } else if (!open) {
      setSelectedIds(new Set())
      setInitialLinkedIds(new Set())
    }
  }, [open, booking])

  // Toggle activity selection
  const toggleActivity = (activityId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  // Calculate changes
  const toLink = useMemo(() => {
    return [...selectedIds].filter((id) => !initialLinkedIds.has(id))
  }, [selectedIds, initialLinkedIds])

  const toUnlink = useMemo(() => {
    return [...initialLinkedIds].filter((id) => !selectedIds.has(id))
  }, [selectedIds, initialLinkedIds])

  const hasChanges = toLink.length > 0 || toUnlink.length > 0

  // Save changes
  const handleSave = async () => {
    if (!bookingId) return

    try {
      // Link new activities
      if (toLink.length > 0) {
        await linkActivities.mutateAsync({ bookingId, activityIds: toLink })
      }

      // Unlink removed activities
      if (toUnlink.length > 0) {
        await unlinkActivities.mutateAsync({ bookingId, activityIds: toUnlink })
      }

      toast({
        title: 'Activities updated',
        description: `${toLink.length} linked, ${toUnlink.length} unlinked.`,
      })

      onOpenChange(false)
    } catch (error) {
      // Extract error message from API response
      let errorMessage = 'Failed to update activity links. Please try again.'

      if (error instanceof Error) {
        // Check for common API error patterns
        const message = error.message.toLowerCase()
        if (message.includes('different itinerary') || message.includes('same itinerary')) {
          errorMessage =
            'Cannot link activities from different itineraries. All activities in a booking must belong to the same itinerary.'
        } else if (message.includes('different trip')) {
          errorMessage = 'Cannot link activities from a different trip.'
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      toast({
        title: 'Failed to Link Activities',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const isLoading = bookingLoading || itinerariesLoading || daysLoading
  const isPending = linkActivities.isPending || unlinkActivities.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Link Activities</SheetTitle>
          <SheetDescription>
            Select activities to include in this booking. Activities can only be linked to one booking at a time.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 py-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : allActivities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities</h3>
            <p className="text-sm text-gray-500 text-center">
              Add activities to your itinerary first, then you can link them to bookings.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6 py-4">
            <div className="space-y-1">
              {allActivities.map((activity) => {
                const isSelected = selectedIds.has(activity.id)
                const isLinkedToOther = Boolean(activity.packageId && activity.packageId !== bookingId)
                const isDisabled = isLinkedToOther

                return (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-primary/5 border-primary'
                        : isDisabled
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => !isDisabled && toggleActivity(activity.id)}
                      disabled={isDisabled}
                    />
                    <ActivityIconBadge type={activity.activityType} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{activity.name}</div>
                      <div className="text-sm text-gray-500">
                        Day {activity.dayNumber}
                        {activity.dayDate && ` • ${new Date(activity.dayDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    {isLinkedToOther && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Link2 className="h-3 w-3 mr-1" />
                        Linked
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary of changes */}
        {hasChanges && (
          <div className="py-3 px-4 -mx-6 bg-gray-50 border-t border-b text-sm">
            {toLink.length > 0 && (
              <div className="flex items-center gap-2 text-green-700">
                <Link2 className="h-4 w-4" />
                <span>{toLink.length} to link</span>
              </div>
            )}
            {toUnlink.length > 0 && (
              <div className="flex items-center gap-2 text-amber-700">
                <Unlink className="h-4 w-4" />
                <span>{toUnlink.length} to unlink</span>
              </div>
            )}
          </div>
        )}

        <SheetFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
