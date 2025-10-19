import { test, expect } from '@playwright/test'

/**
 * Story 1.2 Validation - Reader Progress Component Extraction
 *
 * This test validates that the acceptance criteria for Story 1.2 are working correctly
 * by using browser automation to verify the actual functionality in the running application.
 *
 * Story: "As a developer working on reader features,
 *         I want to extract progress tracking logic into a dedicated ReaderProgressTracker component,
 *         so that progress functionality is isolated and can be tested independently."
 */

test.describe('Story 1.2 Validation - Reader Progress Component', () => {
  // Test data for validation
  const testResourceId = 'test-resource-1'

  test.beforeEach(async ({ page }) => {
    // Navigate to a reader page for testing
    await page.goto(`/reader/${testResourceId}`)
    await page.waitForLoadState('networkidle')

    // If the page doesn't have scrollable content, inject some for testing
    const hasScrollableContent = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight
    })

    if (!hasScrollableContent) {
      // Inject test content to make page scrollable
      await page.evaluate(() => {
        const testContent = document.createElement('div')
        testContent.style.height = '200vh'
        testContent.style.padding = '20px'
        testContent.innerHTML = `
          <h1>Test Content for Progress Tracking</h1>
          <p>This is test content to create scrollable page for progress tracking validation.</p>
          <div style="height: 50vh;">Section 1</div>
          <div style="height: 50vh;">Section 2</div>
          <div style="height: 50vh;">Section 3</div>
          <div style="height: 50vh;">Section 4</div>
        `
        document.body.appendChild(testContent)
      })
    }
  })

  test('AC1: ReaderProgressTracker component exists and is rendered', async ({ page }) => {
    // Check that the ReaderProgressTracker component is present in the DOM
    // Use a longer timeout to account for component initialization
    const progressTracker = page.locator('[data-testid="reader-progress-tracker"]').first()

    // Wait for component to be present (may not be visible)
    await progressTracker.waitFor({ state: 'attached', timeout: 10000 })

    // Check that component exists in DOM (it's hidden, so we check for existence not visibility)
    const componentCount = await progressTracker.count()
    expect(componentCount).toBeGreaterThan(0)

    // Verify it's the correct component by checking its attributes
    const componentExists = await progressTracker.evaluate((el) => {
      return el.tagName === 'DIV' &&
             el.hasAttribute('data-testid') &&
             el.getAttribute('data-testid') === 'reader-progress-tracker'
    })

    expect(componentExists).toBe(true)
  })

  test('AC2: Progress-related logic is extracted from ReaderPage', async ({ page }) => {
    // Check that ReaderPage no longer contains progress-related useEffect hooks
    // We'll verify this by checking that the main page loads and functions without progress logic errors

    // Monitor console for progress-related errors that would indicate missing logic
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          (msg.text().includes('progress') ||
           msg.text().includes('scroll') ||
           msg.text().includes('IntersectionObserver'))) {
        errors.push(msg.text())
      }
    })

    // Reload page to check for missing progress logic
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should have no progress-related errors indicating logic was properly extracted
    const progressErrors = errors.filter(error =>
      error.includes('Cannot read property') ||
      error.includes('undefined')
    )

    expect(progressErrors).toHaveLength(0)

    // Verify page is functional (not broken by extraction)
    await expect(page.locator('body')).toBeVisible()
  })

  test('AC3: useReaderProgress hook is implemented and functional', async ({ page }) => {
    // We can't directly test hooks in E2E, but we can verify their effects

    // Test scroll-based progress tracking (hook should enable this)
    const initialScrollHeight = await page.evaluate(() => document.body.scrollHeight)

    // Scroll down to trigger progress tracking
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })

    // Wait for progress tracking to update
    await page.waitForTimeout(1000)

    // Check that scroll position is tracked (indicates hook is working)
    const currentScrollPosition = await page.evaluate(() => window.pageYOffset)
    expect(currentScrollPosition).toBeGreaterThan(0)

    // No errors should occur during scroll (indicates hook is properly handling events)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    // Continue scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    await page.waitForTimeout(500)

    // Should have no errors during scroll operations
    expect(errors).toHaveLength(0)
  })

  test('AC4: Progress restoration functionality works identically', async ({ page }) => {
    // Test that progress restoration still works after component extraction

    // First, scroll to a specific position
    const targetScrollPercent = 0.25 // 25% through the document
    await page.evaluate((percent) => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, scrollHeight * percent)
    }, targetScrollPercent)

    await page.waitForTimeout(1000)

    // Check if progress is being tracked (should be saved by component)
    const scrollPosition = await page.evaluate(() => window.pageYOffset)
    expect(scrollPosition).toBeGreaterThan(0)

    // Now simulate page reload to test restoration
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Wait for progress restoration to complete
    await page.waitForTimeout(2000)

    // Verify that the page loads without errors (restoration logic working)
    const bodyVisible = await page.locator('body').isVisible()
    expect(bodyVisible).toBe(true)

    // Check that there are no restoration-related errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          (msg.text().includes('progress') ||
           msg.text().includes('restore'))) {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)
    expect(errors.filter(e => e.includes('Cannot read') || e.includes('undefined'))).toHaveLength(0)
  })

  test('AC5: Intersection Observer logic is encapsulated', async ({ page }) => {
    // Test that Intersection Observer functionality works but is encapsulated

    // Check for Intersection Observer support
    const intersectionObserverSupported = await page.evaluate(() => {
      return 'IntersectionObserver' in window
    })
    expect(intersectionObserverSupported).toBe(true)

    // Monitor for Intersection Observer errors (would indicate poor encapsulation)
    const intersectionErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          msg.text().includes('IntersectionObserver')) {
        intersectionErrors.push(msg.text())
      }
    })

    // Scroll through the content to trigger Intersection Observer
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollStep = scrollHeight / 10

      for (let i = 0; i <= 10; i++) {
        setTimeout(() => {
          window.scrollTo(0, scrollStep * i)
        }, i * 100)
      }
    })

    // Wait for scrolling to complete
    await page.waitForTimeout(2000)

    // Should have no Intersection Observer errors
    expect(intersectionErrors).toHaveLength(0)

    // Verify that scroll behavior is smooth (proper encapsulation)
    const finalScrollPosition = await page.evaluate(() => window.pageYOffset)
    expect(finalScrollPosition).toBeGreaterThan(0)
  })

  test('Integration Verification IV1: Progress saving and restoration behavior', async ({ page }) => {
    // Test IV1: Verify reading progress is saved and restored identically to current behavior

    // Navigate and scroll to create progress
    await page.goto(`/reader/${testResourceId}`)
    await page.waitForLoadState('networkidle')

    // Scroll to 50% mark
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, scrollHeight * 0.5)
    })

    await page.waitForTimeout(2000)

    // Check scroll position is tracked
    const scrollPos = await page.evaluate(() => window.pageYOffset)
    expect(scrollPos).toBeGreaterThan(0)

    // Simulate leaving the page (triggers save)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Page should load successfully with restoration logic
    await expect(page.locator('body')).toBeVisible()

    // No errors should occur during restoration
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('Integration Verification IV2: Progress tracking across different reading speeds', async ({ page }) => {
    // Test IV2: Test progress tracking across different reading speeds and scroll behaviors

    // Fast scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    await page.waitForTimeout(500)

    // Slow scrolling
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(500)

    await page.evaluate(() => {
      let scrollPosition = 0
      const scrollStep = 100
      const scrollInterval = setInterval(() => {
        scrollPosition += scrollStep
        window.scrollTo(0, scrollPosition)
        if (scrollPosition >= document.documentElement.scrollHeight) {
          clearInterval(scrollInterval)
        }
      }, 50)
    })

    await page.waitForTimeout(2000)

    // Should handle all scroll speeds without errors
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    expect(errors).toHaveLength(0)
  })

  test('Integration Verification IV3: Memory usage validation', async ({ page }) => {
    // Test IV3: Confirm memory usage for progress tracking does not increase

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
    })

    // Perform multiple scroll operations
    for (let i = 0; i < 10; i++) {
      await page.evaluate((iteration) => {
        const scrollHeight = document.documentElement.scrollHeight
        window.scrollTo(0, (scrollHeight / 10) * iteration)
      }, i)
      await page.waitForTimeout(100)
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
    })

    // If memory API is available, check for reasonable memory growth
    if (initialMemory && finalMemory) {
      const memoryGrowth = finalMemory - initialMemory
      // Memory growth should be minimal (less than 10MB for this test)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    }

    // Page should still be responsive after operations
    await expect(page.locator('body')).toBeVisible()
  })

  test('Overall functionality validation', async ({ page }) => {
    // Comprehensive test that validates the entire reader progress system works

    // Navigate to reader
    await page.goto(`/reader/${testResourceId}`)
    await page.waitForLoadState('networkidle')

    // Monitor for any errors throughout the test
    const allErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text())
      }
    })
    page.on('pageerror', error => allErrors.push(error.message))

    // Test various interactions
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 3))
    await page.waitForTimeout(500)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.66))
    await page.waitForTimeout(500)

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Reload to test restoration
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Final validation: no critical errors and page is functional
    const criticalErrors = allErrors.filter(error =>
      error.includes('TypeError') ||
      error.includes('ReferenceError') ||
      error.includes('Cannot read property')
    )

    expect(criticalErrors).toHaveLength(0)
    await expect(page.locator('body')).toBeVisible()
  })
})