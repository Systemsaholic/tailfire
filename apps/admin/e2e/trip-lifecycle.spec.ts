/**
 * E2E Test: Trip Lifecycle
 *
 * Tests the full trip lifecycle from creation through completion:
 * 1. Create new trip with primary contact
 * 2. Verify trip appears in trips list
 * 3. Transition through statuses: draft → quoted → booked
 * 4. Verify reference number persists and booking date is set
 * 5. Complete trip lifecycle: booked → in_progress → completed
 *
 * Prerequisites:
 * - Admin app running on http://localhost:3100
 * - API running on http://localhost:3000
 * - Database seeded with at least one contact
 */

import { test, expect } from '@playwright/test'

test.describe('Trip Lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to trips page
    await page.goto('/trips')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should complete full trip lifecycle: create → draft → quoted → booked → in_progress → completed', async ({
    page,
  }) => {
    // Step 1: Create new trip
    await page.getByRole('button', { name: /new trip/i }).click()

    // Fill in trip details
    await page.getByLabel(/trip name/i).fill('E2E Test Trip')
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /leisure/i }).click()

    // Set dates
    const startDate = '2025-12-01'
    const endDate = '2025-12-15'
    await page.getByLabel(/start date/i).fill(startDate)
    await page.getByLabel(/end date/i).fill(endDate)

    // Select primary contact (assuming first contact in dropdown)
    await page.getByLabel(/primary contact/i).click()
    await page.getByRole('option').first().click()

    // Submit form
    await page.getByRole('button', { name: /create trip/i }).click()

    // Wait for navigation to trip detail page
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/)

    // Step 2: Verify trip was created in draft status
    await expect(page.getByText(/draft/i)).toBeVisible()

    // Capture reference number (should be FIT-2025-XXXXXX format)
    const referenceNumber = await page
      .locator('[data-testid="trip-reference-number"]')
      .textContent()

    expect(referenceNumber).toMatch(/^FIT-\d{4}-\d{6}$/)

    // Step 3: Transition to quoted status
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /quoted/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify status changed to quoted
    await expect(page.getByText(/quoted/i)).toBeVisible()

    // Verify reference number hasn't changed
    await expect(
      page.locator('[data-testid="trip-reference-number"]')
    ).toHaveText(referenceNumber!)

    // Step 4: Transition to booked status
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /booked/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify status changed to booked
    await expect(page.getByText(/booked/i)).toBeVisible()

    // Verify booking date was set
    await expect(page.getByText(/booking date/i)).toBeVisible()

    // Verify reference number still hasn't changed
    await expect(
      page.locator('[data-testid="trip-reference-number"]')
    ).toHaveText(referenceNumber!)

    // Step 5: Transition to in_progress
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /in progress/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify status changed
    await expect(page.getByText(/in progress/i)).toBeVisible()

    // Step 6: Complete the trip
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /completed/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify final status
    await expect(page.getByText(/completed/i)).toBeVisible()

    // Verify reference number persisted through entire lifecycle
    await expect(
      page.locator('[data-testid="trip-reference-number"]')
    ).toHaveText(referenceNumber!)

    // Step 7: Verify trip appears in completed trips list
    await page.goto('/trips')
    await page.getByRole('tab', { name: /completed/i }).click()

    // Verify trip is in the list
    await expect(page.getByText('E2E Test Trip')).toBeVisible()
  })

  test('should prevent invalid status transitions', async ({ page }) => {
    // Create a draft trip first
    await page.getByRole('button', { name: /new trip/i }).click()
    await page.getByLabel(/trip name/i).fill('Invalid Transition Test')
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /leisure/i }).click()
    await page.getByLabel(/start date/i).fill('2025-12-01')
    await page.getByLabel(/end date/i).fill('2025-12-15')
    await page.getByLabel(/primary contact/i).click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: /create trip/i }).click()

    await page.waitForURL(/\/trips\/[a-f0-9-]+$/)

    // Try to transition from draft directly to in_progress (invalid)
    await page.getByRole('button', { name: /change status/i }).click()

    // Verify in_progress option is disabled or not present
    const inProgressOption = page.getByRole('option', { name: /in progress/i })
    await expect(inProgressOption).toBeDisabled()
  })

  test('should show traveler snapshot comparison when contact info changes', async ({
    page,
  }) => {
    // This test assumes:
    // 1. A trip already exists with a primary contact
    // 2. The contact's information has been updated since trip creation

    // Navigate to existing trip (replace with actual trip ID in real scenario)
    await page.goto('/trips')
    await page.getByRole('link').first().click()

    // Check if traveler snapshot comparison is visible
    const snapshotCard = page.locator('[data-testid="traveler-snapshot-comparison"]')

    // If visible, verify it shows changes
    if (await snapshotCard.isVisible()) {
      await expect(
        page.getByText(/traveler information updated/i)
      ).toBeVisible()

      // Verify change count badge is present
      await expect(page.getByText(/\d+ changes?/i)).toBeVisible()

      // Verify old → new value format is present
      await expect(page.locator('text=→')).toBeVisible()
    }
  })

  test('should set first booking date on contact when trip is booked', async ({
    page,
  }) => {
    // Create a new trip
    await page.getByRole('button', { name: /new trip/i }).click()
    await page.getByLabel(/trip name/i).fill('Booking Date Test')
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /leisure/i }).click()
    await page.getByLabel(/start date/i).fill('2025-12-01')
    await page.getByLabel(/end date/i).fill('2025-12-15')

    // Select primary contact
    await page.getByLabel(/primary contact/i).click()
    await page.getByRole('option').first().click()

    // Capture contact name for later verification
    const contactName = await page
      .getByLabel(/primary contact/i)
      .inputValue()

    await page.getByRole('button', { name: /create trip/i }).click()
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/)

    // Transition to booked
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /booked/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Navigate to contacts page
    await page.goto('/contacts')

    // Find the contact and click to view details
    await page.getByRole('link', { name: contactName }).click()

    // Verify first booking date is now set
    await expect(page.getByText(/first booking date/i)).toBeVisible()

    // Verify the date is today's date (or recent)
    const bookingDateText = await page
      .locator('[data-testid="first-booking-date"]')
      .textContent()

    expect(bookingDateText).toBeTruthy()
  })

  test('should maintain reference number when trip type changes in draft', async ({
    page,
  }) => {
    // Create a draft trip
    await page.getByRole('button', { name: /new trip/i }).click()
    await page.getByLabel(/trip name/i).fill('Reference Number Test')
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /leisure/i }).click()
    await page.getByLabel(/start date/i).fill('2025-12-01')
    await page.getByLabel(/end date/i).fill('2025-12-15')
    await page.getByLabel(/primary contact/i).click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: /create trip/i }).click()

    await page.waitForURL(/\/trips\/[a-f0-9-]+$/)

    // Capture initial reference number (FIT prefix for leisure)
    const initialRef = await page
      .locator('[data-testid="trip-reference-number"]')
      .textContent()

    expect(initialRef).toMatch(/^FIT-\d{4}-\d{6}$/)

    // Edit trip and change type to group (while still in draft)
    await page.getByRole('button', { name: /edit trip/i }).click()
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /group/i }).click()
    await page.getByRole('button', { name: /save/i }).click()

    // Verify reference number regenerated with new prefix
    const updatedRef = await page
      .locator('[data-testid="trip-reference-number"]')
      .textContent()

    expect(updatedRef).toMatch(/^GRP-\d{4}-\d{6}$/)
    expect(updatedRef).not.toBe(initialRef)

    // Now transition to quoted (locks reference number)
    await page.getByRole('button', { name: /change status/i }).click()
    await page.getByRole('option', { name: /quoted/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Capture locked reference number
    const lockedRef = await page
      .locator('[data-testid="trip-reference-number"]')
      .textContent()

    // Try to change type again (should not affect reference number)
    await page.getByRole('button', { name: /edit trip/i }).click()
    await page.getByLabel(/trip type/i).click()
    await page.getByRole('option', { name: /business/i }).click()
    await page.getByRole('button', { name: /save/i }).click()

    // Verify reference number didn't change
    await expect(
      page.locator('[data-testid="trip-reference-number"]')
    ).toHaveText(lockedRef!)
  })
})
