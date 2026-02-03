'use client'

import { useState } from 'react'
import { MapPin, ArrowRight, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { CascadePreview } from '@tailfire/shared-types/api'

interface CascadeConfirmationDialogProps {
  preview: CascadePreview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (dayIds: string[]) => void
  onSkip: () => void
  isApplying?: boolean
}

export function CascadeConfirmationDialog({
  preview,
  open,
  onOpenChange,
  onConfirm,
  onSkip,
  isApplying,
}: CascadeConfirmationDialogProps) {
  const [selectedDayIds, setSelectedDayIds] = useState<Set<string>>(
    new Set(preview?.affectedDays.map(d => d.dayId) || [])
  )

  // Reset selections when preview changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && preview) {
      setSelectedDayIds(new Set(preview.affectedDays.map(d => d.dayId)))
    }
    onOpenChange(isOpen)
  }

  const toggleDay = (dayId: string) => {
    setSelectedDayIds(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) {
        next.delete(dayId)
      } else {
        next.add(dayId)
      }
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    if (checked && preview) {
      setSelectedDayIds(new Set(preview.affectedDays.map(d => d.dayId)))
    } else {
      setSelectedDayIds(new Set())
    }
  }

  if (!preview || preview.affectedDays.length === 0) return null

  const allSelected = selectedDayIds.size === preview.affectedDays.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Update Day Locations</DialogTitle>
          <DialogDescription>
            {preview.trigger.description || `${preview.trigger.activityType} activity changed location`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={toggleAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select all ({preview.affectedDays.length} days)
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {preview.affectedDays.map(day => (
              <div key={day.dayId} className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id={`day-${day.dayId}`}
                  checked={selectedDayIds.has(day.dayId)}
                  onCheckedChange={() => toggleDay(day.dayId)}
                  className="mt-0.5"
                />
                <label htmlFor={`day-${day.dayId}`} className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium">
                    Day {day.dayNumber}
                    {day.date && <span className="text-muted-foreground ml-1">({day.date})</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {day.before.startLocation?.name || day.before.endLocation?.name || 'Not set'}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span className="truncate font-medium text-foreground">
                      {day.after.startLocation?.name || day.after.endLocation?.name || 'Not set'}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSkip} disabled={isApplying}>
            Skip
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selectedDayIds))}
            disabled={selectedDayIds.size === 0 || isApplying}
          >
            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply to {selectedDayIds.size} {selectedDayIds.size === 1 ? 'day' : 'days'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
