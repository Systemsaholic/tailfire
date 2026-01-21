'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import {
  Ship,
  Calendar,
  MapPin,
  Clock,
  Anchor,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Ruler,
  Building2,
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useCruiseSailing, useAddCruiseToItinerary } from '@/hooks/use-cruise-library'
import { PortScheduleList } from './port-schedule-list'
import { CabinPricingGrid } from './cabin-pricing-grid'

interface CruiseDetailModalProps {
  sailingId: string | null
  isOpen: boolean
  onClose: () => void
  tripContext?: {
    tripId: string
    dayId: string
    itineraryId: string
  }
  onAddedToItinerary?: () => void
}

export function CruiseDetailModal({
  sailingId,
  isOpen,
  onClose,
  tripContext,
  onAddedToItinerary,
}: CruiseDetailModalProps) {
  const { data: sailing, isLoading, error } = useCruiseSailing(sailingId)
  const addCruiseMutation = useAddCruiseToItinerary(tripContext?.itineraryId ?? '')

  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const images = sailing?.ship.images ?? []
  const hasMultipleImages = images.length > 1

  const handleAddToItinerary = async () => {
    if (!sailing || !tripContext) return

    // The mutation will automatically place the cruise on the day matching the departure date
    await addCruiseMutation.mutateAsync({
      sailing,
    })

    onAddedToItinerary?.()
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Get current image URL
  const currentImage = images[currentImageIndex]
  const imageUrl = currentImage?.url2k ?? currentImage?.urlHd ?? currentImage?.url ?? sailing?.ship.imageUrl

  // Calculate sea days
  const seaDays = sailing?.itinerary.filter((s) => s.isSeaDay).length ?? 0
  const portDays = sailing?.nights ? sailing.nights - seaDays + 1 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[min(85vh,calc(100dvh-2rem))] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="sr-only">Loading cruise details</DialogTitle>
              <DialogDescription className="sr-only">Please wait while cruise details are loading</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-48 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          </>
        ) : error ? (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="sr-only">Error loading cruise</DialogTitle>
              <DialogDescription className="sr-only">An error occurred while loading cruise details</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-medium text-tern-gray-900">Error loading sailing</h3>
              <p className="mt-1 text-sm text-tern-gray-500">
                Unable to load sailing details. Please try again.
              </p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </>
        ) : sailing ? (
          <>
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogDescription className="sr-only">
                View details for {sailing.name} by {sailing.cruiseLine.name}
              </DialogDescription>
              <div className="flex items-start gap-4">
                {/* Cruise Line Logo */}
                {sailing.cruiseLine.logoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={sailing.cruiseLine.logoUrl}
                      alt={sailing.cruiseLine.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-tern-gray-900">
                    {sailing.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-tern-gray-500">
                    <span>{sailing.cruiseLine.name}</span>
                    <span>-</span>
                    <span>{sailing.ship.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-tern-teal-100 text-tern-teal-700">
                    {sailing.nights} Nights
                  </Badge>
                  {sailing.regions[0] && (
                    <Badge variant="outline">{sailing.regions[0].name}</Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-6 px-6 pb-6">
                {/* Ship Image Gallery */}
                <div className="relative h-64 bg-tern-gray-100 rounded-lg overflow-hidden">
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt={sailing.ship.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 896px) 100vw, 896px"
                      />
                      {/* Gallery Navigation */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          {/* Image Counter */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                      {/* Image Caption */}
                      {currentImage?.caption && (
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded text-center">
                          {currentImage.caption}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Ship className="h-16 w-16 text-tern-gray-300" />
                    </div>
                  )}
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-tern-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-tern-gray-500 text-xs mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Departure
                    </div>
                    <p className="font-medium text-sm">
                      {format(parseISO(sailing.sailDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="bg-tern-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-tern-gray-500 text-xs mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Return
                    </div>
                    <p className="font-medium text-sm">
                      {format(parseISO(sailing.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="bg-tern-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-tern-gray-500 text-xs mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      From
                    </div>
                    <p className="font-medium text-sm truncate">
                      {sailing.embarkPort?.name ?? sailing.embarkPortName ?? 'TBD'}
                    </p>
                  </div>
                  <div className="bg-tern-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-tern-gray-500 text-xs mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      Duration
                    </div>
                    <p className="font-medium text-sm">
                      {sailing.nights} nights ({portDays} ports, {seaDays} sea)
                    </p>
                  </div>
                </div>

                {/* Ship Details */}
                {(sailing.ship.yearBuilt || sailing.ship.passengerCapacity || sailing.ship.tonnage) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm text-tern-gray-900 mb-3 flex items-center gap-2">
                        <Anchor className="h-4 w-4" />
                        Ship Details - {sailing.ship.name}
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {sailing.ship.yearBuilt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-tern-gray-400" />
                            <span className="text-tern-gray-500">Built:</span>
                            <span className="font-medium">{sailing.ship.yearBuilt}</span>
                          </div>
                        )}
                        {sailing.ship.passengerCapacity && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-tern-gray-400" />
                            <span className="text-tern-gray-500">Capacity:</span>
                            <span className="font-medium">
                              {sailing.ship.passengerCapacity.toLocaleString()} guests
                            </span>
                          </div>
                        )}
                        {sailing.ship.tonnage && (
                          <div className="flex items-center gap-2 text-sm">
                            <Ruler className="h-4 w-4 text-tern-gray-400" />
                            <span className="text-tern-gray-500">Tonnage:</span>
                            <span className="font-medium">
                              {sailing.ship.tonnage.toLocaleString()} GT
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Cabin Pricing */}
                <Separator />
                <CabinPricingGrid sailing={sailing} />

                {/* Port Schedule */}
                <Separator />
                <PortScheduleList sailing={sailing} />
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 border-t border-tern-gray-200 p-6 pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-tern-gray-500">
                  {sailing.pricesUpdating && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Prices updating...
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  {tripContext ? (
                    <Button
                      onClick={handleAddToItinerary}
                      disabled={addCruiseMutation.isPending}
                      className="bg-tern-teal-600 hover:bg-tern-teal-700"
                    >
                      {addCruiseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add to Itinerary'
                      )}
                    </Button>
                  ) : (
                    <Button disabled variant="secondary">
                      Select from a trip to add
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
