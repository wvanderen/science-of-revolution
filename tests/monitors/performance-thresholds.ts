/**
 * Test Thresholds for Acceptable Performance Degradation
 *
 * This file defines performance thresholds and validation utilities to ensure
 * that reader progress components perform within acceptable limits during testing.
 */

import { PerformanceMetrics } from './performance-monitor'
import { MemoryLeakDetection } from './memory-monitor'
import { ComponentBenchmarkResult } from './performance-benchmarks'

/**
 * Performance threshold categories
 */
export interface PerformanceThresholds {
  // Memory thresholds (in bytes)
  memory: {
    maxHeapGrowth: number // Maximum heap growth during test
    maxHeapSize: number // Maximum heap size allowed
    maxMemoryLeakScore: number // Maximum leak score (0-100)
    minGCFrequency: number // Minimum GC events per minute
  }

  // Performance thresholds (in milliseconds)
  performance: {
    maxScrollResponseTime: number // Maximum time for scroll to respond
    maxProgressUpdateTime: number // Maximum time for progress update
    maxRestorationTime: number // Maximum time for progress restoration
    maxComponentInitTime: number // Maximum component initialization time
  }

  // Frame rate thresholds
  frameRate: {
    minAverageFPS: number // Minimum average frames per second
    minFPSP95: number // Minimum 95th percentile FPS
    maxDroppedFrames: number // Maximum dropped frames per second
  }

  // Resource thresholds
  resources: {
    maxNetworkRequests: number // Maximum network requests during test
    maxResourceSize: number // Maximum total resource size (bytes)
    maxAPIResponseTime: number // Maximum API response time
  }

  // User experience thresholds
  userExperience: {
    maxFirstContentfulPaint: number // Maximum FCP time
    maxLargestContentfulPaint: number // Maximum LCP time
    maxCumulativeLayoutShift: number // Maximum CLS score
    maxFirstInputDelay: number // Maximum FID time
  }
}

/**
 * Performance validation result
 */
export interface PerformanceValidationResult {
  overallPassed: boolean
  categoryResults: Array<{
    category: keyof PerformanceThresholds
    passed: boolean
    violations: Array<{
      metric: string
      threshold: number
      actual: number
      severity: 'low' | 'medium' | 'high' | 'critical'
      recommendation: string
    }>
  }>
  score: number // 0-100 performance score
  summary: {
    totalViolations: number
    criticalViolations: number
    highViolations: number
    mediumViolations: number
    lowViolations: number
  }
}

/**
 * Default performance thresholds for reader progress testing
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  memory: {
    maxHeapGrowth: 50 * 1024 * 1024, // 50MB
    maxHeapSize: 200 * 1024 * 1024, // 200MB
    maxMemoryLeakScore: 40, // 0-100 scale
    minGCFrequency: 0.1 // At least 0.1 GC events per minute
  },
  performance: {
    maxScrollResponseTime: 100, // 100ms
    maxProgressUpdateTime: 50, // 50ms
    maxRestorationTime: 2000, // 2 seconds
    maxComponentInitTime: 1000 // 1 second
  },
  frameRate: {
    minAverageFPS: 55, // 55 FPS minimum
    minFPSP95: 30, // 30 FPS minimum 95th percentile
    maxDroppedFrames: 5 // Maximum 5 dropped frames per second
  },
  resources: {
    maxNetworkRequests: 20, // Maximum 20 requests
    maxResourceSize: 5 * 1024 * 1024, // 5MB total
    maxAPIResponseTime: 1000 // 1 second maximum API response
  },
  userExperience: {
    maxFirstContentfulPaint: 1500, // 1.5 seconds
    maxLargestContentfulPaint: 2500, // 2.5 seconds
    maxCumulativeLayoutShift: 0.1, // CLS score
    maxFirstInputDelay: 100 // 100ms
  }
}

/**
 * Performance threshold validator
 */
export class PerformanceThresholdValidator {
  private thresholds: PerformanceThresholds

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = this.mergeThresholds(DEFAULT_PERFORMANCE_THRESHOLDS, thresholds)
  }

  /**
   * Validate performance metrics against thresholds
   */
  validatePerformance(
    metrics: PerformanceMetrics[],
    memoryAnalysis?: MemoryLeakDetection,
    benchmarkResults?: ComponentBenchmarkResult[]
  ): PerformanceValidationResult {
    const categoryResults: PerformanceValidationResult['categoryResults'] = []
    let totalViolations = 0
    let criticalViolations = 0
    let highViolations = 0
    let mediumViolations = 0
    let lowViolations = 0

    // Validate memory performance
    const memoryResult = this.validateMemory(metrics, memoryAnalysis)
    categoryResults.push(memoryResult)
    this.addViolationCounts(memoryResult.violations, { criticalViolations, highViolations, mediumViolations, lowViolations })
    totalViolations += memoryResult.violations.length

    // Validate scroll performance
    const scrollResult = this.validateScrollPerformance(metrics)
    categoryResults.push(scrollResult)
    this.addViolationCounts(scrollResult.violations, { criticalViolations, highViolations, mediumViolations, lowViolations })
    totalViolations += scrollResult.violations.length

    // Validate frame rate
    const frameRateResult = this.validateFrameRate(metrics)
    categoryResults.push(frameRateResult)
    this.addViolationCounts(frameRateResult.violations, { criticalViolations, highViolations, mediumViolations, lowViolations })
    totalViolations += frameRateResult.violations.length

    // Validate rendering performance
    const renderingResult = this.validateRenderingPerformance(metrics)
    categoryResults.push(renderingResult)
    this.addViolationCounts(renderingResult.violations, { criticalViolations, highViolations, mediumViolations, lowViolations })
    totalViolations += renderingResult.violations.length

    // Validate benchmark results if provided
    if (benchmarkResults) {
      const benchmarkResult = this.validateBenchmarks(benchmarkResults)
      categoryResults.push(benchmarkResult)
      this.addViolationCounts(benchmarkResult.violations, { criticalViolations, highViolations, mediumViolations, lowViolations })
      totalViolations += benchmarkResult.violations.length
    }

    // Calculate overall score
    const score = this.calculatePerformanceScore(categoryResults)

    return {
      overallPassed: totalViolations === 0,
      categoryResults,
      score,
      summary: {
        totalViolations,
        criticalViolations,
        highViolations,
        mediumViolations,
        lowViolations
      }
    }
  }

  /**
   * Validate memory performance
   */
  private validateMemory(
    metrics: PerformanceMetrics[],
    memoryAnalysis?: MemoryLeakDetection
  ): PerformanceValidationResult['categoryResults'][0] {
    const violations: PerformanceValidationResult['categoryResults'][0]['violations'] = []
    const memoryMetrics = metrics.filter(m => m.memory).map(m => m.memory!)

    if (memoryMetrics.length < 2) {
      return {
        category: 'memory',
        passed: true,
        violations: []
      }
    }

    // Check heap growth
    const initialHeap = memoryMetrics[0].usedJSHeapSize
    const finalHeap = memoryMetrics[memoryMetrics.length - 1].usedJSHeapSize
    const heapGrowth = finalHeap - initialHeap

    if (heapGrowth > this.thresholds.memory.maxHeapGrowth) {
      violations.push({
        metric: 'maxHeapGrowth',
        threshold: this.thresholds.memory.maxHeapGrowth,
        actual: heapGrowth,
        severity: this.determineSeverity(heapGrowth / this.thresholds.memory.maxHeapGrowth),
        recommendation: 'Optimize memory usage and check for memory leaks'
      })
    }

    // Check maximum heap size
    const maxHeap = Math.max(...memoryMetrics.map(m => m.usedJSHeapSize))
    if (maxHeap > this.thresholds.memory.maxHeapSize) {
      violations.push({
        metric: 'maxHeapSize',
        threshold: this.thresholds.memory.maxHeapSize,
        actual: maxHeap,
        severity: this.determineSeverity(maxHeap / this.thresholds.memory.maxHeapSize),
        recommendation: 'Reduce memory footprint or implement memory pooling'
      })
    }

    // Check memory leak score if analysis is available
    if (memoryAnalysis && memoryAnalysis.leakScore > this.thresholds.memory.maxMemoryLeakScore) {
      violations.push({
        metric: 'maxMemoryLeakScore',
        threshold: this.thresholds.memory.maxMemoryLeakScore,
        actual: memoryAnalysis.leakScore,
        severity: this.determineSeverity(memoryAnalysis.leakScore / this.thresholds.memory.maxMemoryLeakScore),
        recommendation: 'Investigate and fix memory leaks identified in analysis'
      })
    }

    return {
      category: 'memory',
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate scroll performance
   */
  private validateScrollPerformance(
    metrics: PerformanceMetrics[]
  ): PerformanceValidationResult['categoryResults'][0] {
    const violations: PerformanceValidationResult['categoryResults'][0]['violations'] = []

    const scrollMetrics = metrics.filter(m => m.custom?.scrollResponseTime)
    if (scrollMetrics.length === 0) return { category: 'performance', passed: true, violations: [] }

    const avgScrollTime = scrollMetrics.reduce((sum, m) => sum + (m.custom?.scrollResponseTime || 0), 0) / scrollMetrics.length

    if (avgScrollTime > this.thresholds.performance.maxScrollResponseTime) {
      violations.push({
        metric: 'maxScrollResponseTime',
        threshold: this.thresholds.performance.maxScrollResponseTime,
        actual: avgScrollTime,
        severity: this.determineSeverity(avgScrollTime / this.thresholds.performance.maxScrollResponseTime),
        recommendation: 'Optimize scroll event handling and consider throttling'
      })
    }

    return {
      category: 'performance',
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate frame rate performance
   */
  private validateFrameRate(
    metrics: PerformanceMetrics[]
  ): PerformanceValidationResult['categoryResults'][0] {
    const violations: PerformanceValidationResult['categoryResults'][0]['violations'] = []

    const frameRateMetrics = metrics.filter(m => m.custom?.frameRate)
    if (frameRateMetrics.length === 0) return { category: 'frameRate', passed: true, violations: [] }

    const frameRates = frameRateMetrics.map(m => m.custom?.frameRate || 0)
    const avgFPS = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length

    if (avgFPS < this.thresholds.frameRate.minAverageFPS) {
      violations.push({
        metric: 'minAverageFPS',
        threshold: this.thresholds.frameRate.minAverageFPS,
        actual: avgFPS,
        severity: this.determineSeverity(1 - (avgFPS / this.thresholds.frameRate.minAverageFPS)),
        recommendation: 'Optimize rendering and reduce jank during scrolling'
      })
    }

    return {
      category: 'frameRate',
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate rendering performance
   */
  private validateRenderingPerformance(
    metrics: PerformanceMetrics[]
  ): PerformanceValidationResult['categoryResults'][0] {
    const violations: PerformanceValidationResult['categoryResults'][0]['violations'] = []

    const renderingMetrics = metrics.filter(m => m.rendering)
    if (renderingMetrics.length === 0) return { category: 'userExperience', passed: true, violations: [] }

    const fcpValues = renderingMetrics.map(m => m.rendering?.firstContentfulPaint || 0).filter(v => v > 0)
    if (fcpValues.length > 0) {
      const avgFCP = fcpValues.reduce((sum, fcp) => sum + fcp, 0) / fcpValues.length
      if (avgFCP > this.thresholds.userExperience.maxFirstContentfulPaint) {
        violations.push({
          metric: 'maxFirstContentfulPaint',
          threshold: this.thresholds.userExperience.maxFirstContentfulPaint,
          actual: avgFCP,
          severity: this.determineSeverity(avgFCP / this.thresholds.userExperience.maxFirstContentfulPaint),
          recommendation: 'Optimize initial page load and critical rendering path'
        })
      }
    }

    return {
      category: 'userExperience',
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate benchmark results
   */
  private validateBenchmarks(
    benchmarkResults: ComponentBenchmarkResult[]
  ): PerformanceValidationResult['categoryResults'][0] {
    const violations: PerformanceValidationResult['categoryResults'][0]['violations'] = []

    benchmarkResults.forEach(result => {
      result.validation.thresholds.forEach(threshold => {
        if (!threshold.passed) {
          violations.push({
            metric: `${result.componentName}_${threshold.metric}`,
            threshold: threshold.threshold,
            actual: threshold.actual,
            severity: this.determineSeverity(threshold.actual / threshold.threshold),
            recommendation: `Optimize ${result.operation} performance`
          })
        }
      })
    })

    return {
      category: 'resources',
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Determine severity based on threshold violation ratio
   */
  private determineSeverity(ratio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (ratio >= 3) return 'critical'
    if (ratio >= 2) return 'high'
    if (ratio >= 1.5) return 'medium'
    return 'low'
  }

  /**
   * Add violation counts to totals
   */
  private addViolationCounts(
    violations: PerformanceValidationResult['categoryResults'][0]['violations'],
    counts: { criticalViolations: number; highViolations: number; mediumViolations: number; lowViolations: number }
  ): void {
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          counts.criticalViolations++
          break
        case 'high':
          counts.highViolations++
          break
        case 'medium':
          counts.mediumViolations++
          break
        case 'low':
          counts.lowViolations++
          break
      }
    })
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(
    categoryResults: PerformanceValidationResult['categoryResults']
  ): number {
    let totalScore = 100
    const totalViolations = categoryResults.reduce((sum, result) => sum + result.violations.length, 0)

    if (totalViolations === 0) return 100

    categoryResults.forEach(result => {
      result.violations.forEach(violation => {
        switch (violation.severity) {
          case 'critical':
            totalScore -= 25
            break
          case 'high':
            totalScore -= 15
            break
          case 'medium':
            totalScore -= 8
            break
          case 'low':
            totalScore -= 3
            break
        }
      })
    })

    return Math.max(0, totalScore)
  }

  /**
   * Merge default thresholds with custom thresholds
   */
  private mergeThresholds(
    defaults: PerformanceThresholds,
    custom: Partial<PerformanceThresholds>
  ): PerformanceThresholds {
    return {
      memory: { ...defaults.memory, ...custom.memory },
      performance: { ...defaults.performance, ...custom.performance },
      frameRate: { ...defaults.frameRate, ...custom.frameRate },
      resources: { ...defaults.resources, ...custom.resources },
      userExperience: { ...defaults.userExperience, ...custom.userExperience }
    }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds }
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = this.mergeThresholds(this.thresholds, newThresholds)
  }
}

/**
 * Performance thresholds for different test environments
 */
export const ENVIRONMENT_THRESHOLDS = {
  // Development environment - more lenient thresholds
  development: {
    ...DEFAULT_PERFORMANCE_THRESHOLDS,
    memory: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.memory,
      maxHeapGrowth: 100 * 1024 * 1024, // 100MB
      maxMemoryLeakScore: 60
    },
    performance: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.performance,
      maxScrollResponseTime: 200,
      maxRestorationTime: 3000
    }
  },

  // Staging environment - moderate thresholds
  staging: {
    ...DEFAULT_PERFORMANCE_THRESHOLDS,
    memory: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.memory,
      maxHeapGrowth: 75 * 1024 * 1024, // 75MB
      maxMemoryLeakScore: 50
    }
  },

  // Production environment - strict thresholds
  production: DEFAULT_PERFORMANCE_THRESHOLDS,

  // CI/CD environment - very strict thresholds
  ci: {
    ...DEFAULT_PERFORMANCE_THRESHOLDS,
    memory: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.memory,
      maxHeapGrowth: 25 * 1024 * 1024, // 25MB
      maxMemoryLeakScore: 20
    },
    performance: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.performance,
      maxScrollResponseTime: 50,
      maxProgressUpdateTime: 25
    },
    frameRate: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS.frameRate,
      minAverageFPS: 58,
      maxDroppedFrames: 2
    }
  }
}

/**
 * Factory function for creating validator with environment-specific thresholds
 */
export function createPerformanceThresholdValidator(
  environment: keyof typeof ENVIRONMENT_THRESHOLDS = 'production',
  customThresholds?: Partial<PerformanceThresholds>
): PerformanceThresholdValidator {
  const baseThresholds = ENVIRONMENT_THRESHOLDS[environment]
  return new PerformanceThresholdValidator({ ...baseThresholds, ...customThresholds })
}