'use client'

/**
 * Reusable Pricing Section Component
 *
 * Handles invoice type, pricing type, total price, taxes & fees, and currency.
 * Commission is handled separately by CommissionSection at the bottom of the booking tab.
 * Uses usePriceInput to prevent auto-tab bug and shared validation.
 * Reusable across all activity forms (flight, lodging, transportation, etc.)
 *
 * When an activity is linked to a package, the pricing fields are hidden and
 * an info banner directs the user to manage pricing at the package level.
 */

import { usePriceInput } from '@/hooks/use-price-input'
import { type PricingData, type ValidationErrors, dollarsToCents } from '@/lib/pricing'
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
import { InfoIcon, AlertCircle } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Link from 'next/link'

const NUMERIC_INPUT_CLASS = 'text-right'

type PricingType = 'per_person' | 'per_room' | 'flat_rate' | 'per_night' | 'total'

/** Minimal package info for dropdown selection */
export interface PackageOption {
  id: string
  name: string
}

interface PricingSectionProps {
  pricingData: PricingData
  onUpdate: (updates: Partial<PricingData>) => void
  errors?: ValidationErrors
  /** Optional array of allowed pricing types for this activity (e.g., lodging only allows 'per_room') */
  allowedPricingTypes?: PricingType[]
  /** Current package ID if this activity is linked to a package */
  packageId?: string | null
  /** Available packages for dropdown selection */
  packages?: PackageOption[]
  /** Trip ID for navigation links */
  tripId?: string
  /** Callback when package selection changes */
  onPackageChange?: (packageId: string | null) => void
  /** Whether this activity is a child of a package (linked via parentActivityId) */
  isChildOfPackage?: boolean
  /** Name of the parent package (for display in warning) */
  parentPackageName?: string | null
}

const DEFAULT_PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'per_room', label: 'Per Room' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'total', label: 'Total' },
]

export function PricingSection({
  pricingData,
  onUpdate,
  errors = {},
  allowedPricingTypes,
  packageId,
  packages = [],
  tripId,
  onPackageChange,
  isChildOfPackage = false,
  parentPackageName,
}: PricingSectionProps) {
  const totalPrice = usePriceInput(pricingData.totalPriceCents || 0)
  const taxesAndFees = usePriceInput(pricingData.taxesAndFeesCents || 0)

  // Filter pricing types if allowedPricingTypes is provided
  const availablePricingTypes = allowedPricingTypes
    ? DEFAULT_PRICING_TYPES.filter(type => allowedPricingTypes.includes(type.value))
    : DEFAULT_PRICING_TYPES

  const invoiceType = pricingData.invoiceType || 'individual_item'

  // Determine if pricing is managed by package
  // Either explicitly selected (part_of_package + packageId) OR structurally linked (isChildOfPackage)
  const isLinkedToPackage = isChildOfPackage || (invoiceType === 'part_of_package' && !!packageId)

  // Handle invoice type change
  const handleInvoiceTypeChange = (value: 'individual_item' | 'part_of_package') => {
    onUpdate({ invoiceType: value })
    // If switching to individual, clear package association
    if (value === 'individual_item' && onPackageChange) {
      onPackageChange(null)
    }
  }

  // Handle package selection
  const handlePackageSelect = (selectedPackageId: string) => {
    if (onPackageChange) {
      onPackageChange(selectedPackageId)
    }
  }

  // Find current package name for display
  const currentPackageName = packages.find(p => p.id === packageId)?.name

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Pricing</h3>

      {/* Child of Package Warning - pricing is locked */}
      {isChildOfPackage && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Pricing is controlled by the parent package</strong>
            {parentPackageName && <> &quot;{parentPackageName}&quot;</>}.
            <br />
            To edit pricing for this activity, unlink it from the package first.
          </AlertDescription>
        </Alert>
      )}

      {/* Invoice Type Toggle - hidden when child of package */}
      {!isChildOfPackage && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            How will this activity be invoiced?
          </Label>
          <RadioGroup
            value={invoiceType}
            onValueChange={handleInvoiceTypeChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual_item" id="individual_item" />
              <Label htmlFor="individual_item" className="font-normal cursor-pointer">
                Individual Item
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="part_of_package" id="part_of_package" />
              <Label htmlFor="part_of_package" className="font-normal cursor-pointer">
                Part of Trip Package
              </Label>
            </div>
          </RadioGroup>

          {errors.invoiceType && (
            <p className="text-sm text-red-500">{errors.invoiceType}</p>
          )}
        </div>
      )}

      {/* Package Selection - Show when "Part of Trip Package" is selected (but not when child of package) */}
      {!isChildOfPackage && invoiceType === 'part_of_package' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Trip Package</Label>
          <Select
            value={packageId || ''}
            onValueChange={handlePackageSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a package">
                {currentPackageName || 'Select a package'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {packages.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No packages available
                </SelectItem>
              ) : (
                packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info Banner - Show when linked to package (but not when child of package - separate warning shown) */}
      {!isChildOfPackage && isLinkedToPackage && tripId && (
        <Alert className="border-blue-200 bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>Looking to Edit this Trip Package Pricing?</strong>
            <br />
            Please visit the{' '}
            <Link
              href={`/trips/${tripId}?tab=bookings`}
              className="font-medium text-blue-600 hover:underline"
            >
              Bookings
            </Link>{' '}
            tab to manage trip package pricing and booking details.
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing fields - hidden when linked to a package */}
      {!isLinkedToPackage && (
        <>
          {/* Pricing Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              How is this activity priced?
            </Label>
            <Select
              value={pricingData.pricingType}
              onValueChange={(value) => onUpdate({ pricingType: value as PricingType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePricingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pricingType && (
              <p className="text-sm text-red-500">{errors.pricingType}</p>
            )}
          </div>

          {/* Price Details */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            {/* Total Price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Total Price (including taxes & fees)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {pricingData.currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
                  placeholder="0.00"
                  value={totalPrice.displayValue}
                  onChange={(e) => {
                    totalPrice.onChange(e)
                    const cents = dollarsToCents(e.target.value)
                    onUpdate({ totalPriceCents: cents })
                  }}
                  onBlur={totalPrice.onBlur}
                />
              </div>
              {errors.totalPriceCents && (
                <p className="text-sm text-red-500">{errors.totalPriceCents}</p>
              )}
            </div>

            {/* Taxes & Fees */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Taxes & Fees</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {pricingData.currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className={`pl-7 ${NUMERIC_INPUT_CLASS}`}
                  placeholder="0.00"
                  value={taxesAndFees.displayValue}
                  onChange={(e) => {
                    taxesAndFees.onChange(e)
                    const cents = dollarsToCents(e.target.value)
                    onUpdate({ taxesAndFeesCents: cents })
                  }}
                  onBlur={taxesAndFees.onBlur}
                />
              </div>
              {errors.taxesAndFeesCents && (
                <p className="text-sm text-red-500">{errors.taxesAndFeesCents}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Currency</Label>
              <Select
                value={pricingData.currency}
                onValueChange={(value) => onUpdate({ currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency}</p>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
