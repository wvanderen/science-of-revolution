/**
 * Performance Measurement Utilities for Large Document Tests
 *
 * This file provides utilities for monitoring performance during E2E tests,
 * including memory usage, scroll performance, and component metrics.
 */

import { Page } from '@playwright/test'

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: number
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  scroll?: {
    frameRate: number
    scrollHeight: number
    scrollTop: number
    scrollTime: number
  }
  rendering?: {
    firstContentfulPaint?: number
    largestContentfulPaint?: number
    cumulativeLayoutShift?: number
    firstInputDelay?: number
  }
  custom?: Record<string, number>
}

/**
 * Memory monitoring configuration
 */
export interface MemoryMonitoringConfig {
  intervalMs: number
  maxDuration: number
  includeDetails: boolean
  trackLeaks: boolean
}

/**
 * Scroll performance configuration
 */
export interface ScrollPerformanceConfig {
  scrollSteps: number
  stepDuration: number
  measureFrameRate: boolean
  measureScrollTime: boolean
}

/**
 * Performance monitor for E2E tests
 */
export class PerformanceMonitor {
  private page: Page
  private metrics: PerformanceMetrics[] = []
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout
  private startTime = 0

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(config: MemoryMonitoringConfig = {
    intervalMs: 1000,
    maxDuration: 60000,
    includeDetails: true,
    trackLeaks: true
  }): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Monitoring is already active')
    }

    this.isMonitoring = true
    this.startTime = Date.now()
    this.metrics = []

    // Initialize performance monitoring in the page
    await this.page.evaluate(() => {
      // Ensure performance APIs are available
      if (!(performance as any).memory) {
        console.warn('Memory API not available in this browser')
      }

      // Enable performance observer if available
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(window as any).performanceEntries) {
                (window as any).performanceEntries = []
              }
              (window as any).performanceEntries.push(entry)
            }
          })
          observer.observe({ entryTypes: ['paint', 'layout-shift', 'largest-contentful-paint', 'first-input'] })
          ;(window as any).performanceObserver = observer
        } catch (error) {
          console.warn('Performance observer setup failed:', error)
        }
      }
    })

    // Start monitoring interval
    this.monitoringInterval = setInterval(async () => {
      const metrics = await this.collectMetrics(config.includeDetails)
      this.metrics.push(metrics)

      // Check if we've exceeded max duration
      if (Date.now() - this.startTime > config.maxDuration) {
        await this.stopMonitoring()
      }
    }, config.intervalMs)
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring(): Promise<PerformanceMetrics[]> {
    if (!this.isMonitoring) {
      return this.metrics
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    // Collect final metrics
    const finalMetrics = await this.collectMetrics(true)
    this.metrics.push(finalMetrics)

    return this.metrics
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(includeDetails: boolean = false): Promise<PerformanceMetrics> {
    return await this.page.evaluate((detailed: boolean) => {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now()
      }

      // Memory metrics
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        metrics.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      }

      // Scroll metrics
      metrics.scroll = {
        frameRate: 0, // Will be calculated separately
        scrollHeight: document.documentElement.scrollHeight,
        scrollTop: window.pageYOffset,
        scrollTime: 0 // Will be calculated during scroll operations
      }

      // Rendering metrics
      if (detailed && (window as any).performanceEntries) {
        const entries = (window as any).performanceEntries as PerformanceEntry[]

        const paintEntries = entries.filter(e => e.entryType === 'paint')
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint')
        const lcpEntries = entries.filter(e => e.entryType === 'largest-contentful-paint')
        const lcpEntry = lcpEntries[lcpEntries.length - 1]
        const clsEntries = entries.filter(e => e.entryType === 'layout-shift')
        const fidEntries = entries.filter(e => e.entryType === 'first-input')

        metrics.rendering = {
          firstContentfulPaint: fcpEntry?.startTime,
          largestContentfulPaint: lcpEntry?.startTime,
          cumulativeLayoutShift: clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0),
          firstInputDelay: fidEntries[0] ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : undefined
        }
      }

      return metrics
    }, includeDetails)
  }

  /**
   * Monitor performance during scroll operation
   */
  async monitorScrollPerformance(
    scrollConfig: ScrollPerformanceConfig = {
      scrollSteps: 10,
      stepDuration: 500,
      measureFrameRate: true,
      measureScrollTime: true
    }
  ): Promise<{
    scrollMetrics: PerformanceMetrics[]
    averageFrameRate: number
    averageScrollTime: number
    totalScrollTime: number
  }> {
    const scrollMetrics: PerformanceMetrics[] = []
    const frameRates: number[] = []
    const scrollTimes: number[] = []

    const documentHeight = await this.page.evaluate(() => document.documentElement.scrollHeight)
    const scrollStep = documentHeight / scrollConfig.scrollSteps

    for (let i = 0; i <= scrollConfig.scrollSteps; i++) {
      const scrollStartTime = Date.now()
      const targetScrollY = scrollStep * i

      // Scroll to position
      await this.page.evaluate((scrollY) => {
        window.scrollTo(0, scrollY)
      }, targetScrollY)

      // Measure scroll time
      if (scrollConfig.measureScrollTime) {
        const scrollEndTime = await this.page.evaluate(() => {
          return new Promise<number>((resolve) => {
            let lastScrollY = window.pageYOffset
            let stableCount = 0

            const checkScrollComplete = () => {
              const currentScrollY = window.pageYOffset
              if (Math.abs(currentScrollY - lastScrollY) < 1) {
                stableCount++
                if (stableCount >= 3) {
                  resolve(Date.now())
                  return
                }
              } else {
                stableCount = 0
                lastScrollY = currentScrollY
              }
              requestAnimationFrame(checkScrollComplete)
            }
            requestAnimationFrame(checkScrollComplete)
          })
        })

        scrollTimes.push(scrollEndTime - scrollStartTime)
      }

      // Measure frame rate if requested
      if (scrollConfig.measureFrameRate) {
        const frameRate = await this.measureFrameRate(1000) // Measure over 1 second
        frameRates.push(frameRate)
      }

      // Collect metrics
      const metrics = await this.collectMetrics(true)
      if (metrics.scroll) {
        metrics.scroll.scrollTime = scrollTimes[scrollTimes.length - 1] || 0
      }
      scrollMetrics.push(metrics)

      // Wait between scroll steps
      await this.page.waitForTimeout(scrollConfig.stepDuration)
    }

    return {
      scrollMetrics,
      averageFrameRate: frameRates.length > 0 ? frameRates.reduce((sum, fr) => sum + fr, 0) / frameRates.length : 0,
      averageScrollTime: scrollTimes.length > 0 ? scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length : 0,
      totalScrollTime: scrollTimes.reduce((sum, time) => sum + time, 0)
    }
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage(): {
    peakMemory: number
    averageMemory: number
    memoryGrowth: number
    potentialLeaks: boolean
    memoryEfficiency: number
  } {
    const memoryMetrics = this.metrics.filter(m => m.memory).map(m => m.memory!)

    if (memoryMetrics.length === 0) {
      return {
        peakMemory: 0,
        averageMemory: 0,
        memoryGrowth: 0,
        potentialLeaks: false,
        memoryEfficiency: 0
      }
    }

    const memoryUsage = memoryMetrics.map(m => m.usedJSHeapSize)
    const peakMemory = Math.max(...memoryUsage)
    const averageMemory = memoryUsage.reduce((sum, usage) => sum + usage, 0) / memoryUsage.length
    const initialMemory = memoryUsage[0]
    const finalMemory = memoryUsage[memoryUsage.length - 1]
    const memoryGrowth = finalMemory - initialMemory

    // Check for potential memory leaks (growth > 50MB or continuous growth pattern)
    const potentialLeaks = memoryGrowth > 50 * 1024 * 1024 || this.detectContinuousGrowth(memoryUsage)

    // Memory efficiency (lower is better)
    const memoryEfficiency = averageMemory / 1024 / 1024 // MB

    return {
      peakMemory,
      averageMemory,
      memoryGrowth,
      potentialLeaks,
      memoryEfficiency
    }
  }

  /**
   * Detect continuous memory growth pattern
   */
  private detectContinuousGrowth(memoryUsage: number[]): boolean {
    if (memoryUsage.length < 10) return false

    let growthCount = 0
    for (let i = 1; i < memoryUsage.length; i++) {
      if (memoryUsage[i] > memoryUsage[i - 1]) {
        growthCount++
      }
    }

    // If more than 80% of measurements show growth, it's concerning
    return growthCount / (memoryUsage.length - 1) > 0.8
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    duration: number
    memoryAnalysis: ReturnType<PerformanceMonitor['analyzeMemoryUsage']>
    totalMeasurements: number
    averageInterval: number
    detailedMetrics: PerformanceMetrics[]
  } {
    const duration = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp : 0
    const memoryAnalysis = this.analyzeMemoryUsage()

    return {
      duration,
      memoryAnalysis,
      totalMeasurements: this.metrics.length,
      averageInterval: this.metrics.length > 1 ? duration / (this.metrics.length - 1) : 0,
      detailedMetrics: this.metrics
    }
  }

  /**
   * Measure frame rate
   */
  private async measureFrameRate(duration: number): Promise<number> {
    return await this.page.evaluate((testDuration: number) => {
      return new Promise<number>((resolve) => {
        let frameCount = 0
        let startTime = performance.now()

        function countFrames() {
          frameCount++
          const currentTime = performance.now()
          if (currentTime - startTime >= testDuration) {
            resolve(frameCount / (testDuration / 1000)) // FPS
          } else {
            requestAnimationFrame(countFrames)
          }
        }

        requestAnimationFrame(countFrames)
      })
    }, duration)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    summary: ReturnType<PerformanceMonitor['getPerformanceSummary']>
    detailedMetrics: PerformanceMetrics[]
  } {
    return {
      summary: this.getPerformanceSummary(),
      detailedMetrics: this.metrics
    }
  }

  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metrics = []
    this.startTime = 0
  }
}

/**
 * Performance thresholds for validation
 */
export const PERFORMANCE_THRESHOLDS = {
  memory: {
    maxGrowthMB: 50,
    maxAverageMB: 100,
    maxPeakMB: 200
  },
  scroll: {
    minFrameRate: 30,
    maxScrollTime: 500,
    maxTotalScrollTime: 5000
  },
  rendering: {
    maxFirstContentfulPaint: 2000,
    maxLargestContentfulPaint: 3000,
    maxCumulativeLayoutShift: 0.1,
    maxFirstInputDelay: 100
  }
}

/**
 * Performance validation utility
 */
export class PerformanceValidator {
  /**
   * Validate performance metrics against thresholds
   */
  static validatePerformance(
    performanceData: ReturnType<PerformanceMonitor['exportMetrics']>
  ): {
    isValid: boolean
    violations: Array<{ category: string; threshold: string; actual: number; expected: number }>
    warnings: Array<{ category: string; message: string }>
  } {
    const violations: Array<{ category: string; threshold: string; actual: number; expected: number }> = []
    const warnings: Array<{ category: string; message: string }> = []

    const { memoryAnalysis, detailedMetrics } = performanceData.summary

    // Memory validation
    if (memoryAnalysis.memoryGrowth > PERFORMANCE_THRESHOLDS.memory.maxGrowthMB * 1024 * 1024) {
      violations.push({
        category: 'memory',
        threshold: 'maxGrowthMB',
        actual: memoryAnalysis.memoryGrowth / 1024 / 1024,
        expected: PERFORMANCE_THRESHOLDS.memory.maxGrowthMB
      })
    }

    if (memoryAnalysis.averageMemory > PERFORMANCE_THRESHOLDS.memory.maxAverageMB * 1024 * 1024) {
      violations.push({
        category: 'memory',
        threshold: 'maxAverageMB',
        actual: memoryAnalysis.averageMemory / 1024 / 1024,
        expected: PERFORMANCE_THRESHOLDS.memory.maxAverageMB
      })
    }

    if (memoryAnalysis.potentialLeaks) {
      warnings.push({
        category: 'memory',
        message: 'Potential memory leaks detected'
      })
    }

    // Scroll performance validation
    const scrollMetrics = detailedMetrics.filter(m => m.scroll)
    if (scrollMetrics.length > 0) {
      const frameRates = scrollMetrics.map(m => m.scroll!.frameRate).filter(fr => fr > 0)
      if (frameRates.length > 0) {
        const avgFrameRate = frameRates.reduce((sum, fr) => sum + fr, 0) / frameRates.length
        if (avgFrameRate < PERFORMANCE_THRESHOLDS.scroll.minFrameRate) {
          violations.push({
            category: 'scroll',
            threshold: 'minFrameRate',
            actual: avgFrameRate,
            expected: PERFORMANCE_THRESHOLDS.scroll.minFrameRate
          })
        }
      }

      const scrollTimes = scrollMetrics.map(m => m.scroll!.scrollTime).filter(st => st > 0)
      if (scrollTimes.length > 0) {
        const maxScrollTime = Math.max(...scrollTimes)
        if (maxScrollTime > PERFORMANCE_THRESHOLDS.scroll.maxScrollTime) {
          violations.push({
            category: 'scroll',
            threshold: 'maxScrollTime',
            actual: maxScrollTime,
            expected: PERFORMANCE_THRESHOLDS.scroll.maxScrollTime
          })
        }
      }
    }

    // Rendering performance validation
    const renderingMetrics = detailedMetrics.filter(m => m.rendering).map(m => m.rendering!)
    if (renderingMetrics.length > 0) {
      const avgFCP = renderingMetrics.map(r => r.firstContentfulPaint || 0).reduce((sum, fcp) => sum + fcp, 0) / renderingMetrics.length
      if (avgFCP > PERFORMANCE_THRESHOLDS.rendering.maxFirstContentfulPaint) {
        violations.push({
          category: 'rendering',
          threshold: 'maxFirstContentfulPaint',
          actual: avgFCP,
          expected: PERFORMANCE_THRESHOLDS.rendering.maxFirstContentfulPaint
        })
      }

      const avgLCP = renderingMetrics.map(r => r.largestContentfulPaint || 0).reduce((sum, lcp) => sum + lcp, 0) / renderingMetrics.length
      if (avgLCP > PERFORMANCE_THRESHOLDS.rendering.maxLargestContentfulPaint) {
        violations.push({
          category: 'rendering',
          threshold: 'maxLargestContentfulPaint',
          actual: avgLCP,
          expected: PERFORMANCE_THRESHOLDS.rendering.maxLargestContentfulPaint
        })
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    }
  }
}

/**
 * Factory function for creating performance monitor
 */
export function createPerformanceMonitor(page: Page): PerformanceMonitor {
  return new PerformanceMonitor(page)
}