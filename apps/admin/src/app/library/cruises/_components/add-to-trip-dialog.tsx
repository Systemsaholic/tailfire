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
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

    // Add cruise to the itinerary - pass itineraryId and tripId dynamically
    await addCruiseMutation.mutateAsync({
      sailing,
      itineraryId,
      tripId: selectedTripId,
    })

    onSuccess?.()
    handleClose()
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
  const canProceed = createNewItinerary
    ? newItineraryName.trim().length > 0
    : !!selectedItineraryId

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-trip' ? 'Add to Trip' : 'Select Itinerary'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-trip'
              ? 'Select a trip to add this cruise to'
              : 'Choose an existing itinerary or create a new one'}
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
                    {itineraries.map((itinerary) => (
                      <div
                        key={itinerary.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedItineraryId === itinerary.id
                            ? 'border-tern-teal-500 bg-tern-teal-50'
                            : 'hover:bg-tern-gray-50'
                        )}
                        onClick={() => {
                          setCreateNewItinerary(false)
                          setSelectedItineraryId(itinerary.id)
                        }}
                      >
                        <RadioGroupItem value={itinerary.id} id={itinerary.id} />
                        <div className="flex-1">
                          <Label
                            htmlFor={itinerary.id}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {itinerary.name}
                          </Label>
                          <p className="text-xs text-tern-gray-500 mt-0.5">
                            {itinerary.status} • {itinerary.isSelected ? 'Selected' : 'Not selected'}
                          </p>
                        </div>
                        {itinerary.isSelected && (
                          <Check className="h-4 w-4 text-tern-teal-600" />
                        )}
                      </div>
                    ))}
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
  )
}
