'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Ship,
  Calendar,
  Check,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTrips } from '@/hooks/use-trips'
import { useItineraries, useCreateItinerary } from '@/hooks/use-itineraries'
import { useAddCruiseToItinerary, type SailingDetailResponse } from '@/hooks/use-cruise-library'

interface AddToTripDialogProps {
  sailing: SailingDetailResponse
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'select-trip' | 'select-itinerary'

/**
 * Check if cruise dates fit within itinerary dates
 * Returns true if the cruise can be added to the itinerary
 */
function checkDatesCompatible(
  cruiseSailDate: string,
  cruiseEndDate: string,
  itineraryStartDate: string | null | undefined,
  itineraryEndDate: string | null | undefined
): { compatible: boolean; reason?: string } {
  // If itinerary has no dates, it's compatible (dates will be set from cruise)
  if (!itineraryStartDate || !itineraryEndDate) {
    return { compatible: true }
  }

  const cruiseStart = new Date(cruiseSailDate + 'T00:00:00')
  const cruiseEnd = new Date(cruiseEndDate + 'T00:00:00')
  const itinStart = new Date(itineraryStartDate + 'T00:00:00')
  const itinEnd = new Date(itineraryEndDate + 'T00:00:00')

  if (cruiseStart < itinStart) {
    return {
      compatible: false,
      reason: `Cruise departs before itinerary starts (${itineraryStartDate})`,
    }
  }

  if (cruiseEnd > itinEnd) {
    return {
      compatible: false,
      reason: `Cruise returns after itinerary ends (${itineraryEndDate})`,
    }
  }

  return { compatible: true }
}

export function AddToTripDialog({
  sailing,
  isOpen,
  onClose,
  onSuccess,
}: AddToTripDialogProps) {
  const [step, setStep] = useState<Step>('select-trip')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [createNewItinerary, setCreateNewItinerary] = useState(false)
  const [newItineraryName, setNewItineraryName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Confirmation dialog state for extending itinerary dates
  const [showExtendConfirm, setShowExtendConfirm] = useState(false)
  const [pendingExtendParams, setPendingExtendParams] = useState<{
    itineraryId: string
    cruiseDates: { start: string; end: string }
    itineraryDates: { start: string; end: string }
  } | null>(null)

  // Fetch trips (excluding archived)
  const { data: tripsData, isLoading: isLoadingTrips } = useTrips({
    limit: 50,
    search: searchQuery || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  // Fetch itineraries for selected trip
  const { data: itineraries, isLoading: isLoadingItineraries } = useItineraries(
    selectedTripId || '',
  )

  // Mutations
  const createItineraryMutation = useCreateItinerary(selectedTripId || '')
  const addCruiseMutation = useAddCruiseToItinerary() // No default - will pass itineraryId dynamically

  const trips = tripsData?.data ?? []

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId)
    setSelectedItineraryId(null)
    setCreateNewItinerary(false)
    setNewItineraryName(`${sailing.name} Itinerary`)
    setStep('select-itinerary')
  }

  const handleBack = () => {
    setStep('select-trip')
    setSelectedItineraryId(null)
    setCreateNewItinerary(false)
  }

  const handleAddToItinerary = async () => {
    if (!selectedTripId) return

    let itineraryId = selectedItineraryId

    // Create new itinerary if requested
    if (createNewItinerary) {
      const newItinerary = await createItineraryMutation.mutateAsync({
        name: newItineraryName || `${sailing.name} Itinerary`,
        startDate: sailing.sailDate,
        endDate: sailing.endDate,
      })
      itineraryId = newItinerary.id
    }

    if (!itineraryId) return

    try {
      // Add cruise to the itinerary - first attempt without auto-extend
      await addCruiseMutation.mutateAsync({
        sailing,
        itineraryId,
        tripId: selectedTripId,
        autoExtendItinerary: false,
      })

      onSuccess?.()
      handleClose()
    } catch (error) {
      // Check if it's a date mismatch error
      if (error instanceof Error && error.message.includes('do not fit within itinerary dates')) {
        // Show confirmation dialog to extend itinerary dates
        const selectedItin = itineraries?.find((i) => i.id === itineraryId)
        setPendingExtendParams({
          itineraryId,
          cruiseDates: { start: sailing.sailDate, end: sailing.endDate },
          itineraryDates: {
            start: selectedItin?.startDate || '',
            end: selectedItin?.endDate || '',
          },
        })
        setShowExtendConfirm(true)
      } else {
        // Re-throw other errors to be handled by mutation error state
        throw error
      }
    }
  }

  // Confirm extension and retry with autoExtendItinerary=true
  const handleConfirmExtend = async () => {
    if (!pendingExtendParams || !selectedTripId) return

    try {
      await addCruiseMutation.mutateAsync({
        sailing,
        itineraryId: pendingExtendParams.itineraryId,
        tripId: selectedTripId,
        autoExtendItinerary: true,
      })

      setShowExtendConfirm(false)
      setPendingExtendParams(null)
      onSuccess?.()
      handleClose()
    } catch (error) {
      // Close confirm dialog and let mutation error state handle it
      setShowExtendConfirm(false)
      setPendingExtendParams(null)
      throw error
    }
  }

  const handleCancelExtend = () => {
    setShowExtendConfirm(false)
    setPendingExtendParams(null)
  }

  const handleClose = () => {
    setStep('select-trip')
    setSelectedTripId(null)
    setSelectedItineraryId(null)
    setCreateNewItinerary(false)
    setNewItineraryName('')
    setSearchQuery('')
    onClose()
  }

  const isAddingCruise = createItineraryMutation.isPending || addCruiseMutation.isPending

  // Allow selecting incompatible itineraries - user will be prompted to extend dates
  const canProceed = createNewItinerary
    ? newItineraryName.trim().length > 0
    : !!selectedItineraryId

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-trip' ? 'Add to Trip' : 'Select Itinerary'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-trip' ? (
              'Select a trip to add this cruise to'
            ) : (
              <>
                Choose an existing itinerary or create a new one.
                <span className="block mt-1 text-tern-teal-600 font-medium">
                  Cruise dates: {format(parseISO(sailing.sailDate), 'MMM d')} - {format(parseISO(sailing.endDate), 'MMM d, yyyy')}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-trip' ? (
          <div className="space-y-4">
            {/* Search */}
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Trip List */}
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingTrips ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Ship className="h-12 w-12 text-tern-gray-300 mb-2" />
                  <p className="text-sm text-tern-gray-500">No trips found</p>
                  <p className="text-xs text-tern-gray-400 mt-1">
                    Create a trip first to add cruises
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleTripSelect(trip.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-colors',
                        'hover:bg-tern-gray-50 hover:border-tern-teal-300',
                        'focus:outline-none focus:ring-2 focus:ring-tern-teal-500'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-tern-gray-900 truncate">
                            {trip.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-tern-gray-500">
                            {trip.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(trip.startDate), 'MMM d, yyyy')}
                              </span>
                            )}
                            {trip.status && (
                              <span className="capitalize">{trip.status.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-tern-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2 -ml-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to trips
            </Button>

            {/* Itinerary Options */}
            {isLoadingItineraries ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <RadioGroup
                value={createNewItinerary ? 'new' : selectedItineraryId || ''}
                onValueChange={(value) => {
                  if (value === 'new') {
                    setCreateNewItinerary(true)
                    setSelectedItineraryId(null)
                  } else {
                    setCreateNewItinerary(false)
                    setSelectedItineraryId(value)
                  }
                }}
              >
                {/* Existing Itineraries */}
                {itineraries && itineraries.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-tern-gray-500 uppercase tracking-wide">
                      Existing Itineraries
                    </Label>
                    {itineraries.map((itinerary) => {
                      const dateCheck = checkDatesCompatible(
                        sailing.sailDate,
                        sailing.endDate,
                        itinerary.startDate,
                        itinerary.endDate
                      )
                      const needsExtension = !dateCheck.compatible
                      const isSelected = selectedItineraryId === itinerary.id

                      return (
                        <div
                          key={itinerary.id}
                          className={cn(
                            'flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                            isSelected
                              ? needsExtension
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-tern-teal-500 bg-tern-teal-50'
                              : needsExtension
                              ? 'border-amber-200 hover:bg-amber-50'
                              : 'hover:bg-tern-gray-50'
                          )}
                          onClick={() => {
                            setCreateNewItinerary(false)
                            setSelectedItineraryId(itinerary.id)
                          }}
                        >
                          <RadioGroupItem
                            value={itinerary.id}
                            id={itinerary.id}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={itinerary.id}
                              className="font-medium text-sm cursor-pointer"
                            >
                              {itinerary.name}
                            </Label>
                            <p className="text-xs text-tern-gray-500 mt-0.5">
                              {itinerary.startDate && itinerary.endDate ? (
                                <>
                                  {format(parseISO(itinerary.startDate), 'MMM d')} - {format(parseISO(itinerary.endDate), 'MMM d, yyyy')}
                                  <span className="mx-1">•</span>
                                </>
                              ) : (
                                <span className="text-tern-gray-400">No dates set • </span>
                              )}
                              {itinerary.status}
                            </p>
                            {needsExtension && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                <span>{dateCheck.reason} - dates will be extended</span>
                              </p>
                            )}
                          </div>
                          {!needsExtension && itinerary.isSelected && (
                            <Check className="h-4 w-4 text-tern-teal-600 flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Create New Option */}
                <div className="pt-2">
                  <Label className="text-xs text-tern-gray-500 uppercase tracking-wide">
                    Or Create New
                  </Label>
                  <div
                    className={cn(
                      'flex items-start space-x-3 p-3 mt-2 rounded-lg border cursor-pointer transition-colors',
                      createNewItinerary
                        ? 'border-tern-teal-500 bg-tern-teal-50'
                        : 'hover:bg-tern-gray-50'
                    )}
                    onClick={() => {
                      setCreateNewItinerary(true)
                      setSelectedItineraryId(null)
                    }}
                  >
                    <RadioGroupItem value="new" id="new-itinerary" className="mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <Label
                        htmlFor="new-itinerary"
                        className="font-medium text-sm cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create new itinerary
                      </Label>
                      <p className="text-xs text-tern-gray-500 mt-0.5">
                        Will use cruise dates: {format(parseISO(sailing.sailDate), 'MMM d')} - {format(parseISO(sailing.endDate), 'MMM d, yyyy')}
                      </p>
                      {createNewItinerary && (
                        <Input
                          placeholder="Itinerary name"
                          value={newItineraryName}
                          onChange={(e) => setNewItineraryName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'select-itinerary' && (
            <Button
              onClick={handleAddToItinerary}
              disabled={!canProceed || isAddingCruise}
              className="bg-tern-teal-600 hover:bg-tern-teal-700"
            >
              {isAddingCruise ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Itinerary'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Confirmation dialog for extending itinerary dates */}
      <AlertDialog open={showExtendConfirm} onOpenChange={setShowExtendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Extend Itinerary Dates?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  The cruise dates extend beyond the current itinerary dates.
                </p>
                {pendingExtendParams && (
                  <div className="bg-amber-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tern-gray-600">Cruise dates:</span>
                      <span className="font-medium">
                        {format(parseISO(pendingExtendParams.cruiseDates.start), 'MMM d')} -{' '}
                        {format(parseISO(pendingExtendParams.cruiseDates.end), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tern-gray-600">Itinerary dates:</span>
                      <span className="font-medium">
                        {pendingExtendParams.itineraryDates.start && pendingExtendParams.itineraryDates.end ? (
                          <>
                            {format(parseISO(pendingExtendParams.itineraryDates.start), 'MMM d')} -{' '}
                            {format(parseISO(pendingExtendParams.itineraryDates.end), 'MMM d, yyyy')}
                          </>
                        ) : (
                          'Not set'
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <p>
                  Would you like to extend the itinerary dates to accommodate this cruise?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExtend}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExtend}
              className="bg-tern-teal-600 hover:bg-tern-teal-700"
              disabled={addCruiseMutation.isPending}
            >
              {addCruiseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              ) : (
                'Extend Dates & Add Cruise'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
