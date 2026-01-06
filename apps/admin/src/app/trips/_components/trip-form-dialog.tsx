import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Trash2 } from 'lucide-react'
import type { TripResponseDto } from '@tailfire/shared-types/api'
import { useLoading } from '@/context/loading-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangeInput } from '@/components/ui/date-range-input'
import { useCreateTrip, useUpdateTrip, tripKeys } from '@/hooks/use-trips'
import { useToast } from '@/hooks/use-toast'
import { ApiError, api } from '@/lib/api'
import { UnsplashPicker } from '@/components/unsplash-picker'
import {
  tripFormSchema,
  toTripDefaults,
  toTripApiPayload,
  TRIP_FORM_FIELDS,
  mapServerErrors,
  scrollToFirstError,
  type TripFormValues,
} from '@/lib/validation'

// Type for selected Unsplash photo
interface SelectedCoverPhoto {
  id: string
  previewUrl: string
  downloadLocation: string
  photographerName: string
  photographerUrl: string
}

interface TripFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  trip?: TripResponseDto
}

export function TripFormDialog({
  open,
  onOpenChange,
  mode,
  trip,
}: TripFormDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [rootError, setRootError] = useState<string | null>(null)
  const [coverPhoto, setCoverPhoto] = useState<SelectedCoverPhoto | null>(null)
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const { startLoading, stopLoading, isLoading } = useLoading()
  const isNavigating = isLoading('trip-navigation')

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: toTripDefaults(),
  })

  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip()
  const { toast } = useToast()

  // Reset form when trip changes or dialog opens
  useEffect(() => {
    if (open) {
      setRootError(null)
      setCoverPhoto(null)
      setShowUnsplashPicker(false)
      setSavingCover(false)
      stopLoading('trip-navigation')
      if (trip && mode === 'edit') {
        form.reset(toTripDefaults(trip))
      } else if (mode === 'create') {
        form.reset(toTripDefaults())
      }
    }
  }, [trip, mode, form, open, stopLoading])

  // Scroll to first error on validation failure
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      scrollToFirstError(form.formState.errors)
    }
  }, [form.formState.errors])

  const onSubmit = async (data: TripFormValues) => {
    setRootError(null)

    try {
      const payload = toTripApiPayload(data)

      if (mode === 'create') {
        const newTrip = await createTrip.mutateAsync(payload)

        // Save cover photo if selected
        if (coverPhoto) {
          setSavingCover(true)
          try {
            await api.post(`/trips/${newTrip.id}/media/external`, {
              unsplashPhotoId: coverPhoto.id,
              downloadLocation: coverPhoto.downloadLocation,
              isCoverPhoto: true,
            })
            // Invalidate trips list and detail so cover photo shows immediately
            queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
            queryClient.invalidateQueries({ queryKey: tripKeys.detail(newTrip.id) })
          } catch (coverError) {
            // Cover photo failed but trip was created - don't block success
            console.warn('Failed to save cover photo:', coverError)
            toast({
              title: 'Cover photo not saved',
              description: 'The trip was created, but the cover photo could not be saved. You can add it later from the Media tab.',
              variant: 'destructive',
            })
          } finally {
            setSavingCover(false)
          }
        }

        startLoading('trip-navigation', 'Opening your new trip...')
        toast({
          title: 'Trip created',
          description: 'Redirecting to your new trip...',
        })
        onOpenChange(false)
        form.reset(toTripDefaults())
        setCoverPhoto(null)
        // Navigate to the new trip's detail page
        router.push(`/trips/${newTrip.id}`)
      } else if (trip) {
        await updateTrip.mutateAsync({
          id: trip.id,
          data: payload,
        })
        toast({
          title: 'Trip updated',
          description: 'The trip has been successfully updated.',
        })
        onOpenChange(false)
        form.reset(toTripDefaults())
      }
    } catch (error) {
      // Handle API errors with field-level mapping
      if (error instanceof ApiError) {
        if (error.fieldErrors?.length) {
          mapServerErrors(error.fieldErrors, form.setError, TRIP_FORM_FIELDS)
          setRootError('Please fix the errors above and try again.')
          scrollToFirstError(form.formState.errors)
        } else {
          setRootError(error.message || `Failed to ${mode} trip.`)
        }
      } else {
        setRootError(`Failed to ${mode} trip. Please try again.`)
      }

      toast({
        title: 'Validation Error',
        description: `Failed to ${mode} trip. Please check the form for errors.`,
        variant: 'destructive',
      })
    }
  }

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Trip' : 'Edit Trip'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create'
              ? 'Fill out the form below to create a new trip.'
              : 'Update the trip details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Trip Name & Trip Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Trip Name"
                        data-field="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tripType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-field="tripType">
                          <SelectValue placeholder="Regular Trip" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="leisure">Leisure</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="corporate">Incentives</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Status & Tags */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-field="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Search tags"
                        data-field="tags"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Travel Dates */}
            <div className="space-y-2">
              <DateRangeInput
                fromValue={form.watch('startDate') || null}
                toValue={form.watch('endDate') || null}
                onChange={(from, to) => {
                  form.setValue('startDate', from || '', { shouldValidate: true })
                  form.setValue('endDate', to || '', { shouldValidate: true })
                }}
                minDuration={1}
                strategy="minimum"
                fromLabel="Travel Start Date"
                toLabel="Travel End Date"
                showDuration
                formatDuration={(days) => `${days} night${days !== 1 ? 's' : ''}`}
                disabled={form.watch('addDatesLater')}
                fromPlaceholder="YYYY-MM-DD"
                toPlaceholder="YYYY-MM-DD"
              />
              {/* Date validation errors */}
              {(form.formState.errors.startDate || form.formState.errors.endDate) && (
                <div className="text-sm text-destructive" data-field="startDate">
                  {form.formState.errors.startDate?.message || form.formState.errors.endDate?.message}
                </div>
              )}
            </div>

            {/* Row 4: Add Dates Later Checkbox */}
            <FormField
              control={form.control}
              name="addDatesLater"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        // Clear date errors when checking "Add Dates Later"
                        if (checked) {
                          form.clearErrors(['startDate', 'endDate'])
                        }
                      }}
                      data-field="addDatesLater"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Add Dates Later</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Row 5: Cover Photo (create mode only) */}
            {mode === 'create' && (
              <div className="space-y-2">
                <FormLabel>Cover Photo</FormLabel>

                {/* Preview selected photo */}
                {coverPhoto ? (
                  <div className="relative inline-block">
                    <img
                      src={coverPhoto.previewUrl}
                      alt={`Selected cover photo by ${coverPhoto.photographerName}`}
                      className="h-32 w-48 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setCoverPhoto(null)}
                      aria-label="Remove cover photo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Photo by{' '}
                      <a
                        href={`${coverPhoto.photographerUrl}?utm_source=tailfire&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        {coverPhoto.photographerName}
                      </a>
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUnsplashPicker(true)}
                    className="w-full justify-start text-muted-foreground"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search for a cover photo...
                  </Button>
                )}

                <FormDescription>
                  Optional: Add a cover photo to make this trip stand out
                </FormDescription>
              </div>
            )}

            {/* Root Error Message */}
            {rootError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {rootError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={createTrip.isPending || updateTrip.isPending || savingCover || isNavigating}
              >
                {isNavigating
                  ? 'Opening trip...'
                  : savingCover
                    ? 'Saving cover...'
                    : createTrip.isPending || updateTrip.isPending
                      ? 'Saving...'
                      : mode === 'create'
                        ? 'Create Trip'
                        : 'Update Trip'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Unsplash Picker Dialog */}
    <Dialog open={showUnsplashPicker} onOpenChange={setShowUnsplashPicker}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Cover Photo</DialogTitle>
          <DialogDescription>
            Search and select a cover photo from Unsplash
          </DialogDescription>
        </DialogHeader>
        <UnsplashPicker
          onSelect={(photo) => {
            setCoverPhoto({
              id: photo.id,
              previewUrl: photo.urls.regular,
              downloadLocation: photo.links.download_location,
              photographerName: photo.user.name,
              photographerUrl: photo.user.links.html,
            })
            setShowUnsplashPicker(false)
          }}
        />
      </DialogContent>
    </Dialog>
  </>
  )
}
