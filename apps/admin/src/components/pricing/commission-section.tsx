'use client'

/**
 * Reusable Commission Section Component
 *
 * Handles commission calculation with bi-directional sync between rate and total.
 * - Supplier Commission Rate: editable %, defaults from supplier
 * - Total Expected: auto-calculated from (totalPrice - taxes) × rate, or manually overridable
 * - Your Split: READ-ONLY from user profile
 * - Your Commission: calculated display field
 * - Expected Date: date picker for payment tracking
 *
 * Bi-directional sync logic:
 * - When commission % changes → recalculate Total Expected
 * - When Total Expected changes → recalculate commission %
 * - Uses lastEdited ref to prevent infinite loops
 */

import * as React from 'react'
import { usePriceInput } from '@/hooks/use-price-input'
import { type PricingData, type ValidationErrors, dollarsToCents, centsToDollars } from '@/lib/pricing'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const NUMERIC_INPUT_CLASS = 'text-right'

interface CommissionSectionProps {
  pricingData: PricingData
  onUpdate: (updates: Partial<PricingData>) => void
  errors?: ValidationErrors
  /** Whether this activity is a child of a package (linked via parentActivityId) */
  isChildOfPackage?: boolean
  /** Name of the parent package (for display in warning) */
  parentPackageName?: string | null
  /** Supplier's default commission rate (e.g., 10.00 for 10%) */
  supplierCommissionRate?: number | null
  /** User's split value from profile (read-only) */
  userSplitValue?: number | null
  /** User's split type from profile: 'percentage', 'fixed', or 'system_controlled' */
  userSplitType?: 'fixed' | 'percentage' | 'system_controlled' | null
}

export function CommissionSection({
  pricingData,
  onUpdate,
  errors = {},
  isChildOfPackage = false,
  parentPackageName,
  supplierCommissionRate,
  userSplitValue,
  userSplitType = 'percentage',
}: CommissionSectionProps) {
  const commissionTotal = usePriceInput(pricingData.commissionTotalCents || 0)

  // Local state for commission rate % with supplier default as initial value
  const [commissionRate, setCommissionRate] = React.useState<string>(() => {
    // If we have a stored total and can derive rate, use that; otherwise use supplier default
    if (pricingData.commissionTotalCents && pricingData.totalPriceCents) {
      const netPrice = Math.max((pricingData.totalPriceCents || 0) - (pricingData.taxesAndFeesCents || 0), 0)
      if (netPrice > 0) {
        const derived = (pricingData.commissionTotalCents / netPrice) * 100
        return derived.toFixed(2)
      }
    }
    return supplierCommissionRate?.toFixed(2) || ''
  })

  // Track which field was last edited to prevent infinite loops
  const lastEdited = React.useRef<'rate' | 'total' | null>(null)

  // Calculate net price (total - taxes) for commission calculations
  const netPriceCents = Math.max(
    (pricingData.totalPriceCents || 0) - (pricingData.taxesAndFeesCents || 0),
    0
  )

  // Update commission rate when supplier default changes (only if rate is empty)
  React.useEffect(() => {
    if (supplierCommissionRate !== undefined && supplierCommissionRate !== null && !commissionRate) {
      setCommissionRate(supplierCommissionRate.toFixed(2))
    }
  }, [supplierCommissionRate, commissionRate])

  // Handle commission rate change → recalculate total
  const handleRateChange = (value: string) => {
    lastEdited.current = 'rate'
    setCommissionRate(value)

    const rate = parseFloat(value)
    if (!isNaN(rate) && rate >= 0 && rate <= 100 && netPriceCents > 0) {
      const totalCents = Math.round((netPriceCents * rate) / 100)
      onUpdate({ commissionTotalCents: totalCents })
    }
  }

  // Handle total expected change → recalculate rate
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    lastEdited.current = 'total'
    commissionTotal.onChange(e)

    const cents = dollarsToCents(e.target.value)
    onUpdate({ commissionTotalCents: cents })

    // Recalculate rate if we have a net price
    if (netPriceCents > 0) {
      const newRate = (cents / netPriceCents) * 100
      setCommissionRate(newRate.toFixed(2))
    }
  }

  // Determine "Your Split" display value and label
  const splitDisplayValue = userSplitValue ?? pricingData.commissionSplitPercentage ?? 0
  const splitLabel = userSplitType === 'fixed' ? 'Your Split (Fixed)' : 'Your Split %'
  const splitSuffix = userSplitType === 'fixed' ? '' : '%'

  // Calculate "Your Commission" based on split type
  const yourCommissionCents = React.useMemo(() => {
    const totalExpected = pricingData.commissionTotalCents || 0
    if (userSplitType === 'fixed') {
      // Fixed amount in cents (splitValue is in dollars)
      return Math.min((userSplitValue || 0) * 100, totalExpected)
    } else {
      // Percentage of total expected
      return Math.round((totalExpected * splitDisplayValue) / 100)
    }
  }, [pricingData.commissionTotalCents, splitDisplayValue, userSplitType, userSplitValue])

  // Update stored split percentage when user profile value is available
  React.useEffect(() => {
    if (
      userSplitType === 'percentage' &&
      userSplitValue !== undefined &&
      userSplitValue !== null &&
      pricingData.commissionSplitPercentage !== userSplitValue
    ) {
      onUpdate({ commissionSplitPercentage: userSplitValue })
    }
  }, [userSplitValue, userSplitType, pricingData.commissionSplitPercentage, onUpdate])

  // Currency symbol
  const currencySymbol = pricingData.currency === 'EUR' ? '€' : '$'

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
        {/* Supplier Commission Rate % */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Commission Rate %
            {supplierCommissionRate !== null && supplierCommissionRate !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Supplier default: {supplierCommissionRate}%)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className={cn('pr-7', NUMERIC_INPUT_CLASS)}
              placeholder="0.00"
              value={commissionRate}
              onChange={(e) => handleRateChange(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>

        {/* Total Expected */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Total Expected</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {currencySymbol}
            </span>
            <Input
              type="number"
              step="0.01"
              className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
              placeholder="0.00"
              value={commissionTotal.displayValue}
              onChange={handleTotalChange}
              onBlur={commissionTotal.onBlur}
            />
          </div>
          {errors.commissionTotalCents && (
            <p className="text-sm text-red-500">{errors.commissionTotalCents}</p>
          )}
        </div>

        {/* Your Split (READ-ONLY from user profile) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {splitLabel}
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <div className="relative">
            {userSplitType === 'fixed' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
            )}
            <Input
              type="number"
              className={cn(
                NUMERIC_INPUT_CLASS,
                userSplitType === 'fixed' ? 'pl-7' : 'pr-7',
                'bg-muted cursor-not-allowed'
              )}
              value={splitDisplayValue}
              disabled
              readOnly
            />
            {userSplitType !== 'fixed' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {splitSuffix}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">From your profile settings</p>
        </div>

        {/* Your Commission (calculated) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Your Commission</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {currencySymbol}
            </span>
            <Input
              type="text"
              className={`pl-7 ${NUMERIC_INPUT_CLASS} bg-muted cursor-not-allowed`}
              value={centsToDollars(yourCommissionCents)}
              disabled
              readOnly
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {userSplitType === 'fixed'
              ? 'Fixed amount from your profile'
              : `${splitDisplayValue}% of total expected`}
          </p>
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
