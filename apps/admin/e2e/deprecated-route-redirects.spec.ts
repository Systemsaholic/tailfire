/**
 * E2E Test: Deprecated Booking Route Redirects
 *
 * Guards the redirect behavior for legacy /bookings/* and /packages/* URLs.
 * Both now redirect to the unified /activities/* routes since packages are
 * activities with activityType='package'.
 *
 * Redirect Mappings:
 * - /trips/:tripId/bookings/new → /trips/:tripId/activities/new?type=package
 * - /trips/:tripId/bookings/:bookingId → /trips/:tripId/activities/:activityId/edit?type=package
 * - /trips/:tripId/packages/new → /trips/:tripId/activities/new?type=package
 * - /trips/:tripId/packages/:packageId → /trips/:tripId/activities/:packageId/edit?type=package
 *
 * These tests verify the legacy routes properly redirect to the unified activity system.
 *
 * Prerequisites:
 * - Admin app running on http://localhost:3100
 * - API server running on http://localhost:3101
 */

import { test, expect } from '@playwright/test'

test.describe('Deprecated Booking Route Redirects', () => {
  const testTripId = 'test-trip-id'
  const nonExistentId = 'non-existent-booking-id'

  test('/bookings/new redirects to /activities/new?type=package', async ({ page }) => {
    await page.goto(`/trips/${testTripId}/bookings/new`)

    // Should redirect to activities/new with type=package
    await expect(page).toHaveURL(new RegExp(`/trips/${testTripId}/activities/new`))
    await expect(page).toHaveURL(/type=package/)
  })

  test('/bookings/:id redirects to /activities/:id/edit?type=package', async ({ page }) => {
    await page.goto(`/trips/${testTripId}/bookings/${nonExistentId}`)

    // Should redirect to activities edit page with type=package
    await expect(page).toHaveURL(
      new RegExp(`/trips/${testTripId}/activities/${nonExistentId}/edit`)
    )
    await expect(page).toHaveURL(/type=package/)
  })
})

test.describe('Deprecated Package Route Redirects', () => {
  const testTripId = 'test-trip-id'
  const testPackageId = 'test-package-id'

  test('/packages/new redirects to /activities/new?type=package', async ({ page }) => {
    await page.goto(`/trips/${testTripId}/packages/new`)

    // Should redirect to activities/new with type=package
    await expect(page).toHaveURL(new RegExp(`/trips/${testTripId}/activities/new`))
    await expect(page).toHaveURL(/type=package/)
  })

  test('/packages/:id redirects to /activities/:id/edit?type=package', async ({ page }) => {
    await page.goto(`/trips/${testTripId}/packages/${testPackageId}`)

    // Should redirect to activities edit page with type=package
    await expect(page).toHaveURL(
      new RegExp(`/trips/${testTripId}/activities/${testPackageId}/edit`)
    )
    await expect(page).toHaveURL(/type=package/)
  })
})
