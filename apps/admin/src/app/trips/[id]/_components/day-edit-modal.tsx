'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useUpdateItineraryDay, useDeleteItineraryDay } from '@/hooks/use-itinerary-days'
import { parseISODate } from '@/lib/date-utils'
import type { ItineraryDayWithActivitiesDto } from '@tailfire/shared-types/api'

interface DayEditModalProps {
  day: ItineraryDayWithActivitiesDto
  itineraryId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DayEditModal({ day, itineraryId, open, onOpenChange }: DayEditModalProps) {
  const { toast } = useToast()
  const updateDay = useUpdateItineraryDay(itineraryId)
  const deleteDay = useDeleteItineraryDay(itineraryId)

  const [title, setTitle] = useState(day.title || '')
  const [notes, setNotes] = useState(day.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const activityCount = day.activities?.length || 0

  // Reset form when day changes or modal opens
  useEffect(() => {
    if (open) {
      setTitle(day.title || '')
      setNotes(day.notes || '')
    }
  }, [open, day.title, day.notes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateDay.mutateAsync({
        id: day.id,
        data: {
          title: title.trim() || null,
          notes: notes.trim() || null,
        },
      })

      toast({
        title: 'Day updated',
        description: 'Day details have been saved.',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update day. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteDay.mutateAsync(day.id)

      toast({
        title: 'Day deleted',
        description: activityCount > 0
          ? `Day ${day.dayNumber} and ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'} have been removed.`
          : `Day ${day.dayNumber} has been removed.`,
      })

      setShowDeleteConfirm(false)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete day. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Format date for display (use parseISODate for TZ-safe parsing)
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = parseISODate(dateString)
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Day</DialogTitle>
            <DialogDescription>
              {day.dayNumber ? `Day ${day.dayNumber}` : ''}{day.dayNumber && day.date ? ' • ' : ''}{formatDate(day.date)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Arrival Day, Beach Day, Museum Tour..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give this day a memorable name for your clients
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or special instructions for this day..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Day
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateDay.isPending}>
                {updateDay.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Day {day.dayNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              {activityCount > 0 ? (
                <>
                  This day has <strong>{activityCount} {activityCount === 1 ? 'activity' : 'activities'}</strong> that will also be permanently deleted.
                  This action cannot be undone.
                </>
              ) : (
                'This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDay.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDay.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDay.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
