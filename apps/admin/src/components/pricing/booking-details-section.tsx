'use client'

/**
 * Reusable Booking Details Section Component
 *
 * Handles supplier, terms & conditions, cancellation policy, and confirmation details.
 * Reusable across all activity forms.
 */

import { type PricingData } from '@/lib/pricing'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface BookingDetailsSectionProps {
  pricingData: PricingData
  onUpdate: (updates: Partial<PricingData>) => void
}

export function BookingDetailsSection({ pricingData, onUpdate }: BookingDetailsSectionProps) {
  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Booking Details</h3>

      {/* Supplier */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Supplier</Label>
        <Input
          placeholder="Search for supplier..."
          value={pricingData.supplier || ''}
          onChange={(e) => onUpdate({ supplier: e.target.value })}
        />
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Terms & Conditions</Label>
        <Textarea
          rows={3}
          placeholder="Enter terms and conditions..."
          value={pricingData.termsAndConditions || ''}
          onChange={(e) => onUpdate({ termsAndConditions: e.target.value })}
        />
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Cancellation Policy</Label>
        <Textarea
          rows={3}
          placeholder="Enter cancellation policy..."
          value={pricingData.cancellationPolicy || ''}
          onChange={(e) => onUpdate({ cancellationPolicy: e.target.value })}
        />
      </div>

      <Separator />

      {/* Confirmation Details */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">Confirmation Details</h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Confirmation Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Confirmation Number</Label>
            <Input
              placeholder="Enter confirmation number..."
              value={pricingData.confirmationNumber || ''}
              onChange={(e) => onUpdate({ confirmationNumber: e.target.value })}
            />
          </div>

          {/* Supplier (duplicate for confirmation context) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Supplier</Label>
            <Input
              placeholder="Supplier name..."
              value={pricingData.supplier || ''}
              onChange={(e) => onUpdate({ supplier: e.target.value })}
            />
          </div>
        </div>

        {/* Upload Receipt Button */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button">
            Upload Receipt
          </Button>
          <Button variant="ghost" size="sm" type="button">
            Add Additional Confirmation Details
          </Button>
        </div>
      </div>
    </Card>
  )
}
