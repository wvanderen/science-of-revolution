/**
 * Simple analytics utility for tracking user interactions
 * This is a basic implementation that can be extended with a proper analytics service
 */

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: string
}

class Analytics {
  private isDevelopment = import.meta.env.DEV

  /**
   * Track an analytics event
   */
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: properties || {},
      timestamp: new Date().toISOString()
    }

    // In development, log to console for debugging
    if (this.isDevelopment) {
      console.log('🔍 Analytics Event:', analyticsEvent)
    }

    // In production, this would send to your analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]')
      existingEvents.push(analyticsEvent)

      // Keep only last 100 events to avoid storage bloat
      const trimmedEvents = existingEvents.slice(-100)
      localStorage.setItem('analytics_events', JSON.stringify(trimmedEvents))
    } catch (error) {
      console.warn('Failed to store analytics event:', error)
    }
  }

  /**
   * Track page views
   */
  page(page: string, properties?: Record<string, any>) {
    this.track('page_view', { page, ...properties })
  }

  /**
   * Track user interactions
   */
  trackInteraction(element: string, action: string, properties?: Record<string, any>) {
    this.track('user_interaction', {
      element,
      action,
      ...properties
    })
  }

  /**
   * Get stored events for debugging
   */
  getEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]')
    } catch {
      return []
    }
  }

  /**
   * Clear stored events
   */
  clearEvents() {
    localStorage.removeItem('analytics_events')
  }
}

export const analytics = new Analytics()

/**
 * Hook for analytics tracking in React components
 */
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics)
  }
}