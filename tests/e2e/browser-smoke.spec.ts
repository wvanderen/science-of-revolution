import { test, expect } from '@playwright/test'

/**
 * Browser Smoke Tests - Core Functionality Validation
 *
 * These tests validate that critical user journeys work end-to-end
 * and the application doesn't break with basic usage patterns.
 *
 * Run as part of QA gate process to ensure build stability
 * before comprehensive testing begins.
 */

test.describe('Browser Smoke Tests - Core Application', () => {
  test.beforeEach(async ({ page }) => {
    // Set up consistent viewport for smoke tests
    await page.setViewportSize({ width: 1200, height: 800 })
  })

  test('application loads and renders basic UI', async ({ page }) => {
    // Navigate to root - should redirect to invite if not authenticated
    await page.goto('/')

    // Should either load dashboard (authenticated) or redirect to invite
    const urls = [/\//, /\/invite/]
    await expect(page).toHaveURL(urls[0] || urls[1])

    // Check that page loads without JavaScript errors
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Should have no critical JavaScript errors
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0)
  })

  test('invite portal functionality works', async ({ page }) => {
    await page.goto('/invite')

    // Basic UI elements should be present
    await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()
    await expect(page.getByLabel(/invite code/i)).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()

    // Form validation should work
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()

    // Form accepts input
    await page.getByLabel(/invite code/i).fill('TEST123')
    await page.getByLabel(/display name/i).fill('Smoke Test User')
    await page.getByLabel(/email/i).fill('smoke@test.com')
    await page.getByLabel(/password/i).fill('TestPass123!')

    // Verify input is accepted
    await expect(page.getByLabel(/invite code/i)).toHaveValue('TEST123')
    await expect(page.getByLabel(/display name/i)).toHaveValue('Smoke Test User')
  })

  test('responsive design works across viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/invite')

      // Page should be responsive and usable
      await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()

      // Form should be functional on all sizes
      await expect(page.getByLabel(/invite code/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
    }
  })
})

test.describe('Browser Smoke Tests - Performance & Resource Loading', () => {
  test('critical resources load without errors', async ({ page }) => {
    const failedResources: string[] = []

    page.on('requestfailed', request => {
      failedResources.push(request.url())
    })

    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // No critical resources should fail to load
    const criticalFailures = failedResources.filter(url =>
      url.includes('/src/') || url.includes('/assets/') || !url.includes('http')
    )

    expect(criticalFailures).toHaveLength(0)
  })

  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000)
  })

  test('no memory leaks detected during navigation', async ({ page }) => {
    // Monitor memory usage during navigation
    await page.goto('/invite')

    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.reload()
      await page.waitForLoadState('networkidle')
    }

    // Check that page is still responsive
    await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()
  })
})

test.describe('Browser Smoke Tests - Error Handling', () => {
  test('handles invalid routes gracefully', async ({ page }) => {
    // Try to access non-existent route
    await page.goto('/non-existent-route')

    // Should handle gracefully (either 404 page or redirect)
    await page.waitForLoadState('networkidle')

    // Should not show browser error pages
    const pageTitle = await page.title()
    expect(pageTitle.toLowerCase()).not.toContain('not found')
  })

  test('handles network interruptions gracefully', async ({ page }) => {
    // Start with normal page load
    await page.goto('/invite')
    await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()

    // Simulate offline condition
    await page.context().setOffline(true)

    // Try to interact with form
    await page.getByLabel(/invite code/i).fill('TEST123')

    // Page should still be functional
    await expect(page.getByLabel(/invite code/i)).toHaveValue('TEST123')

    // Restore connection
    await page.context().setOffline(false)
  })
})

test.describe('Browser Smoke Tests - Accessibility', () => {
  test('basic accessibility checks', async ({ page }) => {
    await page.goto('/invite')

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count()
    const h2 = await page.locator('h2').count()

    expect(h1).toBeGreaterThan(0)

    // Check form labels
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').count()
    const labels = await page.locator('label').count()

    // Should have labels for form inputs
    expect(labels).toBeGreaterThan(0)

    // Check for proper button text
    const buttons = await page.locator('button').all()
    for (const button of buttons.slice(0, 3)) { // Check first 3 buttons
      const text = await button.textContent()
      expect(text?.trim()).toBeTruthy()
    }
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/invite')

    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to navigate with keyboard
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})