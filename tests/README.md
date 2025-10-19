# Testing Guide

## Overview
This project uses Vitest for unit/integration tests and Playwright for E2E tests.

## Unit Tests (Vitest)

### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run in watch mode
npm test -- --watch
```

### Writing Unit Tests
- Place tests in `__tests__` directories next to the code they test
- Use `.test.ts` or `.test.tsx` extensions
- Mock external dependencies using `vi.hoisted()` for proper hoisting

Example:
```typescript
import { renderHook } from '@testing-library/react'
import { myHook } from '../myHook'

describe('myHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => myHook())
    expect(result.current).toBe('expected')
  })
})
```

## E2E Tests (Playwright)

### Running E2E Tests
E2E tests require the dev server to be running:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e

# Run in UI mode for debugging
npx playwright test --ui

# Run specific test
npx playwright test session-smoke

# Run tests with performance monitoring
npx playwright test --grep "performance"

# Run tests with database seeding
SEED_TEST_DATA=true npm run test:e2e
```

### Auto-start Dev Server (Optional)
Uncomment the `webServer` configuration in `playwright.config.ts` to automatically start the dev server when running E2E tests.

### Writing E2E Tests
- Place E2E tests in `tests/e2e/`
- Use `.spec.ts` extension
- Follow Playwright best practices for selectors
- Use the new test infrastructure for reader progress testing

### Reader Progress Testing Infrastructure

This project includes comprehensive E2E test infrastructure for reader progress functionality:

#### Test Fixtures and Data Management
```typescript
import { testDataManager, TestSetup } from '../utils/test-data/test-data-manager'

// Get test resources
const mediumDoc = testDataManager.getResource('test-doc-medium-001')

// Inject test content
await TestSetup.injectTestContent(page, mediumDoc)

// Wait for progress component
await TestSetup.waitForProgressComponent(page)
```

#### Performance Monitoring
```typescript
import { createPerformanceMonitor, createMemoryMonitor } from '../monitors'

// Monitor performance
const perfMonitor = createPerformanceMonitor(page)
await perfMonitor.startMonitoring()

// Monitor memory usage
const memMonitor = createMemoryMonitor(page)
await memMonitor.startMonitoring()

// Get results
const perfResults = await perfMonitor.stopMonitoring()
const memResults = await memMonitor.stopMonitoring()
```

#### Progress Restoration Testing
```typescript
import { ProgressRestorationHelper } from '../utils/test-data/progress-restoration-helpers'

// Test restoration
const result = await ProgressRestorationHelper.testRestorationFromProgress(
  page,
  progressData,
  0.05 // 5% tolerance
)
```

#### Intersection Observer Testing
```typescript
import { createMockIntersectionObserver } from '../utils/test-data/intersection-observer-mocks'

// Create mock observer
const mockObserver = createMockIntersectionObserver(page, {
  threshold: [0, 0.5, 1],
  rootMargin: '50px 0px'
})
await mockObserver.initialize()

// Simulate intersection events
await mockObserver.simulateElementEntersViewport('.content-section')
await mockObserver.simulateScrollingWithIntersections(scrollSteps)

// Cleanup
await mockObserver.cleanup()
```

### Test Development Guidelines

#### 1. Test Structure
```typescript
import { test, expect } from '@playwright/test'
import {
  testDataManager,
  TestSetup,
  createPerformanceMonitor,
  ProgressRestorationHelper
} from '../../utils/test-data/test-data-manager'

test.describe('Reader Progress Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and monitoring
    const testDoc = testDataManager.getResource('test-doc-medium-001')
    if (testDoc) {
      await TestSetup.injectTestContent(page, testDoc)
    }
    await TestSetup.waitForProgressComponent(page)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    await TestSetup.clearTestContent(page)
  })

  test('progress tracking works correctly', async ({ page }) => {
    // Test implementation
  })
})
```

#### 2. Performance Testing
```typescript
test('performance - scroll responsiveness', async ({ page }) => {
  const perfMonitor = createPerformanceMonitor(page)
  await perfMonitor.startMonitoring()

  try {
    // Perform scroll operations
    await TestSetup.simulateReading(page, 5000, 10)

    // Validate performance
    const results = await perfMonitor.stopMonitoring()
    expect(results.summary.memoryAnalysis.memoryGrowth).toBeLessThan(50 * 1024 * 1024)
  } finally {
    await perfMonitor.stopMonitoring()
  }
})
```

#### 3. Progress Restoration Testing
```typescript
test('progress restoration accuracy', async ({ page }) => {
  const progressData = testDataManager.getProgressData('test-doc-medium-001')[0]

  const result = await ProgressRestorationHelper.testRestorationFromProgress(
    page,
    progressData,
    0.05 // 5% tolerance
  )

  expect(result.success).toBe(true)
  expect(result.positionError).toBeLessThan(0.05)
})
```

#### 4. Cross-Device Testing
```typescript
const devices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'iPad', viewport: { width: 768, height: 1024 } },
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } }
]

devices.forEach(device => {
  test(`progress tracking on ${device.name}`, async ({ page }) => {
    await page.setViewportSize(device.viewport)
    // Test implementation
  })
})
```

#### 5. Database Integration Testing
```typescript
test('database progress persistence', async ({ page }) => {
  // Seed test data
  const seeder = createProgressTestSeeder({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    cleanupBeforeSeeding: true
  })

  const seedingResult = await seeder.seed()
  expect(seedingResult.success).toBe(true)

  // Test database interaction
  // ...
})
```

### Best Practices

#### 1. Use Test Data Management
- Always use `testDataManager` for consistent test data
- Validate test data before using
- Clean up test data after tests

#### 2. Include Performance Monitoring
- Monitor memory usage for potential leaks
- Measure scroll performance
- Validate against performance thresholds

#### 3. Test Edge Cases
- Test with different document sizes
- Test various scroll positions
- Test restoration from different states
- Test across different viewports

#### 4. Handle Cleanup Properly
```typescript
test('example test', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page)
  const perfMonitor = createPerformanceMonitor(page)

  try {
    await mockObserver.initialize()
    await perfMonitor.startMonitoring()

    // Test operations

  } finally {
    await mockObserver.cleanup()
    await perfMonitor.stopMonitoring()
  }
})
```

#### 5. Use Appropriate Timeouts
- Use `waitForSelector` instead of fixed timeouts where possible
- Consider different performance characteristics across environments
- Use retry logic for flaky operations

### Debugging

#### 1. Enable Debug Logging
```typescript
// Enable test infrastructure debugging
process.env.DEBUG_E2E_TESTS = 'true'

// Enable performance debugging
await page.evaluate(() => {
  window.DEBUG_PERFORMANCE = true
})
```

#### 2. Performance Analysis
```typescript
// Export performance data for analysis
const perfData = perfMonitor.exportMetrics()
console.log('Performance summary:', perfData.summary)

// Memory leak detection
const memResults = await memMonitor.stopMonitoring()
if (memResults.analysis.hasLeaks) {
  console.warn('Memory leaks detected:', memResults.analysis.patterns)
}
```

#### 3. Test Data Inspection
```typescript
// Inspect test data
const allResources = testDataManager.getAllResources()
const progressData = testDataManager.getProgressData('resource-id')
const stats = testDataManager.getDataStatistics()

console.log('Test resources:', allResources.length)
console.log('Progress entries:', progressData.length)
```

### Environment Configuration

#### Development
```typescript
// More lenient thresholds for development
const validator = createPerformanceThresholdValidator('development')
```

#### CI/CD
```typescript
// Strict thresholds for CI
const validator = createPerformanceThresholdValidator('ci')
```

#### Production Testing
```typescript
// Production-like configuration
const validator = createPerformanceThresholdValidator('production')
```

### Additional Resources

- [E2E Test Infrastructure Usage Guide](../../docs/stories/E2E-Test-Infrastructure-Usage-Guide.md)
- [Intersection Observer Configuration Guide](../../docs/stories/Intersection-Observer-Configuration-Guide.md)
- [Playwright Documentation](https://playwright.dev/)
- [Performance Testing Best Practices](https://web.dev/performance/)

## Test Coverage

### Current Coverage
- Auth flows: ✓ useSession hook, invite gate page
- E2E smoke tests: ✓ invite portal, protected routes, form validation

### Coverage Goals
- Unit/integration tests: ≥70% for core modules
- E2E tests: smoke tests for critical user journeys

## CI/CD
Tests are configured to run in CI with:
- Retries enabled (2 retries in CI)
- Screenshots on failure
- HTML report generation

## Debugging
- Use `screen.debug()` in React Testing Library tests
- Use `--debug` flag with Playwright: `npx playwright test --debug`
- Check test artifacts in `test-results/` and `playwright-report/`
