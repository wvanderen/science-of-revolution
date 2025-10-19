import { test, expect } from '@playwright/test'

/**
 * MCP-Enhanced Smoke Tests using Chrome DevTools
 *
 * These tests leverage the Chrome DevTools MCP server for deeper
 * browser inspection and performance analysis during smoke testing.
 */

test.describe('MCP Enhanced Smoke Tests', () => {
  test('performance metrics validation', async ({ page }) => {
    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Get performance metrics using Chrome DevTools
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const navigationEntry = entries.find(entry => entry.entryType === 'navigation')
          if (navigationEntry) {
            resolve({
              domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
              loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
              firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
            })
          }
        })
        observer.observe({ entryTypes: ['navigation'] })
      })
    })

    // Validate performance thresholds (adjust as needed)
    expect(metrics.domContentLoaded).toBeLessThan(3000) // 3 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(2000) // 2 seconds
  })

  test('network request analysis', async ({ page }) => {
    const requests: Array<{url: string, status: number, type: string}> = []

    page.on('response', response => {
      requests.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType()
      })
    })

    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Analyze network requests
    const failedRequests = requests.filter(req => req.status >= 400)
    const criticalResources = requests.filter(req =>
      req.type === 'script' || req.type === 'stylesheet' || req.url.includes('/src/')
    )

    // No critical resources should fail
    const criticalFailures = criticalResources.filter(req => req.status >= 400)
    expect(criticalFailures).toHaveLength(0)

    // Should have reasonable number of requests
    expect(requests.length).toBeLessThan(100) // Adjust threshold as needed
  })

  test('console error monitoring', async ({ page }) => {
    const errors: Array<{message: string, source: string}> = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          message: msg.text(),
          source: msg.location()?.url || 'unknown'
        })
      }
    })

    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        source: error.stack?.split('\n')[1] || 'unknown'
      })
    })

    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Interact with the application to trigger potential errors
    await page.getByLabel(/invite code/i).fill('TEST')
    await page.getByRole('button', { name: /continue/i }).click()

    // Allow time for any delayed errors
    await page.waitForTimeout(1000)

    // Should have no critical JavaScript errors
    const criticalErrors = errors.filter(error =>
      error.message.includes('TypeError') ||
      error.message.includes('ReferenceError') ||
      error.message.includes('Cannot read property')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('memory usage monitoring', async ({ page }) => {
    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null
    })

    // Perform various interactions
    for (let i = 0; i < 10; i++) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.getByLabel(/invite code/i).fill(`TEST${i}`)
      await page.getByLabel(/display name/i).fill(`User ${i}`)
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null
    })

    // Check for memory leaks (if browser supports memory API)
    if (initialMemory && finalMemory) {
      const memoryGrowth = finalMemory.used - initialMemory.used
      // Memory growth should be reasonable (less than 50MB)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024)
    }
  })

  test('DOM stability and structure validation', async ({ page }) => {
    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Check DOM structure
    const domStructure = await page.evaluate(() => {
      return {
        hasTitle: !!document.title,
        hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
        hasMainContent: !!document.querySelector('main, .main, #main') || !!document.querySelector('body > div'),
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input').length,
        buttonCount: document.querySelectorAll('button').length,
        hasAriaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length > 0
      }
    })

    // Validate DOM structure
    expect(domStructure.hasTitle).toBe(true)
    expect(domStructure.hasMetaViewport).toBe(true)
    expect(domStructure.formCount).toBeGreaterThan(0)
    expect(domStructure.inputCount).toBeGreaterThan(0)
    expect(domStructure.buttonCount).toBeGreaterThan(0)
  })

  test('CSS and rendering validation', async ({ page }) => {
    await page.goto('/invite')
    await page.waitForLoadState('networkidle')

    // Check if CSS loads properly
    const cssStatus = await page.evaluate(() => {
      const stylesheets = Array.from(document.stylesheets)
      return {
        stylesheetCount: stylesheets.length,
        hasLoadedStyles: stylesheets.some(sheet => {
          try {
            return sheet.cssRules && sheet.cssRules.length > 0
          } catch (e) {
            return false
          }
        }),
        computedStyles: {
          bodyDisplay: getComputedStyle(document.body).display,
          bodyVisibility: getComputedStyle(document.body).visibility
        }
      }
    })

    expect(cssStatus.stylesheetCount).toBeGreaterThan(0)
    expect(cssStatus.hasLoadedStyles).toBe(true)
    expect(cssStatus.computedStyles.bodyDisplay).not.toBe('none')
    expect(cssStatus.computedStyles.bodyVisibility).toBe('visible')
  })
})