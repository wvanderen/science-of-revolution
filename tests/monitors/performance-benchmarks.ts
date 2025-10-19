/**
 * Performance Benchmarks for Progress Tracking Components
 *
 * This file provides benchmark utilities for measuring and validating the performance
 * of reader progress tracking components and related functionality.
 */

import { Page } from '@playwright/test'
import { createPerformanceMonitor, PerformanceMonitor } from './performance-monitor'
import { createMemoryMonitor, MemoryMonitor } from './memory-monitor'

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  iterations: number
  warmupIterations: number
  measureMemory: boolean
  measureFrameRate: boolean
  measureRendering: boolean
  timeout: number
}

/**
 * Component performance benchmark result
 */
export interface ComponentBenchmarkResult {
  componentName: string
  operation: string
  metrics: {
    averageTime: number
    minTime: number
    maxTime: number
    p95Time: number
    p99Time: number
    standardDeviation: number
  }
  memory?: {
    averageMemory: number
    peakMemory: number
    memoryGrowth: number
    leakScore: number
  }
  frameRate?: {
    averageFPS: number
    minFPS: number
    droppedFrames: number
  }
  validation: {
    passed: boolean
    thresholds: Array<{ metric: string; threshold: number; actual: number; passed: boolean }>
  }
}

/**
 * Progress tracking benchmark suite
 */
export class ProgressTrackingBenchmarks {
  private page: Page
  private performanceMonitor: PerformanceMonitor
  private memoryMonitor: MemoryMonitor

  constructor(page: Page) {
    this.page = page
    this.performanceMonitor = createPerformanceMonitor(page)
    this.memoryMonitor = createMemoryMonitor(page)
  }

  /**
   * Run comprehensive benchmarks for progress tracking components
   */
  async runAllBenchmarks(config: Partial<BenchmarkConfig> = {}): Promise<{
    results: ComponentBenchmarkResult[]
    summary: {
      totalBenchmarks: number
      passedBenchmarks: number
      failedBenchmarks: number
      overallScore: number
    }
  }> {
    const fullConfig: BenchmarkConfig = {
      iterations: 10,
      warmupIterations: 3,
      measureMemory: true,
      measureFrameRate: true,
      measureRendering: true,
      timeout: 30000,
      ...config
    }

    const results: ComponentBenchmarkResult[] = []

    // Progress tracker initialization benchmarks
    results.push(await this.benchmarkProgressTrackerInitialization(fullConfig))

    // Scroll event handling benchmarks
    results.push(await this.benchmarkScrollEventHandling(fullConfig))

    // Intersection Observer benchmarks
    results.push(await this.benchmarkIntersectionObserver(fullConfig))

    // Progress saving benchmarks
    results.push(await this.benchmarkProgressSaving(fullConfig))

    // Progress restoration benchmarks
    results.push(await this.benchmarkProgressRestoration(fullConfig))

    // Large document handling benchmarks
    results.push(await this.benchmarkLargeDocumentHandling(fullConfig))

    // Memory efficiency benchmarks
    results.push(await this.benchmarkMemoryEfficiency(fullConfig))

    // Component lifecycle benchmarks
    results.push(await this.benchmarkComponentLifecycle(fullConfig))

    // Calculate summary
    const passedBenchmarks = results.filter(r => r.validation.passed).length
    const overallScore = results.reduce((sum, r) => sum + this.calculateBenchmarkScore(r), 0) / results.length

    return {
      results,
      summary: {
        totalBenchmarks: results.length,
        passedBenchmarks,
        failedBenchmarks: results.length - passedBenchmarks,
        overallScore
      }
    }
  }

  /**
   * Benchmark progress tracker component initialization
   */
  private async benchmarkProgressTrackerInitialization(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Progress Tracker Initialization'
    const measurements: number[] = []

    // Warmup iterations
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.goto('/reader/test-resource-small-001')
      await this.page.waitForLoadState('networkidle')
      await this.page.evaluate(() => {
        const tracker = document.querySelector('[data-testid="reader-progress-tracker"]')
        if (tracker) tracker.remove()
      })
    }

    // Actual measurements
    for (let i = 0; i < config.iterations; i++) {
      await this.page.goto('/reader/test-resource-small-001')
      await this.page.waitForLoadState('networkidle')

      const startTime = Date.now()
      await this.page.waitForSelector('[data-testid="reader-progress-tracker"]', { state: 'attached' })
      const endTime = Date.now()

      measurements.push(endTime - startTime)

      // Clean up for next iteration
      await this.page.evaluate(() => {
        const tracker = document.querySelector('[data-testid="reader-progress-tracker"]')
        if (tracker) tracker.remove()
      })
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 1000, actual: metrics.averageTime, passed: metrics.averageTime <= 1000 },
      { metric: 'p95Time', threshold: 1500, actual: metrics.p95Time, passed: metrics.p95Time <= 1500 }
    ]

    return {
      componentName: 'ReaderProgressTracker',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark scroll event handling performance
   */
  private async benchmarkScrollEventHandling(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Scroll Event Handling'
    const measurements: number[] = []

    await this.page.goto('/reader/test-resource-medium-001')
    await this.page.waitForLoadState('networkidle')

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, 100)
        window.scrollTo(0, 0)
      })
    }

    // Measure scroll performance
    for (let i = 0; i < config.iterations; i++) {
      const scrollHeight = await this.page.evaluate(() => document.documentElement.scrollHeight)
      const scrollStep = scrollHeight / 10

      const startTime = Date.now()

      for (let j = 0; j <= 10; j++) {
        await this.page.evaluate((step) => {
          window.scrollTo(0, step)
        }, scrollStep * j)
        await this.page.waitForTimeout(50)
      }

      const endTime = Date.now()
      measurements.push(endTime - startTime)
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 3000, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 5000, actual: metrics.p95Time }
    ]

    return {
      componentName: 'ScrollEventHandler',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark Intersection Observer performance
   */
  private async benchmarkIntersectionObserver(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Intersection Observer Performance'
    const measurements: number[] = []

    await this.page.goto('/reader/test-resource-large-001')
    await this.page.waitForLoadState('networkidle')

    // Create test elements
    await this.page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'intersection-test-container'
      container.style.cssText = 'height: 200vh; position: relative;'

      for (let i = 0; i < 50; i++) {
        const element = document.createElement('div')
        element.className = 'intersection-target'
        element.style.cssText = `height: 100px; margin: 50px 0; background: lightgray;`
        element.textContent = `Section ${i + 1}`
        container.appendChild(element)
      }

      document.body.appendChild(container)
    })

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, 100)
        window.scrollTo(0, 0)
      })
    }

    // Measure intersection observer performance
    for (let i = 0; i < config.iterations; i++) {
      const startTime = Date.now()

      // Scroll through all elements
      await this.page.evaluate(() => {
        const container = document.getElementById('intersection-test-container')
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      })

      await this.page.waitForTimeout(2000)

      const endTime = Date.now()
      measurements.push(endTime - startTime)

      // Reset scroll position
      await this.page.evaluate(() => window.scrollTo(0, 0))
      await this.page.waitForTimeout(500)
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 4000, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 6000, actual: metrics.p95Time }
    ]

    return {
      componentName: 'IntersectionObserver',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark progress saving performance
   */
  private async benchmarkProgressSaving(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Progress Saving'
    const measurements: number[] = []

    await this.page.goto('/reader/test-resource-medium-001')
    await this.page.waitForLoadState('networkidle')

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, 200)
        window.scrollTo(0, 0)
      })
      await this.page.waitForTimeout(1000)
    }

    // Measure progress saving performance
    for (let i = 0; i < config.iterations; i++) {
      // Scroll to a position
      await this.page.evaluate(() => {
        window.scrollTo(0, 300)
      })
      await this.page.waitForTimeout(1000)

      // Trigger save (simulate page leave)
      const startTime = Date.now()
      await this.page.evaluate(() => {
        // Simulate the save operation that happens on page leave
        const event = new Event('beforeunload')
        window.dispatchEvent(event)
      })
      const endTime = Date.now()

      measurements.push(endTime - startTime)

      // Reset
      await this.page.reload()
      await this.page.waitForLoadState('networkidle')
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 500, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 1000, actual: metrics.p95Time }
    ]

    return {
      componentName: 'ProgressSaving',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark progress restoration performance
   */
  private async benchmarkProgressRestoration(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Progress Restoration'
    const measurements: number[] = []

    // Set up progress data first
    await this.page.goto('/reader/test-resource-medium-001')
    await this.page.waitForLoadState('networkidle')

    await this.page.evaluate(() => {
      localStorage.setItem('progress_test-resource-medium-001', JSON.stringify({
        scrollPercent: 0.5,
        lastPosition: { x: 0, y: 400 },
        timestamp: Date.now()
      }))
    })

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.reload()
      await this.page.waitForLoadState('networkidle')
      await this.page.waitForTimeout(2000)
    }

    // Measure restoration performance
    for (let i = 0; i < config.iterations; i++) {
      const startTime = Date.now()
      await this.page.goto('/reader/test-resource-medium-001')
      await this.page.waitForLoadState('networkidle')

      // Wait for restoration to complete
      await this.page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let lastScrollY = window.pageYOffset
          let stableCount = 0

          const checkStable = () => {
            const currentScrollY = window.pageYOffset
            if (Math.abs(currentScrollY - lastScrollY) < 1) {
              stableCount++
              if (stableCount >= 5) {
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

      const endTime = Date.now()
      measurements.push(endTime - startTime)
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 2000, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 3000, actual: metrics.p95Time }
    ]

    return {
      componentName: 'ProgressRestoration',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark large document handling
   */
  private async benchmarkLargeDocumentHandling(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Large Document Handling'
    const measurements: number[] = []

    await this.page.goto('/reader/test-doc-large-001')
    await this.page.waitForLoadState('networkidle')

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, 1000)
        window.scrollTo(0, 0)
      })
    }

    // Measure large document performance
    for (let i = 0; i < config.iterations; i++) {
      const startTime = Date.now()

      // Scroll through large document
      const scrollHeight = await this.page.evaluate(() => document.documentElement.scrollHeight)
      const scrollSteps = 20

      for (let j = 0; j <= scrollSteps; j++) {
        await this.page.evaluate((step, totalSteps, height) => {
          window.scrollTo(0, (height / totalSteps) * step)
        }, j, scrollSteps, scrollHeight)
        await this.page.waitForTimeout(100)
      }

      const endTime = Date.now()
      measurements.push(endTime - startTime)

      // Reset
      await this.page.evaluate(() => window.scrollTo(0, 0))
      await this.page.waitForTimeout(1000)
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 8000, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 12000, actual: metrics.p95Time }
    ]

    return {
      componentName: 'LargeDocumentHandler',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Benchmark memory efficiency
   */
  private async benchmarkMemoryEfficiency(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Memory Efficiency'
    const memoryMeasurements: number[] = []

    await this.page.goto('/reader/test-resource-large-001')
    await this.page.waitForLoadState('networkidle')

    // Start memory monitoring
    await this.memoryMonitor.startMonitoring({
      snapshotInterval: 500,
      monitoringDuration: 10000,
      enableDetailedTracking: true
    })

    // Perform memory-intensive operations
    for (let i = 0; i < config.iterations; i++) {
      // Scroll up and down multiple times
      await this.page.evaluate(async () => {
        const scrollHeight = document.documentElement.scrollHeight
        for (let j = 0; j < 5; j++) {
          window.scrollTo(0, scrollHeight * 0.8)
          await new Promise(resolve => setTimeout(resolve, 200))
          window.scrollTo(0, 0)
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      })
    }

    // Stop monitoring and get results
    const memoryResults = await this.memoryMonitor.stopMonitoring()
    memoryMeasurements.push(memoryResults.summary.averageMemory)

    const metrics = this.calculateMetrics(memoryMeasurements)
    const thresholds = [
      { metric: 'averageMemory', threshold: 100 * 1024 * 1024, actual: metrics.averageTime } // 100MB
    ]

    return {
      componentName: 'MemoryManager',
      operation,
      metrics: { ...metrics, averageTime: metrics.averageTime, minTime: metrics.minTime, maxTime: metrics.maxTime, p95Time: metrics.p95Time, p99Time: metrics.p99Time, standardDeviation: metrics.standardDeviation },
      memory: {
        averageMemory: memoryResults.summary.averageMemory,
        peakMemory: memoryResults.summary.peakMemory,
        memoryGrowth: memoryResults.analysis.memoryGrowth,
        leakScore: memoryResults.analysis.leakScore
      },
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold) && memoryResults.analysis.leakScore < 50,
        thresholds
      }
    }
  }

  /**
   * Benchmark component lifecycle performance
   */
  private async benchmarkComponentLifecycle(config: BenchmarkConfig): Promise<ComponentBenchmarkResult> {
    const operation = 'Component Lifecycle'
    const measurements: number[] = []

    for (let i = 0; i < config.iterations; i++) {
      await this.page.goto('/reader/test-resource-small-001')
      await this.page.waitForLoadState('networkidle')

      const startTime = Date.now()

      // Mount
      await this.page.evaluate(() => {
        const tracker = document.querySelector('[data-testid="reader-progress-tracker"]')
        if (tracker) {
          (tracker as any).mount?.()
        }
      })

      await this.page.waitForTimeout(100)

      // Update
      await this.page.evaluate(() => {
        window.scrollTo(0, 100)
      })

      await this.page.waitForTimeout(100)

      // Unmount
      await this.page.evaluate(() => {
        const tracker = document.querySelector('[data-testid="reader-progress-tracker"]')
        if (tracker) {
          (tracker as any).unmount?.()
        }
      })

      const endTime = Date.now()
      measurements.push(endTime - startTime)

      await this.page.reload()
      await this.page.waitForLoadState('networkidle')
    }

    const metrics = this.calculateMetrics(measurements)
    const thresholds = [
      { metric: 'averageTime', threshold: 1500, actual: metrics.averageTime },
      { metric: 'p95Time', threshold: 2500, actual: metrics.p95Time }
    ]

    return {
      componentName: 'ComponentLifecycle',
      operation,
      metrics,
      validation: {
        passed: thresholds.every(t => t.actual <= t.threshold),
        thresholds
      }
    }
  }

  /**
   * Calculate statistical metrics from measurements
   */
  private calculateMetrics(measurements: number[]) {
    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((a, b) => a + b, 0)
    const mean = sum / measurements.length

    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length
    const standardDeviation = Math.sqrt(variance)

    return {
      averageTime: mean,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      p95Time: sorted[Math.floor(sorted.length * 0.95)],
      p99Time: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation
    }
  }

  /**
   * Calculate benchmark score (0-100)
   */
  private calculateBenchmarkScore(result: ComponentBenchmarkResult): number {
    let score = 100

    // Deduct points for failed thresholds
    result.validation.thresholds.forEach(threshold => {
      if (!threshold.passed) {
        const ratio = threshold.actual / threshold.threshold
        score -= Math.min(50, (ratio - 1) * 100)
      }
    })

    // Deduct points for high variability
    const cv = result.metrics.standardDeviation / result.metrics.averageTime
    if (cv > 0.3) {
      score -= Math.min(30, (cv - 0.3) * 100)
    }

    return Math.max(0, Math.round(score))
  }
}

/**
 * Performance thresholds for benchmarks
 */
export const BENCHMARK_THRESHOLDS = {
  initialization: {
    averageTime: 1000,
    p95Time: 1500
  },
  scrollHandling: {
    averageTime: 3000,
    p95Time: 5000
  },
  intersectionObserver: {
    averageTime: 4000,
    p95Time: 6000
  },
  progressSaving: {
    averageTime: 500,
    p95Time: 1000
  },
  progressRestoration: {
    averageTime: 2000,
    p95Time: 3000
  },
  largeDocument: {
    averageTime: 8000,
    p95Time: 12000
  },
  memory: {
    maxAverageMB: 100,
    maxGrowthMB: 50,
    maxLeakScore: 50
  },
  lifecycle: {
    averageTime: 1500,
    p95Time: 2500
  }
}

/**
 * Factory function for creating benchmarks
 */
export function createProgressTrackingBenchmarks(page: Page): ProgressTrackingBenchmarks {
  return new ProgressTrackingBenchmarks(page)
}