/**
 * Memory Usage Monitoring During E2E Test Execution
 *
 * This file provides specialized utilities for monitoring JavaScript heap usage,
 * detecting memory leaks, and analyzing memory patterns during E2E tests.
 */

import { Page } from '@playwright/test'
import { PerformanceMonitor } from './performance-monitor'

/**
 * Memory snapshot with detailed analysis
 */
export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  heapLimit: number
  external: number
  arrayBuffers: number
  heapUsagePercentage: number
  detailedObjects?: {
    domNodes: number
    eventListeners: number
    timers: number
    observers: number
  }
}

/**
 * Memory leak detection result
 */
export interface MemoryLeakDetection {
  hasLeaks: boolean
  leakScore: number // 0-100, higher indicates more likely leaks
  patterns: Array<{
    type: 'continuous_growth' | 'spike' | 'no_gc' | 'circular_reference'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    evidence: any[]
  }>
  recommendations: string[]
}

/**
 * Memory monitoring configuration
 */
export interface MemoryMonitoringConfig {
  snapshotInterval: number // milliseconds
  monitoringDuration: number // milliseconds
  enableDetailedTracking: boolean
  gcTriggerThreshold: number // MB
  baselineSamples: number // number of samples to establish baseline
}

/**
 * Specialized memory monitor for E2E tests
 */
export class MemoryMonitor {
  private page: Page
  private snapshots: MemorySnapshot[] = []
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout
  private baselineMemory = 0
  private config: MemoryMonitoringConfig

  constructor(page: Page, config: Partial<MemoryMonitoringConfig> = {}) {
    this.page = page
    this.config = {
      snapshotInterval: 1000,
      monitoringDuration: 30000,
      enableDetailedTracking: true,
      gcTriggerThreshold: 100,
      baselineSamples: 5,
      ...config
    }
  }

  /**
   * Start memory monitoring with baseline establishment
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Memory monitoring is already active')
    }

    this.isMonitoring = true
    this.snapshots = []

    // Initialize memory tracking capabilities
    await this.initializeMemoryTracking()

    // Establish baseline memory usage
    await this.establishBaseline()

    // Start monitoring interval
    this.monitoringInterval = setInterval(async () => {
      const snapshot = await this.captureMemorySnapshot()
      this.snapshots.push(snapshot)

      // Check if we should trigger garbage collection
      if (this.shouldTriggerGC(snapshot)) {
        await this.triggerGarbageCollection()
      }
    }, this.config.snapshotInterval)

    // Auto-stop after duration
    setTimeout(() => {
      if (this.isMonitoring) {
        this.stopMonitoring()
      }
    }, this.config.monitoringDuration)
  }

  /**
   * Stop memory monitoring and return analysis
   */
  async stopMonitoring(): Promise<{
    snapshots: MemorySnapshot[]
    analysis: MemoryLeakDetection
    summary: MemorySummary
  }> {
    if (!this.isMonitoring) {
      return {
        snapshots: this.snapshots,
        analysis: this.detectMemoryLeaks(),
        summary: this.generateMemorySummary()
      }
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    // Final garbage collection
    await this.triggerGarbageCollection()
    await this.page.waitForTimeout(2000)

    // Capture final snapshot
    const finalSnapshot = await this.captureMemorySnapshot()
    this.snapshots.push(finalSnapshot)

    return {
      snapshots: this.snapshots,
      analysis: this.detectMemoryLeaks(),
      summary: this.generateMemorySummary()
    }
  }

  /**
   * Initialize memory tracking capabilities in the browser
   */
  private async initializeMemoryTracking(): Promise<void> {
    await this.page.evaluate(() => {
      // Create global memory tracking object
      ;(window as any).memoryTracker = {
        snapshots: [],
        objectCounts: new Map(),
        eventListenerCounts: new Map(),
        timerCounts: new Map(),

        // Count DOM nodes
        countDOMNodes: () => {
          return document.querySelectorAll('*').length
        },

        // Count event listeners (approximation)
        countEventListeners: () => {
          let count = 0
          const elements = document.querySelectorAll('*')
          elements.forEach(element => {
            const listeners = (element as any)._eventListeners || {}
            count += Object.keys(listeners).length
          })
          return count
        },

        // Count active timers
        countTimers: () => {
          // This is an approximation - actual timer counting requires more complex instrumentation
          return 0
        },

        // Count active observers
        countObservers: () => {
          return ((window as any).intersectionObserverCount || 0) +
                 ((window as any).mutationObserverCount || 0) +
                 ((window as any).resizeObserverCount || 0)
        }
      }

      // Override common APIs to track object creation/destruction
      const originalAddEventListener = EventTarget.prototype.addEventListener
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        const result = originalAddEventListener.call(this, type, listener, options)
        ;(window as any).memoryTracker.eventListenerCounts.set(type,
          ((window as any).memoryTracker.eventListenerCounts.get(type) || 0) + 1)
        return result
      }

      // Track Intersection Observer usage
      const originalIntersectionObserver = window.IntersectionObserver
      let intersectionObserverCount = 0
      window.IntersectionObserver = function(callback, options) {
        intersectionObserverCount++
        ;(window as any).intersectionObserverCount = intersectionObserverCount
        return new originalIntersectionObserver(callback, options)
      } as any
    })
  }

  /**
   * Establish baseline memory usage
   */
  private async establishBaseline(): Promise<void> {
    const baselineSnapshots: MemorySnapshot[] = []

    for (let i = 0; i < this.config.baselineSamples; i++) {
      await this.triggerGarbageCollection()
      await this.page.waitForTimeout(1000)
      const snapshot = await this.captureMemorySnapshot()
      baselineSnapshots.push(snapshot)
    }

    // Calculate baseline as average of baseline samples
    this.baselineMemory = baselineSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / baselineSnapshots.length
  }

  /**
   * Capture a detailed memory snapshot
   */
  private async captureMemorySnapshot(): Promise<MemorySnapshot> {
    return await this.page.evaluate((enableDetailed: boolean) => {
      const memory = (performance as any).memory
      if (!memory) {
        throw new Error('Memory API not available')
      }

      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        heapLimit: memory.jsHeapSizeLimit,
        external: 0, // Not available in most browsers
        arrayBuffers: 0, // Not available in most browsers
        heapUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }

      if (enableDetailed && (window as any).memoryTracker) {
        const tracker = (window as any).memoryTracker
        snapshot.detailedObjects = {
          domNodes: tracker.countDOMNodes(),
          eventListeners: tracker.countEventListeners(),
          timers: tracker.countTimers(),
          observers: tracker.countObservers()
        }
      }

      return snapshot
    }, this.config.enableDetailedTracking)
  }

  /**
   * Check if garbage collection should be triggered
   */
  private shouldTriggerGC(snapshot: MemorySnapshot): boolean {
    const memoryMB = snapshot.heapUsed / 1024 / 1024
    return memoryMB > this.config.gcTriggerThreshold
  }

  /**
   * Trigger garbage collection if available
   */
  private async triggerGarbageCollection(): Promise<void> {
    try {
      // Try to trigger GC in Chrome/Chromium
      await this.page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        } else if ((window as any).GCController) {
          (window as any).GCController.collect()
        }
      })
    } catch (error) {
      // GC might not be available, that's okay
    }
  }

  /**
   * Detect memory leaks from collected snapshots
   */
  detectMemoryLeaks(): MemoryLeakDetection {
    if (this.snapshots.length < 10) {
      return {
        hasLeaks: false,
        leakScore: 0,
        patterns: [],
        recommendations: ['Insufficient data for leak detection']
      }
    }

    const patterns: MemoryLeakDetection['patterns'] = []
    let totalLeakScore = 0

    // Check for continuous growth pattern
    const growthPattern = this.detectContinuousGrowth()
    if (growthPattern) {
      patterns.push(growthPattern)
      totalLeakScore += growthPattern.severity === 'critical' ? 40 :
                       growthPattern.severity === 'high' ? 30 :
                       growthPattern.severity === 'medium' ? 20 : 10
    }

    // Check for memory spikes
    const spikePattern = this.detectMemorySpikes()
    if (spikePattern) {
      patterns.push(spikePattern)
      totalLeakScore += spikePattern.severity === 'critical' ? 30 :
                       spikePattern.severity === 'high' ? 20 : 10
    }

    // Check for insufficient garbage collection
    const gcPattern = this.detectInsufficientGC()
    if (gcPattern) {
      patterns.push(gcPattern)
      totalLeakScore += gcPattern.severity === 'high' ? 25 : 15
    }

    // Check for object count increases
    const objectPattern = this.detectObjectCountIncreases()
    if (objectPattern) {
      patterns.push(objectPattern)
      totalLeakScore += 20
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns)

    return {
      hasLeaks: totalLeakScore > 30,
      leakScore: Math.min(100, totalLeakScore),
      patterns,
      recommendations
    }
  }

  /**
   * Detect continuous memory growth pattern
   */
  private detectContinuousGrowth(): MemoryLeakDetection['patterns'][0] | null {
    const memoryValues = this.snapshots.map(s => s.heapUsed)
    if (memoryValues.length < 5) return null

    let increasingCount = 0
    let totalIncrease = 0
    let maxIncrease = 0

    for (let i = 1; i < memoryValues.length; i++) {
      const increase = memoryValues[i] - memoryValues[i - 1]
      if (increase > 0) {
        increasingCount++
        totalIncrease += increase
        maxIncrease = Math.max(maxIncrease, increase)
      }
    }

    const growthRatio = increasingCount / (memoryValues.length - 1)
    const avgIncrease = totalIncrease / (memoryValues.length - 1)

    if (growthRatio > 0.7 && avgIncrease > 1024 * 1024) { // 70% growth, 1MB average increase
      return {
        type: 'continuous_growth',
        severity: avgIncrease > 10 * 1024 * 1024 ? 'critical' :
                  avgIncrease > 5 * 1024 * 1024 ? 'high' :
                  avgIncrease > 2 * 1024 * 1024 ? 'medium' : 'low',
        description: `Memory shows continuous growth pattern (${growthRatio.toFixed(1)}% of measurements increasing)`,
        evidence: [
          { growthRatio, avgIncrease: avgIncrease / 1024 / 1024, maxIncrease: maxIncrease / 1024 / 1024 }
        ]
      }
    }

    return null
  }

  /**
   * Detect memory spikes
   */
  private detectMemorySpikes(): MemoryLeakDetection['patterns'][0] | null {
    const memoryValues = this.snapshots.map(s => s.heapUsed)
    if (memoryValues.length < 3) return null

    const mean = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length
    const variance = memoryValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / memoryValues.length
    const stdDev = Math.sqrt(variance)

    // Look for values more than 2 standard deviations from mean
    const spikes = memoryValues.filter(val => Math.abs(val - mean) > 2 * stdDev)

    if (spikes.length > 0 && stdDev > mean * 0.3) { // High variance
      return {
        type: 'spike',
        severity: stdDev > mean * 0.5 ? 'high' : 'medium',
        description: `Memory usage shows significant spikes (${spikes.length} spikes detected)`,
        evidence: [
          { spikeCount: spikes.length, stdDev: stdDev / 1024 / 1024, mean: mean / 1024 / 1024 }
        ]
      }
    }

    return null
  }

  /**
   * Detect insufficient garbage collection
   */
  private detectInsufficientGC(): MemoryLeakDetection['patterns'][0] | null {
    const memoryValues = this.snapshots.map(s => s.heapUsed)
    if (memoryValues.length < 10) return null

    // Look for periods where memory should have decreased but didn't
    let insufficientGCInstances = 0

    for (let i = 5; i < memoryValues.length; i++) {
      const recentAverage = memoryValues.slice(i - 5, i).reduce((sum, val) => sum + val, 0) / 5
      const current = memoryValues[i]

      // If memory is consistently higher than recent average without activity
      if (current > recentAverage * 1.1) {
        insufficientGCInstances++
      }
    }

    if (insufficientGCInstances > memoryValues.length * 0.3) {
      return {
        type: 'no_gc',
        severity: 'medium',
        description: 'Memory appears to grow without sufficient garbage collection',
        evidence: [{ insufficientGCInstances, totalChecks: memoryValues.length - 5 }]
      }
    }

    return null
  }

  /**
   * Detect object count increases
   */
  private detectObjectCountIncreases(): MemoryLeakDetection['patterns'][0] | null {
    const objectSnapshots = this.snapshots.filter(s => s.detailedObjects)
    if (objectSnapshots.length < 5) return null

    const firstSnapshot = objectSnapshots[0].detailedObjects!
    const lastSnapshot = objectSnapshots[objectSnapshots.length - 1].detailedObjects!

    const increases = {
      domNodes: lastSnapshot.domNodes - firstSnapshot.domNodes,
      eventListeners: lastSnapshot.eventListeners - firstSnapshot.eventListenerCounts,
      timers: lastSnapshot.timers - firstSnapshot.timers,
      observers: lastSnapshot.observers - firstSnapshot.observers
    }

    const significantIncreases = Object.entries(increases)
      .filter(([_, increase]) => increase > 50) // Significant increase threshold

    if (significantIncreases.length > 0) {
      return {
        type: 'circular_reference',
        severity: 'medium',
        description: 'Object counts show sustained increases, possible circular references',
        evidence: [increases]
      }
    }

    return null
  }

  /**
   * Generate recommendations based on detected patterns
   */
  private generateRecommendations(patterns: MemoryLeakDetection['patterns']): string[] {
    const recommendations: string[] = []

    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'continuous_growth':
          recommendations.push('Review event listener cleanup and component unmounting logic')
          recommendations.push('Check for circular references in object graphs')
          break
        case 'spike':
          recommendations.push('Investigate memory-intensive operations and optimize if possible')
          recommendations.push('Consider implementing memory pooling for large allocations')
          break
        case 'no_gc':
          recommendations.push('Add explicit garbage collection triggers in test environment')
          recommendations.push('Review object lifecycle management')
          break
        case 'circular_reference':
          recommendations.push('Use WeakMap/WeakSet for object references where appropriate')
          recommendations.push('Implement proper cleanup in component lifecycle methods')
          break
      }
    })

    // General recommendations
    recommendations.push('Monitor memory usage in production with similar tools')
    recommendations.push('Consider implementing memory usage alerts for monitoring')

    return [...new Set(recommendations)] // Remove duplicates
  }

  /**
   * Generate memory usage summary
   */
  generateMemorySummary(): MemorySummary {
    if (this.snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        duration: 0,
        baselineMemory: 0,
        peakMemory: 0,
        averageMemory: 0,
        memoryGrowth: 0,
        memoryEfficiency: 0,
        gcFrequency: 0
      }
    }

    const memoryValues = this.snapshots.map(s => s.heapUsed)
    const firstSnapshot = this.snapshots[0]
    const lastSnapshot = this.snapshots[this.snapshots.length - 1]

    return {
      totalSnapshots: this.snapshots.length,
      duration: lastSnapshot.timestamp - firstSnapshot.timestamp,
      baselineMemory: this.baselineMemory,
      peakMemory: Math.max(...memoryValues),
      averageMemory: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
      memoryGrowth: lastSnapshot.heapUsed - firstSnapshot.heapUsed,
      memoryEfficiency: (memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length) / 1024 / 1024,
      gcFrequency: this.estimateGCFrequency()
    }
  }

  /**
   * Estimate garbage collection frequency
   */
  private estimateGCFrequency(): number {
    // Estimate GC frequency based on memory drops in snapshots
    let gcEvents = 0
    for (let i = 1; i < this.snapshots.length; i++) {
      const decrease = this.snapshots[i - 1].heapUsed - this.snapshots[i].heapUsed
      if (decrease > 5 * 1024 * 1024) { // Significant decrease (>5MB)
        gcEvents++
      }
    }

    return this.snapshots.length > 0 ? gcEvents / this.snapshots.length : 0
  }

  /**
   * Export memory data for external analysis
   */
  exportMemoryData(): {
    snapshots: MemorySnapshot[]
    leakDetection: MemoryLeakDetection
    summary: MemorySummary
    config: MemoryMonitoringConfig
  } {
    return {
      snapshots: this.snapshots,
      leakDetection: this.detectMemoryLeaks(),
      summary: this.generateMemorySummary(),
      config: this.config
    }
  }
}

/**
 * Memory summary interface
 */
export interface MemorySummary {
  totalSnapshots: number
  duration: number
  baselineMemory: number
  peakMemory: number
  averageMemory: number
  memoryGrowth: number
  memoryEfficiency: number // MB
  gcFrequency: number // GC events per snapshot
}

/**
 * Factory function for creating memory monitor
 */
export function createMemoryMonitor(page: Page, config?: Partial<MemoryMonitoringConfig>): MemoryMonitor {
  return new MemoryMonitor(page, config)
}

/**
 * Memory monitoring thresholds for validation
 */
export const MEMORY_THRESHOLDS = {
  maxGrowthMB: 50,
  maxAverageMB: 100,
  maxPeakMB: 200,
  maxLeakScore: 50,
  minGCFrequency: 0.1 // At least 10% of snapshots should show GC
}