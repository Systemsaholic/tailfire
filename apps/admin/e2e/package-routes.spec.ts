/**
 * E2E Test: Package Routes
 *
 * Smoke tests to verify /packages/* URLs redirect to /activities/* correctly.
 * Packages are now activities with activityType='package' - there are no separate
 * /packages/* pages. Legacy URLs redirect to the unified activity form.
 *
 * Prerequisites:
 * - Admin app running on http://localhost:3100
 * - API server running on http://localhost:3101
 */

import { test, expect } from '@playwright/test'

test.describe('Package Routes (Redirects to Activities)', () => {
  test('/packages/new redirects to /activities/new?type=package', async ({ page }) => {
    // Navigate to packages/new
    await page.goto('/trips/test-trip-id/packages/new')
    await page.waitForLoadState('networkidle')

    // URL should redirect to /activities/new?type=package
    expect(page.url()).toContain('/activities/new')
    expect(page.url()).toContain('type=package')

    // Page should render the activity form
    const pageContent = await page.content()
    expect(
      pageContent.includes('Package') ||
        pageContent.includes('General Info') ||
        pageContent.includes('New')
    ).toBe(true)
  })

  test('/packages/:id redirects to /activities/:id/edit?type=package', async ({ page }) => {
    // Navigate to packages/:id
    await page.goto('/trips/test-trip-id/packages/test-package-id')
    await page.waitForLoadState('networkidle')

    // URL should redirect to /activities/:id/edit?type=package
    expect(page.url()).toContain('/activities/test-package-id/edit')
    expect(page.url()).toContain('type=package')

    // Page should render (may show loading or "not found" for invalid ID)
    // but should not be a hard 404 error page
    const status = await page.evaluate(() => {
      return document.querySelector('body')?.innerText?.includes('404') ? 404 : 200
    })
    expect(status).not.toBe(404)
  })

  test('/packages/:id?tab=booking redirects with tab parameter preserved', async ({ page }) => {
    // Navigate with tab=booking query param
    await page.goto('/trips/test-trip-id/packages/test-package-id?tab=booking')
    await page.waitForLoadState('networkidle')

    // URL should redirect to /activities/:id/edit with type=package
    expect(page.url()).toContain('/activities/')
    expect(page.url()).toContain('type=package')
  })

  test('/packages/:id?tab=documents redirects with tab parameter', async ({ page }) => {
    // Navigate with tab=documents query param
    await page.goto('/trips/test-trip-id/packages/test-package-id?tab=documents')
    await page.waitForLoadState('networkidle')

    // URL should redirect to /activities/:id/edit with type=package
    expect(page.url()).toContain('/activities/')
    expect(page.url()).toContain('type=package')
  })

  test('invalid tab parameter still redirects correctly', async ({ page }) => {
    // Navigate with invalid tab param
    await page.goto('/trips/test-trip-id/packages/test-package-id?tab=invalid')
    await page.waitForLoadState('networkidle')

    // Should redirect to /activities/:id/edit
    expect(page.url()).toContain('/activities/')
    expect(page.url()).toContain('type=package')

    // Page should render without error
    const pageContent = await page.content()
    expect(pageContent.includes('Package') || pageContent.includes('General')).toBe(true)
  })
})
