/**
 * Test Helpers for Progress Restoration Validation
 *
 * This file provides utilities for testing progress restoration functionality,
 * including validation of scroll position restoration and state management.
 */

import { Page } from '@playwright/test'
import { TestProgressData } from '../../fixtures/resources/test-documents'
import { TestSetup } from './test-data-manager'

/**
 * Progress restoration test result
 */
interface RestorationTestResult {
  success: boolean
  actualPosition: { x: number; y: number; percent: number }
  expectedPosition: { x: number; y: number; percent: number }
  positionError: number
  restorationTime: number
  errors: string[]
}

/**
 * Helper class for testing progress restoration
 */
export class ProgressRestorationHelper {
  /**
   * Test progress restoration from a specific progress state
   */
  static async testRestorationFromProgress(
    page: Page,
    progressData: TestProgressData,
    tolerance: number = 0.05 // 5% tolerance
  ): Promise<RestorationTestResult> {
    const errors: string[] = []
    const startTime = Date.now()

    try {
      // Navigate to the resource
      await page.goto(`/reader/${progressData.resourceId}`)
      await page.waitForLoadState('networkidle')

      // Wait for restoration to complete
      await this.waitForRestoration(page)

      // Get actual position after restoration
      const actualPosition = await TestSetup.getCurrentScrollPosition(page)
      const restorationTime = Date.now() - startTime

      // Calculate expected position
      const expectedPosition = {
        x: progressData.lastPosition?.x || 0,
        y: progressData.lastPosition?.y || 0,
        percent: progressData.scrollPercent
      }

      // Calculate position error
      const positionError = Math.abs(actualPosition.percent - expectedPosition.percent)

      // Validate restoration
      if (positionError > tolerance) {
        errors.push(`Position error ${positionError} exceeds tolerance ${tolerance}`)
      }

      // Check if restoration was successful
      const success = errors.length === 0 && positionError <= tolerance

      return {
        success,
        actualPosition,
        expectedPosition,
        positionError,
        restorationTime,
        errors
      }
    } catch (error) {
      errors.push(`Restoration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        success: false,
        actualPosition: { x: 0, y: 0, percent: 0 },
        expectedPosition: { x: 0, y: 0, percent: 0 },
        positionError: 1,
        restorationTime: Date.now() - startTime,
        errors
      }
    }
  }

  /**
   * Test restoration across multiple progress states
   */
  static async testMultipleRestorations(
    page: Page,
    progressDataArray: TestProgressData[]
  ): Promise<{ results: RestorationTestResult[]; summary: { success: number; failed: number; averageError: number } }> {
    const results: RestorationTestResult[] = []

    for (const progressData of progressDataArray) {
      const result = await this.testRestorationFromProgress(page, progressData)
      results.push(result)

      // Wait between tests to avoid interference
      await page.waitForTimeout(1000)
    }

    // Calculate summary
    const success = results.filter(r => r.success).length
    const failed = results.length - success
    const averageError = results.reduce((sum, r) => sum + r.positionError, 0) / results.length

    return {
      results,
      summary: { success, failed, averageError }
    }
  }

  /**
   * Test restoration with different page reload scenarios
   */
  static async testRestorationWithReloads(
    page: Page,
    progressData: TestProgressData,
    reloadCount: number = 3
  ): Promise<{ results: RestorationTestResult[]; consistent: boolean }> {
    const results: RestorationTestResult[] = []

    for (let i = 0; i < reloadCount; i++) {
      // First, navigate and scroll to create progress
      await page.goto(`/reader/${progressData.resourceId}`)
      await page.waitForLoadState('networkidle')

      // Scroll to target position
      await TestSetup.scrollToPercentage(page, progressData.scrollPercent)
      await page.waitForTimeout(2000) // Allow progress to be saved

      // Reload to test restoration
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Test restoration
      const result = await this.testRestorationFromProgress(page, progressData)
      results.push(result)

      // Wait between tests
      await page.waitForTimeout(1000)
    }

    // Check consistency across reloads
    const positionErrors = results.map(r => r.positionError)
    const maxError = Math.max(...positionErrors)
    const minError = Math.min(...positionErrors)
    const consistent = (maxError - minError) < 0.1 // Within 10% variation

    return { results, consistent }
  }

  /**
   * Test restoration across different browser sessions
   */
  static async testCrossSessionRestoration(
    page: Page,
    progressData: TestProgressData
  ): Promise<{ sessionResults: RestorationTestResult[]; consistent: boolean }> {
    const sessionResults: RestorationTestResult[] = []

    // Simulate multiple sessions by clearing storage and restoring
    for (let session = 0; session < 3; session++) {
      // Clear local storage to simulate new session
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Navigate and test restoration
      const result = await this.testRestorationFromProgress(page, progressData)
      sessionResults.push(result)

      // Wait between sessions
      await page.waitForTimeout(2000)
    }

    // Check consistency across sessions
    const positionErrors = sessionResults.map(r => r.positionError)
    const maxError = Math.max(...positionErrors)
    const minError = Math.min(...positionErrors)
    const consistent = (maxError - minError) < 0.15 // Within 15% variation

    return { sessionResults, consistent }
  }

  /**
   * Test restoration with device-specific viewports
   */
  static async testRestorationAcrossViewports(
    page: Page,
    progressData: TestProgressData,
    viewports: Array<{ width: number; height: number; name: string }>
  ): Promise<{ viewportResults: Array<{ viewport: string; result: RestorationTestResult }>; adaptive: boolean }> {
    const viewportResults: Array<{ viewport: string; result: RestorationTestResult }> = []

    for (const viewport of viewports) {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Test restoration
      const result = await this.testRestorationFromProgress(page, progressData)
      viewportResults.push({ viewport: viewport.name, result })

      // Wait between viewport tests
      await page.waitForTimeout(1000)
    }

    // Check if restoration adapts to different viewports
    const positionErrors = viewportResults.map(r => r.result.positionError)
    const adaptive = positionErrors.every(error => error < 0.2) // All within 20% tolerance

    return { viewportResults, adaptive }
  }

  /**
   * Test restoration performance
   */
  static async testRestorationPerformance(
    page: Page,
    progressData: TestProgressData,
    iterations: number = 10
  ): Promise<{ performanceMetrics: { minTime: number; maxTime: number; averageTime: number; p95Time: number } }> {
    const restorationTimes: number[] = []

    for (let i = 0; i < iterations; i++) {
      await page.goto(`/reader/${progressData.resourceId}`)
      await page.waitForLoadState('networkidle')

      const startTime = Date.now()
      await this.waitForRestoration(page)
      const restorationTime = Date.now() - startTime

      restorationTimes.push(restorationTime)

      // Wait between tests
      await page.waitForTimeout(500)
    }

    // Calculate performance metrics
    const sortedTimes = restorationTimes.sort((a, b) => a - b)
    const minTime = sortedTimes[0]
    const maxTime = sortedTimes[sortedTimes.length - 1]
    const averageTime = restorationTimes.reduce((sum, time) => sum + time, 0) / restorationTimes.length
    const p95Time = sortedTimes[Math.floor(sortedTimes.length * 0.95)]

    return {
      performanceMetrics: {
        minTime,
        maxTime,
        averageTime,
        p95Time
      }
    }
  }

  /**
   * Test restoration with invalid or corrupted progress data
   */
  static async testRestorationWithInvalidData(
    page: Page,
    resourceId: string
  ): Promise<{ invalidDataResults: Array<{ scenario: string; handled: boolean; error?: string }> }> {
    const invalidDataResults: Array<{ scenario: string; handled: boolean; error?: string }> = []

    const invalidScenarios = [
      {
        scenario: 'negative_scroll_percent',
        data: { scrollPercent: -0.1, lastPosition: { x: 0, y: -100 } }
      },
      {
        scenario: 'overflow_scroll_percent',
        data: { scrollPercent: 1.5, lastPosition: { x: 0, y: 99999 } }
      },
      {
        scenario: 'null_position',
        data: { scrollPercent: 0.5, lastPosition: null }
      },
      {
        scenario: 'undefined_position',
        data: { scrollPercent: 0.3, lastPosition: undefined }
      }
    ]

    for (const scenario of invalidScenarios) {
      try {
        // Inject invalid progress data into local storage
        await page.evaluate((data) => {
          localStorage.setItem(`progress_${resourceId}`, JSON.stringify(data))
        }, scenario.data)

        // Navigate and see how it's handled
        await page.goto(`/reader/${resourceId}`)
        await page.waitForLoadState('networkidle')

        // Check for errors
        const hasErrors = await page.evaluate(() => {
          return document.querySelector('[data-testid="error-message"]') !== null
        })

        invalidDataResults.push({
          scenario: scenario.scenario,
          handled: !hasErrors
        })
      } catch (error) {
        invalidDataResults.push({
          scenario: scenario.scenario,
          handled: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Clean up
      await page.evaluate(() => localStorage.clear())
      await page.waitForTimeout(1000)
    }

    return { invalidDataResults }
  }

  /**
   * Wait for restoration to complete
   */
  private static async waitForRestoration(page: Page, timeout: number = 5000): Promise<void> {
    try {
      // Wait for scroll position to stabilize (no more changes for 500ms)
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let lastScrollY = window.pageYOffset
          let stableCount = 0

          const checkStable = () => {
            const currentScrollY = window.pageYOffset
            if (Math.abs(currentScrollY - lastScrollY) < 1) {
              stableCount++
              if (stableCount >= 5) { // Stable for 5 checks
                resolve()
                return
              }
            } else {
              stableCount = 0
              lastScrollY = currentScrollY
            }
            setTimeout(checkStable, 100)
          }

          checkStable()
        })
      })

      // Additional wait for any restoration animations
      await page.waitForTimeout(500)
    } catch (error) {
      // If stabilization check fails, just wait a reasonable time
      await page.waitForTimeout(2000)
    }
  }

  /**
   * Validate restoration result against expected behavior
   */
  static validateRestorationResult(
    result: RestorationTestResult,
    tolerance: number = 0.05
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!result.success) {
      issues.push('Restoration was not successful')
    }

    if (result.positionError > tolerance) {
      issues.push(`Position error ${result.positionError} exceeds tolerance ${tolerance}`)
    }

    if (result.restorationTime > 5000) {
      issues.push(`Restoration time ${result.restorationTime}ms exceeds acceptable threshold`)
    }

    if (result.errors.length > 0) {
      issues.push(`Errors occurred: ${result.errors.join(', ')}`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

/**
 * Convenience function for running comprehensive restoration tests
 */
export async function runComprehensiveRestorationTests(
  page: Page,
  testResourceIds: string[]
): Promise<{
  summary: {
    totalTests: number
    successfulTests: number
    averageRestorationTime: number
    averagePositionError: number
    issues: string[]
  }
  detailedResults: any
}> {
  const testDataManager = require('./test-data-manager').testDataManager
  const allResults: any[] = {}
  let totalTests = 0
  let successfulTests = 0
  let totalRestorationTime = 0
  let totalPositionError = 0
  const issues: string[] = []

  for (const resourceId of testResourceIds) {
    const progressData = testDataManager.getProgressData(resourceId).slice(0, 3) // Test first 3 progress states

    // Test multiple restorations
    const multiResult = await ProgressRestorationHelper.testMultipleRestorations(page, progressData)
    allResults[`${resourceId}_multiple`] = multiResult

    // Test with reloads
    const reloadResult = await ProgressRestorationHelper.testRestorationWithReloads(page, progressData[0])
    allResults[`${resourceId}_reloads`] = reloadResult

    // Test performance
    const perfResult = await ProgressRestorationHelper.testRestorationPerformance(page, progressData[0])
    allResults[`${resourceId}_performance`] = perfResult

    // Aggregate metrics
    totalTests += multiResult.results.length + reloadResult.results.length
    successfulTests += multiResult.results.filter(r => r.success).length + reloadResult.results.filter(r => r.success).length

    const allTimes = [...multiResult.results.map(r => r.restorationTime), ...reloadResult.results.map(r => r.restorationTime)]
    const allErrors = [...multiResult.results.map(r => r.positionError), ...reloadResult.results.map(r => r.positionError)]

    totalRestorationTime += allTimes.reduce((sum, time) => sum + time, 0)
    totalPositionError += allErrors.reduce((sum, error) => sum + error, 0)
  }

  return {
    summary: {
      totalTests,
      successfulTests,
      averageRestorationTime: totalRestorationTime / totalTests,
      averagePositionError: totalPositionError / totalTests,
      issues
    },
    detailedResults: allResults
  }
}