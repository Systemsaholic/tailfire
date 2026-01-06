'use client'

/**
 * Record Payment Modal
 *
 * Modal dialog for recording payment transactions against expected payment items.
 * Supports payment, refund, and adjustment transaction types.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useCreatePaymentTransaction } from '@/hooks/use-payment-schedules'
import { dollarsToCents, centsToDollars } from '@/lib/payment-calculations'
import { formatCurrency } from '@/lib/pricing/currency-helpers'
import type { PaymentTransactionType, PaymentMethod, ExpectedPaymentItemDto } from '@tailfire/shared-types/api'

interface RecordPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expectedPaymentItem: ExpectedPaymentItemDto
  activityPricingId: string
  currency: string
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  expectedPaymentItem,
  activityPricingId,
  currency,
}: RecordPaymentModalProps) {
  const createTransaction = useCreatePaymentTransaction(activityPricingId)

  // Form state
  const [transactionType, setTransactionType] = useState<PaymentTransactionType>('payment')
  const [amountDollars, setAmountDollars] = useState<number>(
    parseFloat(centsToDollars(expectedPaymentItem.expectedAmountCents - (expectedPaymentItem.paidAmountCents || 0)))
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('credit_card')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState<string>('')

  const remainingAmount = expectedPaymentItem.expectedAmountCents - (expectedPaymentItem.paidAmountCents || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createTransaction.mutate(
      {
        expectedPaymentItemId: expectedPaymentItem.id,
        transactionType,
        amountCents: dollarsToCents(amountDollars),
        currency,
        paymentMethod: paymentMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        transactionDate: transactionDate.toISOString(),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          // Reset form
          setTransactionType('payment')
          setAmountDollars(0)
          setPaymentMethod('credit_card')
          setReferenceNumber('')
          setNotes('')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for &quot;{expectedPaymentItem.paymentName}&quot;.
              Remaining balance: {formatCurrency(remainingAmount, currency)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Transaction Type */}
            <div className="grid gap-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as PaymentTransactionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={amountDollars}
                onChange={(e) => setAmountDollars(parseFloat(e.target.value) || 0)}
                className="text-right"
              />
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod || ''}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., confirmation #, check #"
              />
            </div>

            {/* Transaction Date */}
            <div className="grid gap-2">
              <Label>Transaction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !transactionDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending || amountDollars <= 0}>
              {createTransaction.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
