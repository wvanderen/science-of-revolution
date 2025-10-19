/**
 * Test Utilities for Intersection Observer Behavior Simulation
 *
 * This file provides utilities for mocking and simulating Intersection Observer
 * behavior in E2E tests, allowing for precise control over intersection scenarios.
 */

import { Page } from '@playwright/test'

/**
 * Mock Intersection Observer entry
 */
export interface MockIntersectionEntry {
  target: string // CSS selector
  intersectionRatio: number
  isIntersecting: boolean
  boundingClientRect: DOMRect
  intersectionRect: DOMRect
  rootBounds: DOMRect | null
  time: number
}

/**
 * Intersection Observer test configuration
 */
export interface IntersectionObserverConfig {
  root?: string // CSS selector for root element
  rootMargin?: string
  threshold?: number | number[]
  trackVisibility?: boolean
  delay?: number
}

/**
 * Mock Intersection Observer for testing
 */
export class MockIntersectionObserver {
  private page: Page
  private config: IntersectionObserverConfig
  private observerId: string

  constructor(page: Page, config: IntersectionObserverConfig = {}) {
    this.page = page
    this.config = {
      rootMargin: '0px',
      threshold: 0,
      trackVisibility: false,
      delay: 0,
      ...config
    }
    this.observerId = `mock-observer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Initialize the mock Intersection Observer in the page
   */
  async initialize(): Promise<void> {
    await this.page.evaluate((config: IntersectionObserverConfig & { observerId: string }) => {
      // Store mock configuration
      window.mockIntersectionObservers = window.mockIntersectionObservers || {}
      window.mockIntersectionObservers[config.observerId] = {
        config,
        observedElements: new Set(),
        callbacks: new Set()
      }

      // Override IntersectionObserver constructor
      const originalIntersectionObserver = window.IntersectionObserver

      window.IntersectionObserver = function(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        const observer = {
          callback,
          options: { ...config, ...options },
          observedElements: new Set(),
          observe: (element: Element) => {
            observer.observedElements.add(element)
            window.mockIntersectionObservers[config.observerId].observedElements.add(element)
          },
          unobserve: (element: Element) => {
            observer.observedElements.delete(element)
            window.mockIntersectionObservers[config.observerId].observedElements.delete(element)
          },
          disconnect: () => {
            observer.observedElements.clear()
          }
        }

        window.mockIntersectionObservers[config.observerId].callbacks.add(callback)
        return observer
      } as any

      // Restore original methods
      window.IntersectionObserver.prototype = originalIntersectionObserver?.prototype
    }, { ...this.config, observerId: this.observerId })
  }

  /**
   * Simulate intersection changes for observed elements
   */
  async simulateIntersection(entries: MockIntersectionEntry[]): Promise<void> {
    await this.page.evaluate(({ observerId, entries }: { observerId: string; entries: MockIntersectionEntry[] }) => {
      const observerData = window.mockIntersectionObservers?.[observerId]
      if (!observerData) return

      // Convert entries to actual IntersectionObserverEntry format
      const mockEntries = entries.map(entry => {
        const element = document.querySelector(entry.target) as Element
        if (!element) return null

        return {
          target: element,
          intersectionRatio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting,
          boundingClientRect: entry.boundingClientRect,
          intersectionRect: entry.intersectionRect,
          rootBounds: entry.rootBounds,
          time: entry.time
        }
      }).filter(Boolean)

      // Trigger callbacks for all observers
      observerData.callbacks.forEach((callback: IntersectionObserverCallback) => {
        try {
          callback(mockEntries, observerData.config as IntersectionObserver)
        } catch (error) {
          console.error('Intersection Observer callback error:', error)
        }
      })
    }, { observerId: this.observerId, entries })
  }

  /**
   * Simulate element entering viewport
   */
  async simulateElementEntersViewport(selector: string, position: { top: number; left: number } = { top: 100, left: 0 }): Promise<void> {
    const element = await this.page.$(selector)
    if (!element) throw new Error(`Element not found: ${selector}`)

    const boundingBox = await element.boundingBox()
    if (!boundingBox) throw new Error(`Could not get bounding box for: ${selector}`)

    const viewport = this.page.viewportSize()
    if (!viewport) throw new Error('Viewport size not available')

    const entry: MockIntersectionEntry = {
      target: selector,
      intersectionRatio: 1.0,
      isIntersecting: true,
      boundingClientRect: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        top: boundingBox.y,
        right: boundingBox.x + boundingBox.width,
        bottom: boundingBox.y + boundingBox.height,
        left: boundingBox.x
      },
      intersectionRect: {
        x: boundingBox.x,
        y: Math.max(position.top, boundingBox.y),
        width: boundingBox.width,
        height: Math.min(viewport.height - position.top, boundingBox.height),
        top: Math.max(position.top, boundingBox.y),
        right: boundingBox.x + boundingBox.width,
        bottom: Math.min(position.top + viewport.height, boundingBox.y + boundingBox.height),
        left: boundingBox.x
      },
      rootBounds: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
        top: 0,
        right: viewport.width,
        bottom: viewport.height,
        left: 0
      },
      time: performance.now()
    }

    await this.simulateIntersection([entry])
  }

  /**
   * Simulate element leaving viewport
   */
  async simulateElementLeavesViewport(selector: string): Promise<void> {
    const element = await this.page.$(selector)
    if (!element) throw new Error(`Element not found: ${selector}`)

    const boundingBox = await element.boundingBox()
    if (!boundingBox) throw new Error(`Could not get bounding box for: ${selector}`)

    const viewport = this.page.viewportSize()
    if (!viewport) throw new Error('Viewport size not available')

    const entry: MockIntersectionEntry = {
      target: selector,
      intersectionRatio: 0,
      isIntersecting: false,
      boundingClientRect: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        top: boundingBox.y,
        right: boundingBox.x + boundingBox.width,
        bottom: boundingBox.y + boundingBox.height,
        left: boundingBox.x
      },
      intersectionRect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      rootBounds: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
        top: 0,
        right: viewport.width,
        bottom: viewport.height,
        left: 0
      },
      time: performance.now()
    }

    await this.simulateIntersection([entry])
  }

  /**
   * Simulate partial intersection
   */
  async simulatePartialIntersection(selector: string, visibleRatio: number): Promise<void> {
    const element = await this.page.$(selector)
    if (!element) throw new Error(`Element not found: ${selector}`)

    const boundingBox = await element.boundingBox()
    if (!boundingBox) throw new Error(`Could not get bounding box for: ${selector}`)

    const viewport = this.page.viewportSize()
    if (!viewport) throw new Error('Viewport size not available')

    const visibleHeight = boundingBox.height * visibleRatio

    const entry: MockIntersectionEntry = {
      target: selector,
      intersectionRatio: visibleRatio,
      isIntersecting: visibleRatio > 0,
      boundingClientRect: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        top: boundingBox.y,
        right: boundingBox.x + boundingBox.width,
        bottom: boundingBox.y + boundingBox.height,
        left: boundingBox.x
      },
      intersectionRect: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: visibleHeight,
        top: boundingBox.y,
        right: boundingBox.x + boundingBox.width,
        bottom: boundingBox.y + visibleHeight,
        left: boundingBox.x
      },
      rootBounds: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
        top: 0,
        right: viewport.width,
        bottom: viewport.height,
        left: 0
      },
      time: performance.now()
    }

    await this.simulateIntersection([entry])
  }

  /**
   * Simulate scrolling with intersection updates
   */
  async simulateScrollingWithIntersections(
    scrollSteps: Array<{ scrollY: number; visibleElements: string[] }>
  ): Promise<void> {
    for (const step of scrollSteps) {
      // Scroll to position
      await this.page.evaluate((scrollY) => {
        window.scrollTo(0, scrollY)
      }, step.scrollY)

      // Wait for scroll to complete
      await this.page.waitForTimeout(300)

      // Update intersections for visible elements
      const entries: MockIntersectionEntry[] = []
      const viewport = this.page.viewportSize()

      if (viewport) {
        for (const selector of step.visibleElements) {
          try {
            const element = await this.page.$(selector)
            if (element) {
              const boundingBox = await element.boundingBox()
              if (boundingBox) {
                const isVisible = boundingBox.y < viewport.height && boundingBox.y + boundingBox.height > 0
                const visibleRatio = isVisible ? Math.min(1, Math.max(0,
                  Math.min(boundingBox.y + boundingBox.height, viewport.height) - Math.max(boundingBox.y, 0)
                ) / boundingBox.height) : 0

                entries.push({
                  target: selector,
                  intersectionRatio: visibleRatio,
                  isIntersecting: visibleRatio > 0,
                  boundingClientRect: {
                    x: boundingBox.x,
                    y: boundingBox.y,
                    width: boundingBox.width,
                    height: boundingBox.height,
                    top: boundingBox.y,
                    right: boundingBox.x + boundingBox.width,
                    bottom: boundingBox.y + boundingBox.height,
                    left: boundingBox.x
                  },
                  intersectionRect: {
                    x: boundingBox.x,
                    y: Math.max(boundingBox.y, 0),
                    width: boundingBox.width,
                    height: visibleRatio * boundingBox.height,
                    top: Math.max(boundingBox.y, 0),
                    right: boundingBox.x + boundingBox.width,
                    bottom: Math.max(boundingBox.y, 0) + visibleRatio * boundingBox.height,
                    left: boundingBox.x
                  },
                  rootBounds: {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: viewport.height,
                    top: 0,
                    right: viewport.width,
                    bottom: viewport.height,
                    left: 0
                  },
                  time: performance.now()
                })
              }
            }
          } catch (error) {
            // Skip elements that can't be found or measured
          }
        }
      }

      if (entries.length > 0) {
        await this.simulateIntersection(entries)
      }

      // Wait between scroll steps
      await this.page.waitForTimeout(200)
    }
  }

  /**
   * Cleanup the mock Intersection Observer
   */
  async cleanup(): Promise<void> {
    await this.page.evaluate((observerId: string) => {
      if (window.mockIntersectionObservers) {
        delete window.mockIntersectionObservers[observerId]
      }
    }, this.observerId)
  }

  /**
   * Get information about observed elements
   */
  async getObservedElements(): Promise<string[]> {
    return await this.page.evaluate((observerId: string) => {
      const observerData = window.mockIntersectionObservers?.[observerId]
      if (!observerData) return []

      return Array.from(observerData.observedElements).map((element: Element) => {
        return element.tagName.toLowerCase() +
               (element.id ? `#${element.id}` : '') +
               (element.className ? `.${element.className.split(' ').join('.')}` : '')
      })
    }, this.observerId)
  }
}

/**
 * Factory function for creating mock Intersection Observer
 */
export function createMockIntersectionObserver(page: Page, config?: IntersectionObserverConfig): MockIntersectionObserver {
  return new MockIntersectionObserver(page, config)
}

/**
 * Test scenarios for Intersection Observer
 */
export class IntersectionObserverTestScenarios {
  /**
   * Test basic intersection detection
   */
  static async testBasicIntersection(page: Page, elementSelector: string): Promise<boolean> {
    const mockObserver = createMockIntersectionObserver(page)
    await mockObserver.initialize()

    try {
      // Initially element should not be intersecting
      await mockObserver.simulateElementLeavesViewport(elementSelector)

      // Element enters viewport
      await mockObserver.simulateElementEntersViewport(elementSelector)

      // Element leaves viewport
      await mockObserver.simulateElementLeavesViewport(elementSelector)

      return true
    } catch (error) {
      console.error('Basic intersection test failed:', error)
      return false
    } finally {
      await mockObserver.cleanup()
    }
  }

  /**
   * Test scroll-based intersection changes
   */
  static async testScrollBasedIntersection(page: Page, elements: string[]): Promise<boolean> {
    const mockObserver = createMockIntersectionObserver(page)
    await mockObserver.initialize()

    try {
      const scrollSteps = [
        { scrollY: 0, visibleElements: [elements[0]] },
        { scrollY: 200, visibleElements: [elements[0], elements[1]] },
        { scrollY: 400, visibleElements: [elements[1], elements[2]] },
        { scrollY: 600, visibleElements: [elements[2]] },
        { scrollY: 800, visibleElements: [] }
      ]

      await mockObserver.simulateScrollingWithIntersections(scrollSteps)
      return true
    } catch (error) {
      console.error('Scroll-based intersection test failed:', error)
      return false
    } finally {
      await mockObserver.cleanup()
    }
  }

  /**
   * Test threshold-based intersection
   */
  static async testThresholdIntersection(page: Page, elementSelector: string, thresholds: number[]): Promise<boolean> {
    const mockObserver = createMockIntersectionObserver(page, { threshold: thresholds })
    await mockObserver.initialize()

    try {
      for (const threshold of thresholds) {
        await mockObserver.simulatePartialIntersection(elementSelector, threshold)
        await page.waitForTimeout(100)
      }
      return true
    } catch (error) {
      console.error('Threshold intersection test failed:', error)
      return false
    } finally {
      await mockObserver.cleanup()
    }
  }

  /**
   * Test multiple observers on same element
   */
  static async testMultipleObservers(page: Page, elementSelector: string): Promise<boolean> {
    const mockObserver1 = createMockIntersectionObserver(page, { threshold: 0.1 })
    const mockObserver2 = createMockIntersectionObserver(page, { threshold: 0.5 })

    await mockObserver1.initialize()
    await mockObserver2.initialize()

    try {
      await mockObserver1.simulateElementEntersViewport(elementSelector)
      await mockObserver2.simulateElementEntersViewport(elementSelector)

      await mockObserver1.simulatePartialIntersection(elementSelector, 0.3)
      await mockObserver2.simulatePartialIntersection(elementSelector, 0.3)

      return true
    } catch (error) {
      console.error('Multiple observers test failed:', error)
      return false
    } finally {
      await mockObserver1.cleanup()
      await mockObserver2.cleanup()
    }
  }

  /**
   * Test root margin configuration
   */
  static async testRootMargin(page: Page, elementSelector: string): Promise<boolean> {
    const mockObserver = createMockIntersectionObserver(page, { rootMargin: '50px' })
    await mockObserver.initialize()

    try {
      // Element should be considered intersecting even when slightly outside viewport
      await mockObserver.simulatePartialIntersection(elementSelector, 0.1)
      return true
    } catch (error) {
      console.error('Root margin test failed:', error)
      return false
    } finally {
      await mockObserver.cleanup()
    }
  }
}