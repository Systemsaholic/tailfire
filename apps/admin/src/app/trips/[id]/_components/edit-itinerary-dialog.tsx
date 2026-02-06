'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Upload, Search, Trash2, Pencil } from 'lucide-react'
import type { ItineraryResponseDto, BatchCreateDaysDto } from '@tailfire/shared-types/api'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useUpdateItinerary } from '@/hooks/use-itineraries'
import {
  useItineraryDays,
  useCreateItineraryDay,
  useDeleteItineraryDay,
  itineraryDayKeys,
} from '@/hooks/use-itinerary-days'
import { UnsplashPicker } from '@/components/unsplash-picker'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'

interface EditItineraryDialogProps {
  tripId: string
  tripStartDate?: string | null
  tripEndDate?: string | null
  itinerary: ItineraryResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Edit Itinerary Modal
 *
 * Mirrors CreateItineraryDialog with:
 * - Name field
 * - Travel Dates (start/end)
 * - Cover Photo (search/upload)
 * - Overview Statement
 *
 * Pre-populates form from selected itinerary and re-syncs if selection changes.
 */
export function EditItineraryDialog({
  tripId,
  tripStartDate,
  tripEndDate,
  itinerary,
  open,
  onOpenChange,
  onSuccess,
}: EditItineraryDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const updateItinerary = useUpdateItinerary(tripId)

  // Fetch itinerary days to check for Pre-Travel day
  const { data: days = [] } = useItineraryDays(itinerary?.id || null)
  const createDay = useCreateItineraryDay(itinerary?.id || '')
  const deleteDay = useDeleteItineraryDay(itinerary?.id || '')

  // Find the Pre-Travel day (Day 0)
  const preTravelDay = days.find((d) => d.dayNumber === 0)
  const hasPreTravel = !!preTravelDay

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    coverPhoto: '',
    overview: '',
  })

  // Pre-Travel toggle state (synced with actual days)
  const [includePreTravel, setIncludePreTravel] = useState(hasPreTravel)

  // Sync checkbox state when days data loads/changes
  useEffect(() => {
    setIncludePreTravel(hasPreTravel)
  }, [hasPreTravel])

  // Unsplash picker state
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false)

  // Initialize and re-sync form when itinerary changes or dialog opens
  useEffect(() => {
    if (itinerary && open) {
      setFormData({
        name: itinerary.name || '',
        startDate: itinerary.startDate || '',
        endDate: itinerary.endDate || '',
        coverPhoto: itinerary.coverPhoto || '',
        overview: itinerary.overview || '',
      })
      setShowUnsplashPicker(false)
    }
  }, [itinerary, open])

  // Handle Pre-Travel toggle
  const handlePreTravelChange = async (checked: boolean) => {
    if (!itinerary) return

    setIncludePreTravel(checked)

    try {
      if (checked && !preTravelDay) {
        // Create Day 0
        await createDay.mutateAsync({
          dayNumber: 0,
          title: 'Pre-Travel Information',
          sequenceOrder: 0,
        })
        toast({
          title: 'Pre-Travel Day Added',
          description: 'Day 0 has been added for pre-trip information.',
        })
      } else if (!checked && preTravelDay) {
        // Delete Day 0
        await deleteDay.mutateAsync(preTravelDay.id)
        toast({
          title: 'Pre-Travel Day Removed',
          description: 'Day 0 has been removed from the itinerary.',
        })
      }
    } catch (error) {
      // Revert checkbox on error
      setIncludePreTravel(!checked)
      toast({
        title: 'Error',
        description: checked
          ? 'Failed to add Pre-Travel day.'
          : 'Failed to remove Pre-Travel day.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itinerary) return

    // Validate required fields
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      toast({
        title: 'Validation Error',
        description: 'Itinerary name is required.',
        variant: 'destructive',
      })
      return
    }

    // Validate dates if provided
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end < start) {
        toast({
          title: 'Validation Error',
          description: 'End date must be after start date.',
          variant: 'destructive',
        })
        return
      }
    }

    // Validate itinerary dates are within trip date range
    if (tripStartDate && formData.startDate) {
      const tripStart = new Date(tripStartDate)
      const itinStart = new Date(formData.startDate)
      if (itinStart < tripStart) {
        toast({
          title: 'Validation Error',
          description: `Start date cannot be before trip start date (${tripStartDate}).`,
          variant: 'destructive',
        })
        return
      }
    }

    if (tripEndDate && formData.endDate) {
      const tripEnd = new Date(tripEndDate)
      const itinEnd = new Date(formData.endDate)
      if (itinEnd > tripEnd) {
        toast({
          title: 'Validation Error',
          description: `End date cannot be after trip end date (${tripEndDate}).`,
          variant: 'destructive',
        })
        return
      }
    }

    if (tripStartDate && formData.endDate) {
      const tripStart = new Date(tripStartDate)
      const itinEnd = new Date(formData.endDate)
      if (itinEnd < tripStart) {
        toast({
          title: 'Validation Error',
          description: `End date cannot be before trip start date (${tripStartDate}).`,
          variant: 'destructive',
        })
        return
      }
    }

    if (tripEndDate && formData.startDate) {
      const tripEnd = new Date(tripEndDate)
      const itinStart = new Date(formData.startDate)
      if (itinStart > tripEnd) {
        toast({
          title: 'Validation Error',
          description: `Start date cannot be after trip end date (${tripEndDate}).`,
          variant: 'destructive',
        })
        return
      }
    }

    try {
      // Capture original dates before update for comparison
      const originalStartDate = itinerary.startDate
      const originalEndDate = itinerary.endDate

      await updateItinerary.mutateAsync({
        id: itinerary.id,
        data: {
          name: trimmedName,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          coverPhoto: formData.coverPhoto.trim() || undefined,
          overview: formData.overview.trim() || undefined,
        },
      })

      // Check if dates were extended and we need to add days
      if (formData.startDate && formData.endDate) {
        const newStart = new Date(`${formData.startDate}T00:00:00Z`)
        const newEnd = new Date(`${formData.endDate}T00:00:00Z`)

        // Get existing days with dates (excluding Day 0)
        const datedDays = days
          .filter((d): d is typeof d & { date: string } => !!d.date && d.dayNumber !== 0)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate day coverage
        let effectiveStart: Date | null = null
        let effectiveEnd: Date | null = null

        if (datedDays.length > 0) {
          const firstDay = datedDays[0]!
          const lastDay = datedDays[datedDays.length - 1]!
          const firstDateStr = firstDay.date.split('T')[0] ?? firstDay.date
          const lastDateStr = lastDay.date.split('T')[0] ?? lastDay.date
          effectiveStart = new Date(`${firstDateStr}T00:00:00Z`)
          effectiveEnd = new Date(`${lastDateStr}T00:00:00Z`)
        } else if (originalStartDate && originalEndDate) {
          const origStartStr = originalStartDate.split('T')[0] ?? originalStartDate
          const origEndStr = originalEndDate.split('T')[0] ?? originalEndDate
          effectiveStart = new Date(`${origStartStr}T00:00:00Z`)
          effectiveEnd = new Date(`${origEndStr}T00:00:00Z`)
        }

        const daysToAddAtStart: string[] = []
        const daysToAddAtEnd: string[] = []

        // Helper to format date as YYYY-MM-DD
        const formatDateISO = (d: Date): string => d.toISOString().split('T')[0] ?? ''

        // Check if we need to add days at the start
        if (effectiveStart && newStart < effectiveStart) {
          const currentDate = new Date(newStart)
          while (currentDate < effectiveStart) {
            daysToAddAtStart.push(formatDateISO(currentDate))
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
          }
        }

        // Check if we need to add days at the end
        if (effectiveEnd && newEnd > effectiveEnd) {
          const currentDate = new Date(effectiveEnd)
          currentDate.setUTCDate(currentDate.getUTCDate() + 1) // Start from day after last
          while (currentDate <= newEnd) {
            daysToAddAtEnd.push(formatDateISO(currentDate))
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
          }
        }

        // If no existing days, generate all days for the date range
        if (!effectiveStart && !effectiveEnd && datedDays.length === 0) {
          const currentDate = new Date(newStart)
          while (currentDate <= newEnd) {
            daysToAddAtEnd.push(formatDateISO(currentDate))
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
          }
        }

        // Add days at start if needed (must use count mode - date range not supported for 'start')
        // Note: If Pre-Travel (Day 0) exists, adding at start will shift day numbers
        if (daysToAddAtStart.length > 0 && !hasPreTravel) {
          try {
            // Chunk into batches of max 30 days to avoid API limit
            const chunkSize = 30
            for (let i = 0; i < daysToAddAtStart.length; i += chunkSize) {
              const chunkCount = Math.min(chunkSize, daysToAddAtStart.length - i)
              const batchData: BatchCreateDaysDto = {
                count: chunkCount,
                position: 'start',
              }
              await api.post(`/itineraries/${itinerary.id}/days/batch`, batchData)
            }
          } catch (e) {
            console.warn('Failed to add days at start:', e)
          }
        } else if (daysToAddAtStart.length > 0 && hasPreTravel) {
          // Skip start extension when Pre-Travel exists to preserve Day 0
          console.warn('Skipping start extension: Pre-Travel Day (Day 0) exists and would be renumbered')
        }

        // Add days at end if needed (date range mode is supported for 'end')
        if (daysToAddAtEnd.length > 0) {
          try {
            // Chunk into batches of max 30 days to avoid API limit
            const chunkSize = 30
            for (let i = 0; i < daysToAddAtEnd.length; i += chunkSize) {
              const chunkEnd = Math.min(i + chunkSize - 1, daysToAddAtEnd.length - 1)
              const startDateChunk = daysToAddAtEnd[i]
              const endDateChunk = daysToAddAtEnd[chunkEnd]
              if (startDateChunk && endDateChunk) {
                const batchData: BatchCreateDaysDto = {
                  startDate: startDateChunk,
                  endDate: endDateChunk,
                  position: 'end',
                }
                await api.post(`/itineraries/${itinerary.id}/days/batch`, batchData)
              }
            }
          } catch (e) {
            console.warn('Failed to add days at end:', e)
          }
        }

        // Invalidate day caches if any days were added
        if (daysToAddAtStart.length > 0 || daysToAddAtEnd.length > 0) {
          queryClient.invalidateQueries({ queryKey: itineraryDayKeys.list(itinerary.id) })
          queryClient.invalidateQueries({ queryKey: itineraryDayKeys.withActivities(itinerary.id) })
        }
      }

      toast({
        title: 'Itinerary updated',
        description: `"${trimmedName}" has been updated successfully.`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update itinerary. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const isSubmitting = updateItinerary.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Itinerary
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-tern-gray-900 block mb-2">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Option A - Luxury Experience"
              autoFocus
            />
            <p className="text-xs text-tern-gray-500 mt-1">
              Give this itinerary option a descriptive name
            </p>
          </div>

          {/* Travel Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-tern-gray-900 block mb-2">
                Start Date
              </label>
              <DatePickerEnhanced
                value={formData.startDate || null}
                onChange={(date) => setFormData({ ...formData, startDate: date || '' })}
                placeholder="Select start date"
                minDate={tripStartDate || undefined}
                maxDate={tripEndDate || undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-tern-gray-900 block mb-2">
                End Date
              </label>
              <DatePickerEnhanced
                value={formData.endDate || null}
                onChange={(date) => setFormData({ ...formData, endDate: date || '' })}
                placeholder="Select end date"
                minDate={formData.startDate || tripStartDate || undefined}
                maxDate={tripEndDate || undefined}
              />
            </div>
          </div>
          {tripStartDate && tripEndDate && (
            <p className="text-xs text-tern-gray-500 -mt-3">
              Dates must be within trip dates: {tripStartDate} to {tripEndDate}
            </p>
          )}
          {(!tripStartDate || !tripEndDate) && (
            <p className="text-xs text-tern-gray-500 -mt-3">
              Optional: Set travel dates for this itinerary
            </p>
          )}

          {/* Pre-Travel Day Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="editIncludePreTravel"
              checked={includePreTravel}
              onCheckedChange={(checked) => handlePreTravelChange(checked === true)}
              disabled={createDay.isPending || deleteDay.isPending}
            />
            <Label htmlFor="editIncludePreTravel" className="text-sm cursor-pointer">
              Include Pre-Travel Day (Day 0)
              {(createDay.isPending || deleteDay.isPending) && (
                <span className="ml-2 text-tern-gray-400">Saving...</span>
              )}
            </Label>
          </div>
          <p className="text-xs text-tern-gray-500 -mt-3">
            {hasPreTravel
              ? 'Uncheck to remove Day 0 from the itinerary'
              : 'Check to add a Day 0 for pre-trip information'}
          </p>

          {/* Cover Photo */}
          <div>
            <label className="text-sm font-medium text-tern-gray-900 block mb-2">
              Cover Photo
            </label>

            {/* Preview selected photo */}
            {formData.coverPhoto ? (
              <div className="mb-3">
                <div className="relative inline-block">
                  <img
                    src={formData.coverPhoto}
                    alt="Cover photo preview"
                    className="h-32 w-48 object-cover rounded-lg border border-tern-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setFormData({ ...formData, coverPhoto: '' })
                      setShowUnsplashPicker(false)
                    }}
                    title="Remove photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={formData.coverPhoto}
                  onChange={(e) => setFormData({ ...formData, coverPhoto: e.target.value })}
                  placeholder="Photo URL or search for stock images..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Search stock photos"
                onClick={() => setShowUnsplashPicker(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Upload image"
                disabled
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-tern-gray-500 mt-1">
              Optional: Add a cover photo for this itinerary option
            </p>
          </div>

          {/* Overview Statement */}
          <div>
            <label className="text-sm font-medium text-tern-gray-900 block mb-2">
              Overview Statement
            </label>
            <Textarea
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              placeholder="Describe this itinerary option for travelers..."
              rows={6}
            />
            <p className="text-xs text-tern-gray-500 mt-1">
              Optional: Write a brief overview of what makes this itinerary special
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-tern-teal-500 hover:bg-tern-teal-600 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Unsplash Picker Dialog */}
        <Dialog open={showUnsplashPicker} onOpenChange={setShowUnsplashPicker}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Search Stock Photos</DialogTitle>
            </DialogHeader>
            <UnsplashPicker
              onSelect={(photo) => {
                setFormData({ ...formData, coverPhoto: photo.urls.regular })
                setShowUnsplashPicker(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
