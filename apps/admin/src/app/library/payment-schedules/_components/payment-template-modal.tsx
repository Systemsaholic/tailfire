'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

/**
 * Payment milestone configuration
 * Defines when a payment is due and how much
 */
export interface PaymentMilestone {
  id: string
  name: string // e.g., "Deposit", "Balance", "At Check-in"
  percentage: number // 0-100, percentage of total
  dueTiming: 'on_booking' | 'days_before_departure' | 'at_departure' | 'at_checkin'
  daysBeforeDeparture?: number | null // Only used when dueTiming is 'days_before_departure'
}

export interface PaymentTemplate {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  isActive: boolean
  requiresPaymentReminders: boolean // false for "Pay at Property" type schedules
  milestones: PaymentMilestone[]
}

const DUE_TIMING_OPTIONS = [
  { value: 'on_booking', label: 'On Booking' },
  { value: 'days_before_departure', label: 'Days Before Departure' },
  { value: 'at_departure', label: 'At Departure' },
  { value: 'at_checkin', label: 'At Check-in / Property' },
] as const

type DueTiming = (typeof DUE_TIMING_OPTIONS)[number]['value']

function createDefaultMilestone(): PaymentMilestone {
  return {
    id: crypto.randomUUID(),
    name: '',
    percentage: 0,
    dueTiming: 'on_booking',
    daysBeforeDeparture: null,
  }
}

interface PaymentTemplateModalProps {
  template?: PaymentTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: Omit<PaymentTemplate, 'id'> & { id?: string }) => void
}

export function PaymentTemplateModal({
  template,
  open,
  onOpenChange,
  onSave,
}: PaymentTemplateModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [requiresPaymentReminders, setRequiresPaymentReminders] = useState(true)
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([])

  const isEditing = !!template

  // Calculate total percentage
  const totalPercentage = milestones.reduce((sum, m) => sum + (m.percentage || 0), 0)
  const isPercentageValid = totalPercentage === 100 || milestones.length === 0

  // Reset form when modal opens or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name)
        setDescription(template.description || '')
        setIsDefault(template.isDefault)
        setIsActive(template.isActive)
        setRequiresPaymentReminders(template.requiresPaymentReminders)
        setMilestones(template.milestones.map((m) => ({ ...m })))
      } else {
        // Reset to defaults for new template
        setName('')
        setDescription('')
        setIsDefault(false)
        setIsActive(true)
        setRequiresPaymentReminders(true)
        setMilestones([])
      }
    }
  }, [open, template])

  // Milestone handlers
  const handleAddMilestone = () => {
    setMilestones((prev) => [...prev, createDefaultMilestone()])
  }

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const handleUpdateMilestone = (id: string, updates: Partial<PaymentMilestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required.',
        variant: 'destructive',
      })
      return
    }

    if (milestones.length > 0 && !isPercentageValid) {
      toast({
        title: 'Validation Error',
        description: `Payment percentages must total 100%. Currently: ${totalPercentage}%`,
        variant: 'destructive',
      })
      return
    }

    // Check for empty milestone names
    const emptyMilestones = milestones.filter((m) => !m.name.trim())
    if (emptyMilestones.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'All payment milestones must have a name.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      onSave({
        id: template?.id,
        name: name.trim(),
        description: description.trim() || null,
        isDefault,
        isActive,
        requiresPaymentReminders,
        milestones,
      })

      toast({
        title: isEditing ? 'Template updated' : 'Template created',
        description: isEditing
          ? 'Payment schedule template has been updated.'
          : 'New payment schedule template has been created.',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} template. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Template' : 'New Payment Schedule Template'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the payment schedule template configuration.'
                : 'Create a reusable payment schedule pattern for bookings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Standard Deposit, Pay at Property, 3-Payment Plan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe when this template should be used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Payment Reminders Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="requiresReminders" className="text-sm font-medium">
                  Payment Reminders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send automatic reminders for upcoming payments
                </p>
              </div>
              <Switch
                id="requiresReminders"
                checked={requiresPaymentReminders}
                onCheckedChange={setRequiresPaymentReminders}
              />
            </div>

            {/* Payment Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Payment Milestones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Payment
                </Button>
              </div>

              {milestones.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <p>No payment milestones configured.</p>
                  <p className="text-xs mt-1">
                    For &quot;Pay at Property&quot; schedules, leave this empty or add a single 100% &quot;At Check-in&quot; payment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="rounded-lg border p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          {/* Milestone Name */}
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Payment Name
                            </Label>
                            <Input
                              placeholder="e.g., Deposit, Balance, At Check-in"
                              value={milestone.name}
                              onChange={(e) =>
                                handleUpdateMilestone(milestone.id, { name: e.target.value })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          {/* Percentage */}
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Percentage
                            </Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={milestone.percentage}
                                onChange={(e) =>
                                  handleUpdateMilestone(milestone.id, {
                                    percentage: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="h-8 text-sm w-20"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMilestone(milestone.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Due Timing */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Due When
                          </Label>
                          <Select
                            value={milestone.dueTiming}
                            onValueChange={(v) =>
                              handleUpdateMilestone(milestone.id, {
                                dueTiming: v as DueTiming,
                                daysBeforeDeparture:
                                  v === 'days_before_departure' ? 30 : null,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DUE_TIMING_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {milestone.dueTiming === 'days_before_departure' && (
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Days Before
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={milestone.daysBeforeDeparture ?? 30}
                              onChange={(e) =>
                                handleUpdateMilestone(milestone.id, {
                                  daysBeforeDeparture: parseInt(e.target.value) || 30,
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Percentage Total */}
                  <div
                    className={`text-sm text-right ${
                      isPercentageValid ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    Total: {totalPercentage}%{' '}
                    {!isPercentageValid && '(must equal 100%)'}
                  </div>
                </div>
              )}
            </div>

            {/* Status toggles */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Template can be applied to new bookings
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault" className="text-sm font-medium">
                  Set as Default
                </Label>
                <p className="text-xs text-muted-foreground">
                  Auto-apply to new bookings of this type
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
