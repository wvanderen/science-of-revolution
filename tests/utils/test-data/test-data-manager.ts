/**
 * Test Data Management Utilities for E2E Tests
 *
 * This file provides utilities for managing test data in E2E tests, including
 * setup, cleanup, and validation of test scenarios.
 */

import { Page } from '@playwright/test'
import { TestResourceFixture, TestProgressData } from '../../fixtures/resources/test-documents'
import { TestDataFactory } from '../../builders/test-data-builders'
import { scrollPositionTestDataGenerators } from '../../fixtures/scroll-positions'

/**
 * Test data manager for handling test fixtures and progress data
 */
export class TestDataManager {
  private static instance: TestDataManager
  private testResources: Map<string, TestResourceFixture> = new Map()
  private testProgressData: Map<string, TestProgressData[]> = new Map()

  private constructor() {
    this.initializeDefaultFixtures()
  }

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager()
    }
    return TestDataManager.instance
  }

  /**
   * Initialize default test fixtures
   */
  private initializeDefaultFixtures(): void {
    // Create default test resources
    const defaultResources = [
      ...TestDataFactory.createSizeVariationSet('Reader Progress'),
      ...TestDataFactory.createSizeVariationSet('Testing Documentation'),
      ...TestDataFactory.createSizeVariationSet('Technical Guide')
    ]

    defaultResources.forEach(resource => {
      this.testResources.set(resource.id, resource)
    })

    // Create progress data for each resource
    this.testResources.forEach((resource, resourceId) => {
      const progressData = [
        ...scrollPositionTestDataGenerators.generateScrollPositionTestData(resourceId),
        ...scrollPositionTestDataGenerators.generateEdgeCaseTestData(resourceId),
        ...scrollPositionTestDataGenerators.generateMultiDocumentProgressData([resourceId]),
        ...scrollPositionTestDataGenerators.generateTimeBasedProgressData(resourceId),
        ...scrollPositionTestDataGenerators.generateReadingSpeedTestData(resourceId),
        ...scrollPositionTestDataGenerators.generateDeviceSpecificProgressData(resourceId)
      ]
      this.testProgressData.set(resourceId, progressData)
    })
  }

  /**
   * Get a test resource by ID
   */
  getResource(resourceId: string): TestResourceFixture | undefined {
    return this.testResources.get(resourceId)
  }

  /**
   * Get all test resources
   */
  getAllResources(): TestResourceFixture[] {
    return Array.from(this.testResources.values())
  }

  /**
   * Get resources by size category
   */
  getResourcesBySize(size: 'small' | 'medium' | 'large'): TestResourceFixture[] {
    return this.getAllResources().filter(resource => resource.metadata.size === size)
  }

  /**
   * Get progress data for a specific resource
   */
  getProgressData(resourceId: string): TestProgressData[] {
    return this.testProgressData.get(resourceId) || []
  }

  /**
   * Get progress data for a specific user
   */
  getUserProgressData(userId: string): TestProgressData[] {
    const allProgressData: TestProgressData[] = []
    this.testProgressData.forEach(progressData => {
      allProgressData.push(...progressData.filter(data => data.userId === userId))
    })
    return allProgressData
  }

  /**
   * Add a custom test resource
   */
  addResource(resource: TestResourceFixture): void {
    this.testResources.set(resource.id, resource)

    // Generate progress data for the new resource
    const progressData = [
      ...scrollPositionTestDataGenerators.generateScrollPositionTestData(resource.id),
      ...scrollPositionTestDataGenerators.generateEdgeCaseTestData(resource.id)
    ]
    this.testProgressData.set(resource.id, progressData)
  }

  /**
   * Add custom progress data
   */
  addProgressData(resourceId: string, progressData: TestProgressData[]): void {
    const existingData = this.testProgressData.get(resourceId) || []
    this.testProgressData.set(resourceId, [...existingData, ...progressData])
  }

  /**
   * Clear all test data
   */
  clearAllData(): void {
    this.testResources.clear()
    this.testProgressData.clear()
  }

  /**
   * Get statistics about test data
   */
  getDataStatistics(): {
    totalResources: number
    totalProgressEntries: number
    resourcesBySize: Record<string, number>
    progressByStatus: Record<string, number>
  } {
    const resourcesBySize = { small: 0, medium: 0, large: 0 }
    const progressByStatus = { not_started: 0, in_progress: 0, completed: 0 }

    this.testResources.forEach(resource => {
      resourcesBySize[resource.metadata.size]++
    })

    this.testProgressData.forEach(progressData => {
      progressData.forEach(data => {
        progressByStatus[data.status]++
      })
    })

    return {
      totalResources: this.testResources.size,
      totalProgressEntries: Array.from(this.testProgressData.values())
        .reduce((total, data) => total + data.length, 0),
      resourcesBySize,
      progressByStatus
    }
  }
}

/**
 * E2E test helper for setting up test content
 */
export class E2ETestSetup {
  /**
   * Inject test content into a page
   */
  static async injectTestContent(page: Page, resource: TestResourceFixture): Promise<void> {
    await page.evaluate((content: string) => {
      // Remove any existing test content
      const existingTestContent = document.querySelector('#e2e-test-content')
      if (existingTestContent) {
        existingTestContent.remove()
      }

      // Create container for test content
      const container = document.createElement('div')
      container.id = 'e2e-test-content'
      container.style.cssText = `
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
        line-height: 1.6;
      `

      // Convert markdown-like content to HTML
      const htmlContent = content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')

      container.innerHTML = htmlContent
      document.body.appendChild(container)
    }, resource.content)
  }

  /**
   * Clear test content from a page
   */
  static async clearTestContent(page: Page): Promise<void> {
    await page.evaluate(() => {
      const testContent = document.querySelector('#e2e-test-content')
      if (testContent) {
        testContent.remove()
      }
    })
  }

  /**
   * Wait for reader progress component to be ready
   */
  static async waitForProgressComponent(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="reader-progress-tracker"]', {
      state: 'attached',
      timeout: 10000
    })
  }

  /**
   * Get current scroll position
   */
  static async getCurrentScrollPosition(page: Page): Promise<{ x: number; y: number; percent: number }> {
    return await page.evaluate(() => {
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = documentHeight > 0 ? scrollY / documentHeight : 0

      return { x: scrollX, y: scrollY, percent: scrollPercent }
    })
  }

  /**
   * Scroll to a specific percentage
   */
  static async scrollToPercentage(page: Page, percent: number): Promise<void> {
    await page.evaluate((targetPercent: number) => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const targetY = documentHeight * Math.max(0, Math.min(1, targetPercent))
      window.scrollTo(0, targetY)
    }, percent)

    // Wait for scroll to complete
    await page.waitForTimeout(500)
  }

  /**
   * Simulate reading behavior
   */
  static async simulateReading(
    page: Page,
    duration: number = 3000,
    scrollSteps: number = 5
  ): Promise<void> {
    const scrollInterval = duration / scrollSteps

    for (let i = 0; i <= scrollSteps; i++) {
      const targetPercent = i / scrollSteps
      await this.scrollToPercentage(page, targetPercent)
      await page.waitForTimeout(scrollInterval)
    }
  }
}

/**
 * Test data validation utilities
 */
export class TestDataValidator {
  /**
   * Validate that test data is consistent
   */
  static validateTestData(resource: TestResourceFixture, progressData: TestProgressData[]): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check that progress data references the correct resource
    progressData.forEach((data, index) => {
      if (data.resourceId !== resource.id) {
        errors.push(`Progress data ${index} references wrong resource: ${data.resourceId}`)
      }

      // Check scroll percent range
      if (data.scrollPercent < 0 || data.scrollPercent > 1) {
        errors.push(`Progress data ${index} has invalid scroll percent: ${data.scrollPercent}`)
      }

      // Check status consistency
      if (data.scrollPercent === 0 && data.status !== 'not_started') {
        errors.push(`Progress data ${index} has inconsistent status for 0% scroll`)
      }
      if (data.scrollPercent === 1 && data.status !== 'completed') {
        errors.push(`Progress data ${index} has inconsistent status for 100% scroll`)
      }
      if (data.scrollPercent > 0 && data.scrollPercent < 1 && data.status === 'not_started') {
        errors.push(`Progress data ${index} has inconsistent status for intermediate scroll`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate all test data in the manager
   */
  static validateAllTestData(): {
    isValid: boolean
    errors: string[]
  } {
    const manager = TestDataManager.getInstance()
    const allErrors: string[] = []
    let isValid = true

    manager.getAllResources().forEach(resource => {
      const progressData = manager.getProgressData(resource.id)
      const validation = this.validateTestData(resource, progressData)

      if (!validation.isValid) {
        isValid = false
        allErrors.push(`Resource ${resource.id}: ${validation.errors.join(', ')}`)
      }
    })

    return {
      isValid,
      errors: allErrors
    }
  }
}

/**
 * Export singleton instance and utilities
 */
export const testDataManager = TestDataManager.getInstance()
export { E2ETestSetup as TestSetup }
export { TestDataValidator as Validator }