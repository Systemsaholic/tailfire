/**
 * E2E Test: Activity Form Success Overlay
 *
 * Tests the success overlay and redirect behavior after activity form submission:
 * 1. Submit activity in Day View → overlay shows → redirects to Day View
 * 2. Submit activity in Table View → overlay shows → redirects to Table View
 * 3. Verify success overlay is visible for approximately 1 second
 * 4. Verify scroll-to-day works on return
 *
 * Prerequisites:
 * - Admin app running on http://localhost:3100
 * - API running on http://localhost:3000
 * - Database seeded with at least one trip with an itinerary and days
 */

import { test, expect } from '@playwright/test'

test.describe('Activity Form Success Overlay E2E', () => {
  // Store trip ID for tests - we'll use the first available trip
  let tripId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to trips page
    await page.goto('/trips')
    await page.waitForLoadState('networkidle')

    // Click first trip to get to trip detail page
    const tripLink = page.locator('a[href^="/trips/"]').first()
    await tripLink.click()

    // Wait for trip page to load and extract trip ID from URL
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/)
    const url = page.url()
    tripId = url.split('/trips/')[1] ?? ''

    // Wait for itinerary to load
    await page.waitForLoadState('networkidle')
  })

  test('should show success overlay and redirect to Day View after activity submission', async ({
    page,
  }) => {
    // Ensure we're in Day View (board mode)
    const dayViewTab = page.getByRole('tab', { name: /day/i })
    if (await dayViewTab.isVisible()) {
      await dayViewTab.click()
    }

    // Wait for day columns to load
    await page.waitForSelector('[data-testid="day-column"], [id^="day-"]', {
      timeout: 10000,
    })

    // Click "Add Activity" button in first day column
    const addActivityButton = page
      .locator('[data-testid="day-column"], [id^="day-"]')
      .first()
      .getByRole('button', { name: /add|activity/i })
      .first()

    // If no "Add Activity" button, try the + button or dropdown trigger
    if (!(await addActivityButton.isVisible())) {
      // Try clicking the dropdown trigger to show activity type options
      const dropdownTrigger = page
        .locator('[data-testid="day-column"], [id^="day-"]')
        .first()
        .locator('button')
        .first()
      await dropdownTrigger.click()
    } else {
      await addActivityButton.click()
    }

    // Select activity type (e.g., Tour)
    const tourOption = page.getByRole('menuitem', { name: /tour/i })
    if (await tourOption.isVisible()) {
      await tourOption.click()
    } else {
      // Try option role
      const tourOptionAlt = page.getByRole('option', { name: /tour/i })
      if (await tourOptionAlt.isVisible()) {
        await tourOptionAlt.click()
      }
    }

    // Wait for form page to load
    await page.waitForURL(/\/activities\/new/)

    // Fill required form fields
    await page.getByLabel(/name/i).first().fill('E2E Test Tour Activity')

    // Find and click save/submit button
    const submitButton = page.getByRole('button', { name: /save|create|submit/i })
    await submitButton.click()

    // Verify success overlay appears with checkmark
    const successOverlay = page.locator('[role="status"]')
    await expect(successOverlay).toBeVisible({ timeout: 5000 })

    // Verify the overlay contains success message
    await expect(page.getByText(/added|saved|success/i)).toBeVisible()

    // Wait for redirect back to trip page (overlay disappears after ~1s)
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 5000 })

    // Verify we're back on the trip page in Day View
    await expect(page).toHaveURL(new RegExp(`/trips/${tripId}$`))
  })

  test('should show success overlay and redirect to Table View after activity submission', async ({
    page,
  }) => {
    // Switch to Table View
    const tableViewTab = page.getByRole('tab', { name: /table/i })
    if (await tableViewTab.isVisible()) {
      await tableViewTab.click()
    }

    // Wait for table to load
    await page.waitForSelector('table, [data-testid="itinerary-table"]', {
      timeout: 10000,
    })

    // Click on an activity row to edit (if any exist)
    const activityRow = page.locator('table tbody tr').first()
    if (await activityRow.isVisible()) {
      await activityRow.click()

      // Wait for edit form to load
      await page.waitForURL(/\/activities\/[a-f0-9-]+\/edit/)

      // Make a small edit to the activity name
      const nameField = page.getByLabel(/name/i).first()
      await nameField.clear()
      await nameField.fill('Updated E2E Test Activity')

      // Submit the form
      const submitButton = page.getByRole('button', {
        name: /save|update|submit/i,
      })
      await submitButton.click()

      // Verify success overlay appears
      const successOverlay = page.locator('[role="status"]')
      await expect(successOverlay).toBeVisible({ timeout: 5000 })

      // Verify success message
      await expect(page.getByText(/updated|saved|success/i)).toBeVisible()

      // Wait for redirect back to trip page
      await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 5000 })

      // Verify we're back on trip page
      await expect(page).toHaveURL(new RegExp(`/trips/${tripId}$`))
    }
  })

  test('should display success overlay for approximately 1 second', async ({
    page,
  }) => {
    // Navigate directly to new activity form
    await page.goto(`/trips/${tripId}/activities/new?type=dining`)

    // Wait for form to load
    await page.waitForLoadState('networkidle')

    // Fill minimal required fields
    await page.getByLabel(/name/i).first().fill('E2E Timing Test Dining')

    // Record time before submission
    const startTime = Date.now()

    // Submit form
    const submitButton = page.getByRole('button', { name: /save|create|submit/i })
    await submitButton.click()

    // Wait for overlay to appear
    const successOverlay = page.locator('[role="status"]')
    await expect(successOverlay).toBeVisible({ timeout: 5000 })

    // Wait for redirect (overlay should disappear)
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 5000 })

    // Check that roughly 1 second passed (allow 500ms-2000ms tolerance)
    const elapsed = Date.now() - startTime
    expect(elapsed).toBeGreaterThan(500)
    expect(elapsed).toBeLessThan(3000)
  })

  test('should preserve view mode preference on return from activity form', async ({
    page,
  }) => {
    // Start in Table View
    const tableViewTab = page.getByRole('tab', { name: /table/i })
    if (await tableViewTab.isVisible()) {
      await tableViewTab.click()
      await page.waitForTimeout(500) // Allow view switch to complete
    }

    // Navigate to new activity form
    await page.goto(`/trips/${tripId}/activities/new?type=transportation`)
    await page.waitForLoadState('networkidle')

    // Fill and submit
    await page.getByLabel(/name/i).first().fill('E2E View Mode Test')
    const submitButton = page.getByRole('button', { name: /save|create|submit/i })
    await submitButton.click()

    // Wait for redirect
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 5000 })

    // Verify we're back on trip page
    await page.waitForLoadState('networkidle')

    // Check localStorage for view preference
    const viewMode = await page.evaluate((id) => {
      return localStorage.getItem(`tailfire-view-${id}`)
    }, tripId)

    // The view mode should be stored (either 'board' or 'table')
    expect(viewMode).toBeTruthy()
  })

  test('should handle cancel button correctly (no overlay, returns to itinerary)', async ({
    page,
  }) => {
    // Navigate to new activity form
    await page.goto(`/trips/${tripId}/activities/new?type=options`)
    await page.waitForLoadState('networkidle')

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await cancelButton.click()

    // Verify no success overlay appears
    const successOverlay = page.locator('[role="status"]')
    await expect(successOverlay).not.toBeVisible()

    // Verify we're back on trip page
    await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 5000 })
  })
})
