'use client'

/**
 * Child of Package Booking Section
 *
 * Replaces the normal booking controls when an activity is linked to a package.
 * Shows read-only booking status and directs users to the parent package
 * for booking management.
 */

import { CalendarCheck, AlertCircle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingStatusBadge } from './mark-activity-booked-modal'
import Link from 'next/link'

interface ChildOfPackageBookingSectionProps {
  parentPackageId: string
  parentPackageName: string | null
  tripId: string
  activityIsBooked: boolean
  activityBookingDate: string | null
}

export function ChildOfPackageBookingSection({
  parentPackageId,
  parentPackageName,
  tripId,
  activityIsBooked,
  activityBookingDate,
}: ChildOfPackageBookingSectionProps) {
  // Link to parent package edit page (packages use ?type=package)
  const parentEditUrl = `/trips/${tripId}/activities/${parentPackageId}/edit?type=package`

  return (
    <div className="space-y-4">
      {/* Read-only booking status */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Booking Status</h3>
              <p className="text-xs text-gray-500">
                {activityIsBooked
                  ? `Booked via package on ${activityBookingDate ? new Date(activityBookingDate).toLocaleDateString() : 'unknown date'}`
                  : 'Not yet booked'}
              </p>
            </div>
          </div>
          <BookingStatusBadge
            isBooked={activityIsBooked}
            bookingDate={activityBookingDate}
            // No onClick - read-only since controlled by parent package
          />
        </div>
      </div>

      {/* Warning + navigation */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800">
          <strong>Booking is controlled by the parent package</strong>
          {parentPackageName && <> &ldquo;{parentPackageName}&rdquo;</>}.
          <br />
          <Link
            href={parentEditUrl}
            className="inline-flex items-center gap-1 mt-2 text-amber-700 font-medium hover:underline"
          >
            Go to {parentPackageName || 'Package'} Booking & Pricing
            <ExternalLink className="h-3 w-3" />
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  )
}
