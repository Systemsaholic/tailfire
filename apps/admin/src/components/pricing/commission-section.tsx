'use client'

/**
 * Reusable Commission Section Component
 *
 * Handles commission total expected, split percentage, and expected date.
 * Uses usePriceInput for commission total and shared validation.
 * Reusable across all activity forms.
 */

import { usePriceInput } from '@/hooks/use-price-input'
import { type PricingData, type ValidationErrors, dollarsToCents } from '@/lib/pricing'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const NUMERIC_INPUT_CLASS = 'text-right'

interface CommissionSectionProps {
  pricingData: PricingData
  onUpdate: (updates: Partial<PricingData>) => void
  errors?: ValidationErrors
  /** Whether this activity is a child of a package (linked via parentActivityId) */
  isChildOfPackage?: boolean
  /** Name of the parent package (for display in warning) */
  parentPackageName?: string | null
}

export function CommissionSection({
  pricingData,
  onUpdate,
  errors = {},
  isChildOfPackage = false,
  parentPackageName,
}: CommissionSectionProps) {
  const commissionTotal = usePriceInput(pricingData.commissionTotalCents || 0)

  // If child of package, show warning and hide fields
  if (isChildOfPackage) {
    return (
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">Commission</h3>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Commission is controlled by the parent package</strong>
            {parentPackageName && <> &quot;{parentPackageName}&quot;</>}.
            <br />
            To edit commission for this activity, unlink it from the package first.
          </AlertDescription>
        </Alert>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Commission</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Expected */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Total Expected</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {pricingData.currency === 'EUR' ? '€' : '$'}
            </span>
            <Input
              type="number"
              step="0.01"
              className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
              placeholder="0.00"
              value={commissionTotal.displayValue}
              onChange={(e) => {
                commissionTotal.onChange(e)
                // Calculate cents directly from input value to avoid async state issue
                const cents = dollarsToCents(e.target.value)
                onUpdate({ commissionTotalCents: cents })
              }}
              onBlur={commissionTotal.onBlur}
            />
          </div>
          {errors.commissionTotalCents && (
            <p className="text-sm text-red-500">{errors.commissionTotalCents}</p>
          )}
        </div>

        {/* Your Split % */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Your Split %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="1"
            className={NUMERIC_INPUT_CLASS}
            placeholder="0"
            value={pricingData.commissionSplitPercentage || ''}
            onChange={(e) => onUpdate({ commissionSplitPercentage: parseFloat(e.target.value) || 0 })}
          />
          {errors.commissionSplitPercentage && (
            <p className="text-sm text-red-500">{errors.commissionSplitPercentage}</p>
          )}
        </div>

        {/* Expected Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Expected Date</Label>
          <DatePickerEnhanced
            value={pricingData.commissionExpectedDate || null}
            onChange={(date) => onUpdate({ commissionExpectedDate: date || undefined })}
            placeholder="Select date"
          />
        </div>
      </div>

      {/* Received Commission (Placeholder for future implementation) */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Received Commission</span>
          <span className="text-sm text-gray-500">Not yet received</span>
        </div>
      </div>
    </Card>
  )
}
