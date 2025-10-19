/**
 * Test Fixtures for Different Scroll Positions and Progress States
 *
 * This file provides scroll position fixtures for testing various reading progress
 * scenarios, including edge cases and typical user behaviors.
 */

import { TestProgressData } from './resources/test-documents'
import { TestProgressBuilder } from '../builders/test-data-builders'

/**
 * Scroll Position Test Scenarios
 * Each scenario represents a specific scroll position and user state
 */

export const scrollPositionFixtures: {
  scenario: string
  description: string
  scrollPercent: number
  expectedYPosition: number
  expectedStatus: 'not_started' | 'in_progress' | 'completed'
}[] = [
  {
    scenario: 'initial_load',
    description: 'User just opened the document',
    scrollPercent: 0,
    expectedYPosition: 0,
    expectedStatus: 'not_started'
  },
  {
    scenario: 'scrolled_past_header',
    description: 'User scrolled past the initial header',
    scrollPercent: 0.05,
    expectedYPosition: 50,
    expectedStatus: 'in_progress'
  },
  {
    scenario: 'first_quarter',
    description: 'User is 25% through the document',
    scrollPercent: 0.25,
    expectedYPosition: 250,
    expectedStatus: 'in_progress'
  },
  {
    scenario: 'halfway_point',
    description: 'User is exactly halfway through',
    scrollPercent: 0.5,
    expectedYPosition: 500,
    expectedStatus: 'in_progress'
  },
  {
    scenario: 'three_quarters',
    description: 'User is 75% through the document',
    scrollPercent: 0.75,
    expectedYPosition: 750,
    expectedStatus: 'in_progress'
  },
  {
    scenario: 'nearly_finished',
    description: 'User is almost at the end',
    scrollPercent: 0.95,
    expectedYPosition: 950,
    expectedStatus: 'in_progress'
  },
  {
    scenario: 'completed',
    description: 'User finished reading',
    scrollPercent: 1.0,
    expectedYPosition: 1000,
    expectedStatus: 'completed'
  }
]

/**
 * Edge Case Scroll Positions
 */
export const edgeCaseScrollFixtures: {
  scenario: string
  description: string
  scrollPercent: number
  specialNote: string
}[] = [
  {
    scenario: 'tiny_scroll',
    description: 'Minimal scroll movement',
    scrollPercent: 0.001,
    specialNote: 'Should still register as in_progress'
  },
  {
    scenario: 'just_before_completion',
    description: 'Almost but not quite finished',
    scrollPercent: 0.999,
    specialNote: 'Should remain in_progress'
  },
  {
    scenario: 'exact_boundary_1',
    description: 'First exact boundary point',
    scrollPercent: 0.33,
    specialNote: 'Test precise percentage calculations'
  },
  {
    scenario: 'exact_boundary_2',
    description: 'Second exact boundary point',
    scrollPercent: 0.66,
    specialNote: 'Test precise percentage calculations'
  }
]

/**
 * Generate progress data for scroll position testing
 */
export function generateScrollPositionTestData(
  resourceId: string,
  userId: string = 'test-scroll-user'
): TestProgressData[] {
  return scrollPositionFixtures.map(fixture =>
    new TestProgressBuilder()
      .withUserId(userId)
      .withResourceId(resourceId)
      .withScrollPercent(fixture.scrollPercent)
      .withLastPosition(0, fixture.expectedYPosition)
      .withReadingTime(Math.floor(fixture.scrollPercent * 20))
      .withStatus(fixture.expectedStatus)
      .withRandomTimestamp(Math.floor(Math.random() * 7))
      .build()
  )
}

/**
 * Generate edge case progress data
 */
export function generateEdgeCaseTestData(
  resourceId: string,
  userId: string = 'test-edge-user'
): TestProgressData[] {
  return edgeCaseScrollFixtures.map(fixture =>
    new TestProgressBuilder()
      .withUserId(userId)
      .withResourceId(resourceId)
      .withScrollPercent(fixture.scrollPercent)
      .withLastPosition(0, Math.floor(fixture.scrollPercent * 1000))
      .withReadingTime(Math.floor(fixture.scrollPercent * 25))
      .build()
  )
}

/**
 * Multi-document progress scenarios
 * Tests progress across multiple documents with different states
 */
export function generateMultiDocumentProgressData(
  resourceIds: string[],
  userId: string = 'test-multi-user'
): TestProgressData[] {
  const scenarios: TestProgressData[] = []

  resourceIds.forEach((resourceId, index) => {
    // Different users have different progress patterns
    const patterns = [
      // Pattern 1: Started but didn't get far
      { percent: 0.1, readingTime: 2, status: 'in_progress' as const },
      // Pattern 2: Made good progress
      { percent: 0.6, readingTime: 12, status: 'in_progress' as const },
      // Pattern 3: Nearly finished
      { percent: 0.9, readingTime: 18, status: 'in_progress' as const },
      // Pattern 4: Completed
      { percent: 1.0, readingTime: 20, status: 'completed' as const }
    ]

    const pattern = patterns[index % patterns.length]

    scenarios.push(
      new TestProgressBuilder()
        .withUserId(userId)
        .withResourceId(resourceId)
        .withScrollPercent(pattern.percent)
        .withLastPosition(0, Math.floor(pattern.percent * 1200))
        .withReadingTime(pattern.readingTime)
        .withStatus(pattern.status)
        .withRandomTimestamp(index + 1)
        .build()
    )
  })

  return scenarios
}

/**
 * Time-based progress scenarios
 * Test progress with different time gaps between reading sessions
 */
export function generateTimeBasedProgressData(
  resourceId: string,
  userId: string = 'test-time-user'
): TestProgressData[] {
  const now = new Date()

  return [
    // Recent activity (within last hour)
    new TestProgressBuilder()
      .withUserId(userId)
      .withResourceId(resourceId)
      .withScrollPercent(0.3)
      .withLastPosition(0, 300)
      .withReadingTime(6)
      .withTimestamp(new Date(now.getTime() - 30 * 60 * 1000).toISOString())
      .build(),

    // Yesterday's progress
    new TestProgressBuilder()
      .withUserId(userId)
      .withResourceId(resourceId)
      .withScrollPercent(0.15)
      .withLastPosition(0, 150)
      .withReadingTime(3)
      .withTimestamp(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .build(),

    // Week old progress
    new TestProgressBuilder()
      .withUserId(userId)
      .withResourceId(resourceId)
      .withScrollPercent(0.8)
      .withLastPosition(0, 800)
      .withReadingTime(16)
      .withTimestamp(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .build()
  ]
}

/**
 * Reading speed scenarios
 * Test progress data for different reading speeds and patterns
 */
export function generateReadingSpeedTestData(
  resourceId: string,
  userId: string = 'test-speed-user'
): TestProgressData[] {
  return [
    // Slow reader (100 words/minute)
    new TestProgressBuilder()
      .withUserId(`${userId}-slow`)
      .withResourceId(resourceId)
      .withScrollPercent(0.25)
      .withLastPosition(0, 250)
      .withReadingTime(10)
      .build(),

    // Average reader (200 words/minute)
    new TestProgressBuilder()
      .withUserId(`${userId}-average`)
      .withResourceId(resourceId)
      .withScrollPercent(0.5)
      .withLastPosition(0, 500)
      .withReadingTime(10)
      .build(),

    // Fast reader (400 words/minute)
    new TestProgressBuilder()
      .withUserId(`${userId}-fast`)
      .withResourceId(resourceId)
      .withScrollPercent(0.75)
      .withLastPosition(0, 750)
      .withReadingTime(7.5)
      .build()
  ]
}

/**
 * Device-specific progress scenarios
 * Test progress data from different device types (mobile, tablet, desktop)
 */
export function generateDeviceSpecificProgressData(
  resourceId: string,
  baseUserId: string = 'test-device-user'
): TestProgressData[] {
  return [
    // Mobile user (smaller viewport, more scrolling)
    new TestProgressBuilder()
      .withUserId(`${baseUserId}-mobile`)
      .withResourceId(resourceId)
      .withScrollPercent(0.4)
      .withLastPosition(0, 800) // Higher Y position due to smaller viewport
      .withReadingTime(8)
      .build(),

    // Tablet user (medium viewport)
    new TestProgressBuilder()
      .withUserId(`${baseUserId}-tablet`)
      .withResourceId(resourceId)
      .withScrollPercent(0.4)
      .withLastPosition(0, 600) // Medium Y position
      .withReadingTime(8)
      .build(),

    // Desktop user (larger viewport, less scrolling)
    new TestProgressBuilder()
      .withUserId(`${baseUserId}-desktop`)
      .withResourceId(resourceId)
      .withScrollPercent(0.4)
      .withLastPosition(0, 400) // Lower Y position due to larger viewport
      .withReadingTime(8)
      .build()
  ]
}

/**
 * Export all test data generation functions
 */
export const scrollPositionTestDataGenerators = {
  generateScrollPositionTestData,
  generateEdgeCaseTestData,
  generateMultiDocumentProgressData,
  generateTimeBasedProgressData,
  generateReadingSpeedTestData,
  generateDeviceSpecificProgressData
}