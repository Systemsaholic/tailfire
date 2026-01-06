'use client'

/**
 * Credit Card Authorization & Payment Schedule Section
 *
 * Comprehensive section handling payment schedules including:
 * - Schedule type selection (full, deposit, installments, guarantee)
 * - Credit card authorization for guarantee type
 * - Deposit configuration for deposit type
 * - Payment schedule management for installments
 * Reusable across all activity forms.
 */

import { useEffect } from 'react'
import { usePriceInput } from '@/hooks/use-price-input'
import { dollarsToCents, centsToDollars } from '@/lib/pricing'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InfoIcon, PlusIcon, TrashIcon, CreditCardIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'

const NUMERIC_INPUT_CLASS = 'text-right'

type ScheduleType = 'full' | 'deposit' | 'installments' | 'guarantee'
type DepositType = 'percentage' | 'fixed_amount'

interface ExpectedPaymentItem {
  id?: string
  paymentName: string
  expectedAmountCents: number
  dueDate: string | null
  sequenceOrder: number
}

interface PaymentScheduleData {
  scheduleType: ScheduleType
  allowPartialPayments: boolean

  // Deposit fields
  depositType?: DepositType | null
  depositPercentage?: number | null
  depositAmountCents?: number | null

  // Expected payment items (for installments)
  expectedPaymentItems?: ExpectedPaymentItem[]

  // Credit card authorization fields (for guarantee)
  cardHolderName?: string
  cardLast4?: string
  authorizationCode?: string
  authorizationDate?: string
  authorizationAmountCents?: number
}

interface CreditCardAuthorizationPaymentSectionProps {
  paymentData: PaymentScheduleData
  onUpdate: (updates: Partial<PaymentScheduleData>) => void
  totalPriceCents: number // Used for deposit calculations
  currency: string
  errors?: Record<string, string>
}

export function CreditCardAuthorizationPaymentSection({
  paymentData,
  onUpdate,
  totalPriceCents,
  currency,
  errors = {},
}: CreditCardAuthorizationPaymentSectionProps) {
  const depositAmount = usePriceInput(paymentData.depositAmountCents || 0)
  const authAmount = usePriceInput(paymentData.authorizationAmountCents || 0)

  const scheduleType = paymentData.scheduleType || 'full'

  // Clear irrelevant state when schedule type changes
  useEffect(() => {
    const updates: Partial<PaymentScheduleData> = {}

    switch (scheduleType) {
      case 'full':
        // Clear all schedule-specific fields
        if (paymentData.depositType) updates.depositType = null
        if (paymentData.depositPercentage) updates.depositPercentage = null
        if (paymentData.depositAmountCents) updates.depositAmountCents = null
        if (paymentData.expectedPaymentItems?.length) updates.expectedPaymentItems = []
        if (paymentData.cardHolderName) updates.cardHolderName = undefined
        if (paymentData.cardLast4) updates.cardLast4 = undefined
        if (paymentData.authorizationCode) updates.authorizationCode = undefined
        if (paymentData.authorizationDate) updates.authorizationDate = undefined
        if (paymentData.authorizationAmountCents) updates.authorizationAmountCents = undefined
        break

      case 'deposit':
        // Clear installments and guarantee fields
        if (paymentData.expectedPaymentItems?.length) updates.expectedPaymentItems = []
        if (paymentData.cardHolderName) updates.cardHolderName = undefined
        if (paymentData.cardLast4) updates.cardLast4 = undefined
        if (paymentData.authorizationCode) updates.authorizationCode = undefined
        if (paymentData.authorizationDate) updates.authorizationDate = undefined
        if (paymentData.authorizationAmountCents) updates.authorizationAmountCents = undefined
        break

      case 'installments':
        // Clear deposit and guarantee fields
        if (paymentData.depositType) updates.depositType = null
        if (paymentData.depositPercentage) updates.depositPercentage = null
        if (paymentData.depositAmountCents) updates.depositAmountCents = null
        if (paymentData.cardHolderName) updates.cardHolderName = undefined
        if (paymentData.cardLast4) updates.cardLast4 = undefined
        if (paymentData.authorizationCode) updates.authorizationCode = undefined
        if (paymentData.authorizationDate) updates.authorizationDate = undefined
        if (paymentData.authorizationAmountCents) updates.authorizationAmountCents = undefined
        break

      case 'guarantee':
        // Clear deposit and installment fields
        if (paymentData.depositType) updates.depositType = null
        if (paymentData.depositPercentage) updates.depositPercentage = null
        if (paymentData.depositAmountCents) updates.depositAmountCents = null
        if (paymentData.expectedPaymentItems?.length) updates.expectedPaymentItems = []
        break
    }

    // Only trigger update if there are changes to make
    if (Object.keys(updates).length > 0) {
      onUpdate(updates)
    }
  }, [
    scheduleType,
    onUpdate,
    paymentData.authorizationAmountCents,
    paymentData.authorizationCode,
    paymentData.authorizationDate,
    paymentData.cardHolderName,
    paymentData.cardLast4,
    paymentData.depositAmountCents,
    paymentData.depositPercentage,
    paymentData.depositType,
    paymentData.expectedPaymentItems?.length,
  ])

  // Helper: Add new payment item
  const handleAddPaymentItem = () => {
    const currentItems = paymentData.expectedPaymentItems || []
    const newItem: ExpectedPaymentItem = {
      paymentName: `Payment ${currentItems.length + 1}`,
      expectedAmountCents: 0,
      dueDate: null,
      sequenceOrder: currentItems.length,
    }
    onUpdate({ expectedPaymentItems: [...currentItems, newItem] })
  }

  // Helper: Update payment item
  const handleUpdatePaymentItem = (index: number, updates: Partial<ExpectedPaymentItem>) => {
    const currentItems = [...(paymentData.expectedPaymentItems || [])]
    currentItems[index] = { ...currentItems[index], ...updates } as ExpectedPaymentItem
    onUpdate({ expectedPaymentItems: currentItems })
  }

  // Helper: Remove payment item
  const handleRemovePaymentItem = (index: number) => {
    const currentItems = [...(paymentData.expectedPaymentItems || [])]
    currentItems.splice(index, 1)
    // Re-sequence
    currentItems.forEach((item, idx) => {
      item.sequenceOrder = idx
    })
    onUpdate({ expectedPaymentItems: currentItems })
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Payment Schedule</h3>

      {/* Schedule Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          How will this booking be paid?
        </Label>
        <Select
          value={scheduleType}
          onValueChange={(value) => onUpdate({ scheduleType: value as ScheduleType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Payment</SelectItem>
            <SelectItem value="deposit">Deposit + Balance</SelectItem>
            <SelectItem value="installments">Payment Plan (Installments)</SelectItem>
            <SelectItem value="guarantee">Credit Card Authorization (Guarantee)</SelectItem>
          </SelectContent>
        </Select>
        {errors.scheduleType && (
          <p className="text-sm text-red-500">{errors.scheduleType}</p>
        )}
      </div>

      {/* Allow Partial Payments Checkbox */}
      {scheduleType !== 'full' && scheduleType !== 'guarantee' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowPartialPayments"
            checked={paymentData.allowPartialPayments}
            onCheckedChange={(checked) =>
              onUpdate({ allowPartialPayments: checked as boolean })
            }
          />
          <Label
            htmlFor="allowPartialPayments"
            className="text-sm font-normal cursor-pointer"
          >
            Allow partial payments
          </Label>
        </div>
      )}

      <Separator />

      {/* Deposit Configuration */}
      {scheduleType === 'deposit' && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold">Deposit Configuration</h4>

          {/* Deposit Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Deposit Type</Label>
            <RadioGroup
              value={paymentData.depositType || 'percentage'}
              onValueChange={(value) => onUpdate({ depositType: value as DepositType })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentage
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed_amount" id="fixed_amount" />
                <Label htmlFor="fixed_amount" className="font-normal cursor-pointer">
                  Fixed Amount
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Deposit Amount Fields */}
          {paymentData.depositType === 'percentage' ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deposit Percentage</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  className={NUMERIC_INPUT_CLASS}
                  placeholder="0"
                  value={paymentData.depositPercentage || ''}
                  onChange={(e) => onUpdate({ depositPercentage: parseFloat(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              {totalPriceCents > 0 && paymentData.depositPercentage && (
                <p className="text-sm text-gray-600">
                  Deposit amount: {currency === 'EUR' ? '€' : '$'}
                  {centsToDollars((totalPriceCents * paymentData.depositPercentage) / 100)}
                </p>
              )}
              {errors.depositPercentage && (
                <p className="text-sm text-red-500">{errors.depositPercentage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
                  placeholder="0.00"
                  value={depositAmount.displayValue}
                  onChange={(e) => {
                    depositAmount.onChange(e)
                    const cents = dollarsToCents(e.target.value)
                    onUpdate({ depositAmountCents: cents })
                  }}
                  onBlur={depositAmount.onBlur}
                />
              </div>
              {totalPriceCents > 0 && paymentData.depositAmountCents && (
                <p className="text-sm text-gray-600">
                  Remaining balance: {currency === 'EUR' ? '€' : '$'}
                  {centsToDollars(totalPriceCents - paymentData.depositAmountCents)}
                </p>
              )}
              {errors.depositAmountCents && (
                <p className="text-sm text-red-500">{errors.depositAmountCents}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Plan (Installments) */}
      {scheduleType === 'installments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Payment Schedule</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPaymentItem}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          </div>

          {paymentData.expectedPaymentItems && paymentData.expectedPaymentItems.length > 0 ? (
            <div className="space-y-3">
              {paymentData.expectedPaymentItems.map((item, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Payment name"
                      value={item.paymentName}
                      onChange={(e) =>
                        handleUpdatePaymentItem(index, { paymentName: e.target.value })
                      }
                      className="flex-1 mr-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePaymentItem(index)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Expected Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {currency === 'EUR' ? '€' : '$'}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
                          placeholder="0.00"
                          value={item.expectedAmountCents ? (item.expectedAmountCents / 100).toFixed(2) : ''}
                          onChange={(e) => {
                            const cents = dollarsToCents(e.target.value)
                            handleUpdatePaymentItem(index, { expectedAmountCents: cents })
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Due Date</Label>
                      <DatePickerEnhanced
                        value={item.dueDate}
                        onChange={(date) =>
                          handleUpdatePaymentItem(index, { dueDate: date })
                        }
                        placeholder="Select date"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-gray-200 bg-gray-50">
              <InfoIcon className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-sm text-gray-700">
                No payment items added yet. Click &quot;Add Payment&quot; to create a payment schedule.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Credit Card Authorization (Guarantee) */}
      {scheduleType === 'guarantee' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
            <h4 className="text-base font-semibold">Credit Card Authorization</h4>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              A credit card will be authorized as a guarantee for this booking.
              The card will not be charged unless specified by booking terms.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            {/* Card Holder Name */}
            <div className="space-y-2 col-span-2">
              <Label className="text-sm font-medium text-gray-700">Card Holder Name</Label>
              <Input
                placeholder="John Doe"
                value={paymentData.cardHolderName || ''}
                onChange={(e) => onUpdate({ cardHolderName: e.target.value })}
              />
              {errors.cardHolderName && (
                <p className="text-sm text-red-500">{errors.cardHolderName}</p>
              )}
            </div>

            {/* Card Last 4 Digits */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Last 4 Digits</Label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={paymentData.cardLast4 || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  onUpdate({ cardLast4: value })
                }}
              />
              {errors.cardLast4 && (
                <p className="text-sm text-red-500">{errors.cardLast4}</p>
              )}
            </div>

            {/* Authorization Code */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Authorization Code</Label>
              <Input
                placeholder="AUTH123456"
                value={paymentData.authorizationCode || ''}
                onChange={(e) => onUpdate({ authorizationCode: e.target.value })}
              />
              {errors.authorizationCode && (
                <p className="text-sm text-red-500">{errors.authorizationCode}</p>
              )}
            </div>

            {/* Authorization Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Authorization Date</Label>
              <DatePickerEnhanced
                value={paymentData.authorizationDate || null}
                onChange={(date) => onUpdate({ authorizationDate: date || undefined })}
                placeholder="Select date"
              />
              {errors.authorizationDate && (
                <p className="text-sm text-red-500">{errors.authorizationDate}</p>
              )}
            </div>

            {/* Authorization Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Authorized Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
                  placeholder="0.00"
                  value={authAmount.displayValue}
                  onChange={(e) => {
                    authAmount.onChange(e)
                    const cents = dollarsToCents(e.target.value)
                    onUpdate({ authorizationAmountCents: cents })
                  }}
                  onBlur={authAmount.onBlur}
                />
              </div>
              {errors.authorizationAmountCents && (
                <p className="text-sm text-red-500">{errors.authorizationAmountCents}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
