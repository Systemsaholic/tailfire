'use client'

import { useState, useMemo, useEffect } from 'react'
import { CalendarPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DateRangeInput } from '@/components/ui/date-range-input'
import { useToast } from '@/hooks/use-toast'
import { useBatchCreateItineraryDays } from '@/hooks/use-itinerary-days'
import type { ItineraryDayResponseDto } from '@tailfire/shared-types/api'

interface AddDaysDialogProps {
  itineraryId: string
  existingDays: ItineraryDayResponseDto[]
  tripStartDate?: string | null
  tripEndDate?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * AddDaysDialog Component
 *
 * Allows users to add multiple days to an itinerary.
 * - When trip has dates: Shows tabs for "By Count" and "By Dates"
 * - When trip has no dates: Shows only count input
 */
export function AddDaysDialog({
  itineraryId,
  existingDays,
  tripStartDate,
  tripEndDate,
  open,
  onOpenChange,
  onSuccess,
}: AddDaysDialogProps) {
  const { toast } = useToast()
  const batchCreate = useBatchCreateItineraryDays(itineraryId)

  // Form state
  const [count, setCount] = useState(1)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'count' | 'dates'>('count')
  const [position, setPosition] = useState<'start' | 'end'>('end')

  // When position changes to 'start', switch to count tab (date range not supported for start)
  useEffect(() => {
    if (position === 'start') {
      setActiveTab('count')
    }
  }, [position])

  // Determine if trip has dates
  const hasTripDates = !!(tripStartDate && tripEndDate)

  // Find the last day info for preview (for adding at end)
  const lastDay = useMemo(() => {
    if (existingDays.length === 0) return null
    return existingDays.reduce((max, day) =>
      day.dayNumber > max.dayNumber ? day : max
    )
  }, [existingDays])

  // Find the first dated day (for adding at start)
  const firstDatedDay = useMemo(() => {
    const datedDays = existingDays
      .filter((d) => d.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    return datedDays.length > 0 ? datedDays[0] : null
  }, [existingDays])

  // Calculate min date for date range (must be after last dated day)
  const minStartDate = useMemo(() => {
    if (!hasTripDates) return tripStartDate || undefined

    // Find the last day with a date
    const lastDatedDay = existingDays
      .filter((d) => d.date)
      .sort((a, b) => (a.date! > b.date! ? -1 : 1))[0]

    if (lastDatedDay?.date) {
      // Next day after last dated day
      const nextDate = new Date(lastDatedDay.date)
      nextDate.setDate(nextDate.getDate() + 1)
      return nextDate.toISOString().split('T')[0]
    }

    return tripStartDate || undefined
  }, [existingDays, tripStartDate, hasTripDates])

  // Preview text
  const previewText = useMemo(() => {
    // Handle "Add to Start" position
    if (position === 'start') {
      if (count <= 0) return 'Enter number of days to add'

      // Calculate dates going backwards from first dated day
      let dateInfo = ''
      if (firstDatedDay?.date) {
        const firstDate = new Date(firstDatedDay.date)
        const dates: string[] = []
        for (let i = 0; i < count; i++) {
          const newDate = new Date(firstDate)
          newDate.setDate(firstDate.getDate() - (count - i))
          dates.push(newDate.toISOString().split('T')[0]!)
        }
        if (dates.length === 1) {
          dateInfo = ` (${dates[0]})`
        } else {
          dateInfo = ` (${dates[0]} to ${dates[dates.length - 1]})`
        }
      }

      if (existingDays.length === 0) {
        // No existing days - same as adding at end
        if (count === 1) return 'Will create Day 1'
        return `Will create Days 1-${count} (${count} days)`
      }

      // Adding at start shifts existing days
      if (count === 1) {
        return `Will insert Day 1${dateInfo}, renumbering existing days`
      }
      return `Will insert Days 1-${count}${dateInfo}, renumbering existing days (${count} days)`
    }

    // Handle "Add to End" position (original behavior)
    const startDayNum = (lastDay?.dayNumber ?? 0) + 1

    if (activeTab === 'count') {
      if (count <= 0) return 'Enter number of days to add'
      if (count === 1) {
        return `Will create Day ${startDayNum}`
      }
      return `Will create Days ${startDayNum}-${startDayNum + count - 1} (${count} days)`
    }

    // Date range mode
    if (!dateRange?.start || !dateRange?.end) {
      return 'Select a date range'
    }

    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (dayCount <= 0) return 'Invalid date range'
    if (dayCount === 1) {
      return `Will create Day ${startDayNum} (${dateRange.start})`
    }
    return `Will create Days ${startDayNum}-${startDayNum + dayCount - 1} (${dayCount} days from ${dateRange.start} to ${dateRange.end})`
  }, [activeTab, count, dateRange, lastDay, position, firstDatedDay, existingDays.length])

  // Validation
  const isValid = useMemo(() => {
    if (activeTab === 'count') {
      return count >= 1 && count <= 30
    }
    // Date range mode
    if (!dateRange?.start || !dateRange?.end) {
      return false
    }
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return dayCount >= 1 && dayCount <= 30
  }, [activeTab, count, dateRange])

  const handleSubmit = async () => {
    try {
      if (activeTab === 'count' || position === 'start') {
        await batchCreate.mutateAsync({ count, position })
      } else {
        await batchCreate.mutateAsync({
          startDate: dateRange?.start,
          endDate: dateRange?.end,
          position,
        })
      }

      toast({
        title: 'Days Added',
        description: previewText.replace('Will create', 'Created').replace('Will insert', 'Inserted'),
      })

      // Reset form and close
      setCount(1)
      setDateRange(null)
      setActiveTab('count')
      setPosition('end')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add days'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setCount(1)
      setDateRange(null)
      setActiveTab('count')
      setPosition('end')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-tern-teal-600" />
            Add Days
          </DialogTitle>
          <DialogDescription>
            {existingDays.length === 0
              ? 'Add days to start building your itinerary.'
              : `Add more days to your itinerary (currently ${existingDays.length} days).`}
          </DialogDescription>
        </DialogHeader>

        {/* Position selector */}
        <div className="space-y-2">
          <Label>Add days to</Label>
          <RadioGroup
            value={position}
            onValueChange={(v) => setPosition(v as 'start' | 'end')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="end" id="position-end" />
              <Label htmlFor="position-end" className="font-normal cursor-pointer">
                End of itinerary
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="start" id="position-start" />
              <Label htmlFor="position-start" className="font-normal cursor-pointer">
                Start of itinerary
              </Label>
            </div>
          </RadioGroup>
        </div>

        {hasTripDates && position === 'end' ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'count' | 'dates')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="count">By Count</TabsTrigger>
              <TabsTrigger value="dates">By Dates</TabsTrigger>
            </TabsList>

            <TabsContent value="count" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="day-count">Number of Days</Label>
                <Input
                  id="day-count"
                  type="number"
                  min={1}
                  max={30}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  placeholder="1-30"
                />
                <p className="text-xs text-muted-foreground">
                  Days will continue the date sequence if existing days have dates.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DateRangeInput
                  fromValue={dateRange?.start || null}
                  toValue={dateRange?.end || null}
                  minFromDate={minStartDate}
                  maxToDate={tripEndDate || undefined}
                  onChange={(from, to) => setDateRange(from && to ? { start: from, end: to } : null)}
                  showLabels={false}
                />
                <p className="text-xs text-muted-foreground">
                  Creates a day for each date in the selected range.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="day-count">Number of Days</Label>
              <Input
                id="day-count"
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                placeholder="1-30"
              />
              <p className="text-xs text-muted-foreground">
                {position === 'start'
                  ? 'Days will be inserted before existing days. All existing days will be renumbered.'
                  : 'Days will be created without dates. Add trip dates to enable date assignment.'}
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          {previewText}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || batchCreate.isPending}
            className="bg-tern-teal-500 hover:bg-tern-teal-600"
          >
            {batchCreate.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Days'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
