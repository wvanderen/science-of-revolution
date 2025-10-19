# Intersection Observer Configuration Guide for Test Scenarios

## Overview

This guide provides detailed documentation for configuring and using Intersection Observer mocks in E2E tests for reader progress functionality. The Intersection Observer API is crucial for tracking viewport visibility and scroll-based progress updates.

## Table of Contents

1. [Intersection Observer Basics](#intersection-observer-basics)
2. [Mock Configuration](#mock-configuration)
3. [Test Scenarios](#test-scenarios)
4. [Advanced Configurations](#advanced-configurations)
5. [Performance Considerations](#performance-considerations)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Intersection Observer Basics

### What is Intersection Observer?

The Intersection Observer API provides a way to asynchronously observe changes in the intersection of a target element with an ancestor element or with a top-level document's viewport.

### Key Concepts

- **Target**: The element being observed
- **Root**: The element used as the viewport for checking visibility
- **Root Margin**: Margin around the root element to expand or shrink the intersection area
- **Threshold**: Array of intersection ratios (0-1) that trigger callbacks
- **Intersection Ratio**: Percentage of the target element that is visible

## Mock Configuration

### Basic Mock Setup

```typescript
import { createMockIntersectionObserver } from '../../tests/utils/test-data/intersection-observer-mocks'

// Create basic mock
const mockObserver = createMockIntersectionObserver(page)

// Initialize in page
await mockObserver.initialize()
```

### Configuration Options

```typescript
interface IntersectionObserverConfig {
  root?: string // CSS selector for root element
  rootMargin?: string // CSS margin syntax (e.g., '50px 0px')
  threshold?: number | number[] // Intersection ratio thresholds
  trackVisibility?: boolean // Enable visibility tracking
  delay?: number // Delay between callbacks
}
```

### Default Configuration

```typescript
const defaultConfig: IntersectionObserverConfig = {
  rootMargin: '0px',
  threshold: 0,
  trackVisibility: false,
  delay: 0
}
```

## Test Scenarios

### 1. Basic Intersection Detection

**Use Case**: Test that components detect when elements enter/leave viewport

```typescript
test('basic intersection detection', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page)
  await mockObserver.initialize()

  try {
    // Element initially not visible
    await mockObserver.simulateElementLeavesViewport('.content-section')

    // Element enters viewport
    await mockObserver.simulateElementEntersViewport('.content-section')

    // Element leaves viewport
    await mockObserver.simulateElementLeavesViewport('.content-section')

    // Verify component behavior
    const isVisible = await page.locator('.content-section').isVisible()
    expect(isVisible).toBe(true)
  } finally {
    await mockObserver.cleanup()
  }
})
```

### 2. Scroll-Based Progress Tracking

**Use Case**: Test progress updates as user scrolls through content

```typescript
test('scroll-based progress tracking', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page, {
    threshold: [0, 0.25, 0.5, 0.75, 1]
  })
  await mockObserver.initialize()

  try {
    // Simulate scrolling through sections
    await mockObserver.simulateScrollingWithIntersections([
      { scrollY: 0, visibleElements: ['#header', '#section-1'] },
      { scrollY: 500, visibleElements: ['#section-1', '#section-2'] },
      { scrollY: 1000, visibleElements: ['#section-2', '#section-3'] },
      { scrollY: 1500, visibleElements: ['#section-3', '#section-4'] },
      { scrollY: 2000, visibleElements: ['#section-4', '#footer'] }
    ])

    // Verify progress updates
    const progress = await page.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseFloat(progress)).toBeGreaterThan(0)
  } finally {
    await mockObserver.cleanup()
  }
})
```

### 3. Partial Intersection Testing

**Use Case**: Test behavior when elements are partially visible

```typescript
test('partial intersection behavior', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page, {
    threshold: [0.1, 0.5, 0.9]
  })
  await mockObserver.initialize()

  try {
    // Test different visibility levels
    await mockObserver.simulatePartialIntersection('.content-section', 0.1)
    await page.waitForTimeout(100)

    await mockObserver.simulatePartialIntersection('.content-section', 0.5)
    await page.waitForTimeout(100)

    await mockObserver.simulatePartialIntersection('.content-section', 0.9)
    await page.waitForTimeout(100)

    // Verify progress tracking at different visibility levels
    const isVisible = await page.locator('.content-section').isVisible()
    expect(isVisible).toBe(true)
  } finally {
    await mockObserver.cleanup()
  }
})
```

### 4. Root Margin Testing

**Use Case**: Test viewport expansion with root margins

```typescript
test('root margin expansion', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page, {
    rootMargin: '50px 0px', // 50px top and bottom margin
    threshold: 0
  })
  await mockObserver.initialize()

  try {
    // Element should be considered intersecting even when slightly outside viewport
    await mockObserver.simulatePartialIntersection('.content-section', 0.1)

    // Verify that progress updates trigger earlier due to root margin
    const progressUpdated = await page.locator('[data-testid="progress-updated"]').isVisible()
    expect(progressUpdated).toBe(true)
  } finally {
    await mockObserver.cleanup()
  }
})
```

### 5. Multiple Observers Testing

**Use Case**: Test interaction between multiple observers

```typescript
test('multiple observers interaction', async ({ page }) => {
  const progressObserver = createMockIntersectionObserver(page, {
    threshold: [0, 0.5, 1]
  })

  const visibilityObserver = createMockIntersectionObserver(page, {
    threshold: 0.1,
    rootMargin: '100px'
  })

  await progressObserver.initialize()
  await visibilityObserver.initialize()

  try {
    // Simulate element entering different observer zones
    await progressObserver.simulatePartialIntersection('.main-content', 0.5)
    await visibilityObserver.simulateElementEntersViewport('.main-content')

    // Verify both observers trigger appropriate behaviors
    const progressTracked = await page.locator('[data-testid="progress-tracked"]').isVisible()
    const visibilityTracked = await page.locator('[data-testid="visibility-tracked"]').isVisible()

    expect(progressTracked).toBe(true)
    expect(visibilityTracked).toBe(true)
  } finally {
    await progressObserver.cleanup()
    await visibilityObserver.cleanup()
  }
})
```

## Advanced Configurations

### 1. Dynamic Threshold Configuration

```typescript
// Configure different thresholds for different use cases
const readingProgressConfig = {
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1],
  rootMargin: '0px'
}

const lazyLoadConfig = {
  threshold: 0.1,
  rootMargin: '50px 0px' // Load when within 50px of viewport
}

const analyticsConfig = {
  threshold: [0, 1], // Only track when fully in or out of view
  rootMargin: '0px'
}
```

### 2. Viewport-Responsive Configuration

```typescript
// Configure based on viewport size
const viewport = page.viewportSize()
const isMobile = viewport!.width < 768

const mobileConfig = {
  threshold: [0, 0.33, 0.66, 1],
  rootMargin: '100px 0px' // Larger margins for mobile
}

const desktopConfig = {
  threshold: [0, 0.25, 0.5, 0.75, 1],
  rootMargin: '50px 0px'
}

const config = isMobile ? mobileConfig : desktopConfig
const mockObserver = createMockIntersectionObserver(page, config)
```

### 3. Content-Type Specific Configuration

```typescript
// Different configurations for different content types
const imageContentConfig = {
  threshold: 0.01, // Trigger as soon as any part is visible
  rootMargin: '200px 0px' // Early loading for images
}

const textContentConfig = {
  threshold: [0, 0.5, 1], // Track reading progress
  rootMargin: '0px'
}

const videoContentConfig = {
  threshold: 0.5, // Only when mostly visible
  rootMargin: '100px 0px'
}
```

## Performance Considerations

### 1. Observer Efficiency

```typescript
// Use appropriate threshold granularity
const efficientConfig = {
  threshold: [0, 0.5, 1], // Fewer thresholds = better performance
  rootMargin: '0px'
}

const detailedConfig = {
  threshold: Array.from({ length: 101 }, (_, i) => i / 100), // Very detailed
  rootMargin: '0px'
}
```

### 2. Debouncing Intersection Events

```typescript
// In your component code, debounce rapid intersection changes
const debouncedIntersectionHandler = debounce((entries) => {
  // Handle intersection changes
}, 100) // 100ms debounce
```

### 3. Cleanup Management

```typescript
// Always clean up observers to prevent memory leaks
test('proper cleanup', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page)
  await mockObserver.initialize()

  try {
    // Test operations
  } finally {
    // Always cleanup
    await mockObserver.cleanup()
  }
})
```

## Troubleshooting

### Common Issues

#### 1. Mock Not Working

**Problem**: Intersection Observer mock doesn't intercept real API calls

**Solution**: Ensure mock is initialized before any IntersectionObserver instances are created

```typescript
// Initialize mock immediately after page navigation
await page.goto('/reader/test-doc')
await mockObserver.initialize() // Initialize before component mounts
```

#### 2. Timing Issues

**Problem**: Intersection events don't trigger at expected times

**Solution**: Add appropriate delays and wait for stabilization

```typescript
await mockObserver.simulateElementEntersViewport('.target')
await page.waitForTimeout(500) // Allow time for callbacks to execute
```

#### 3. Element Not Found

**Problem**: Target element doesn't exist for intersection testing

**Solution**: Ensure element exists before simulating intersection

```typescript
const elementExists = await page.locator('.target').count() > 0
if (elementExists) {
  await mockObserver.simulateElementEntersViewport('.target')
}
```

#### 4. Multiple Observers Conflicting

**Problem**: Multiple observers interfere with each other

**Solution**: Use unique configurations and proper cleanup

```typescript
const observer1 = createMockIntersectionObserver(page, { threshold: [0, 1] })
const observer2 = createMockIntersectionObserver(page, { threshold: 0.5 })

// Use different observer IDs if needed
await observer1.initialize()
await observer2.initialize()
```

### Debug Tools

```typescript
// Enable debug logging for intersection observer
await page.evaluate(() => {
  window.DEBUG_INTERSECTION_OBSERVER = true
})

// Get observed elements
const observedElements = await mockObserver.getObservedElements()
console.log('Observed elements:', observedElements)

// Check for intersection observer support
const isSupported = await page.evaluate(() => 'IntersectionObserver' in window)
console.log('Intersection Observer supported:', isSupported)
```

## Best Practices

### 1. Configuration Guidelines

- **Use appropriate thresholds**: More granular thresholds = more callbacks = more overhead
- **Set reasonable root margins**: Larger margins catch intersections earlier but may be less precise
- **Consider content type**: Different content types benefit from different configurations

### 2. Test Organization

```typescript
test.describe('Intersection Observer Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
  })

  test.afterEach(async ({ page }) => {
    // Common cleanup
  })

  test('scenario 1', async ({ page }) => {
    // Specific test
  })
})
```

### 3. Error Handling

```typescript
try {
  await mockObserver.simulateElementEntersViewport('.target')
} catch (error) {
  console.error('Intersection simulation failed:', error)
  // Continue with test or handle appropriately
}
```

### 4. Performance Testing

```typescript
// Measure intersection observer performance
const startTime = Date.now()
await mockObserver.simulateScrollingWithIntersections(scrollSteps)
const endTime = Date.now()

console.log(`Intersection simulation took ${endTime - startTime}ms`)
```

### 5. Cross-Browser Considerations

```typescript
// Check for Intersection Observer support
const isSupported = await page.evaluate(() => 'IntersectionObserver' in window)
if (!isSupported) {
  // Skip test or use fallback behavior
  test.skip()
}
```

## Configuration Reference

### Complete Configuration Example

```typescript
const advancedConfig: IntersectionObserverConfig = {
  root: '#scroll-container', // Custom scroll container
  rootMargin: '50px 25px 50px 25px', // Top right bottom left
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1],
  trackVisibility: true, // Enable visibility tracking
  delay: 100 // Delay between callbacks
}

const mockObserver = createMockIntersectionObserver(page, advancedConfig)
```

### Environment-Specific Configurations

```typescript
const environments = {
  development: {
    threshold: [0, 0.5, 1],
    rootMargin: '0px'
  },
  testing: {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '50px 0px'
  },
  production: {
    threshold: [0, 0.1, 0.5, 0.9, 1],
    rootMargin: '25px 0px'
  }
}

const config = environments[process.env.NODE_ENV || 'development']
```

## Migration from Real Intersection Observer

When migrating from real Intersection Observer to mocks:

1. **Identify all Intersection Observer usage** in your codebase
2. **Create equivalent mock configurations** for each use case
3. **Update test expectations** to work with mock behavior
4. **Add cleanup** for mock observers
5. **Validate behavior** matches real implementation

### Migration Example

```typescript
// Before: Real Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Handle intersection
    }
  })
}, { threshold: 0.5 })

// After: Mock Intersection Observer in tests
const mockObserver = createMockIntersectionObserver(page, { threshold: 0.5 })
await mockObserver.initialize()
await mockObserver.simulatePartialIntersection('.target', 0.5)
```

## Integration with Existing Tests

### Updating Current Tests

1. **Add mock observer setup** to existing scroll tests
2. **Replace manual scroll simulation** with intersection-based simulation
3. **Add intersection-specific assertions**
4. **Include performance monitoring** for intersection events

### Example Test Update

```typescript
// Original test
test('scroll progress updates', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(1000)
  // Test progress
})

// Updated test with intersection observer
test('scroll progress updates with intersection observer', async ({ page }) => {
  const mockObserver = createMockIntersectionObserver(page, {
    threshold: [0, 0.5, 1]
  })
  await mockObserver.initialize()

  try {
    await mockObserver.simulateScrollingWithIntersections([
      { scrollY: 0, visibleElements: ['#section-1'] },
      { scrollY: 500, visibleElements: ['#section-1', '#section-2'] }
    ])

    // Test progress with intersection accuracy
    const progress = await page.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseFloat(progress)).toBeCloseTo(50, 1)
  } finally {
    await mockObserver.cleanup()
  }
})
```

This comprehensive guide should help you effectively configure and use Intersection Observer mocks in your E2E tests for reader progress functionality.