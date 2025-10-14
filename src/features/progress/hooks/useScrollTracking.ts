import { useEffect, useRef, type RefObject } from 'react'
import { useDebounce } from './useDebounce'

interface UseScrollTrackingOptions {
  onScrollPercentChange: (percent: number) => void
  debounceMs?: number
}

interface UseScrollTrackingResult {
  containerRef: RefObject<HTMLDivElement>
}

/**
 * Hook to track scroll progress within a container
 * Calculates scroll percentage and calls callback with debouncing
 */
export function useScrollTracking ({
  onScrollPercentChange,
  debounceMs = 300
}: UseScrollTrackingOptions): UseScrollTrackingResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPercentRef = useRef(0)

  const debouncedCallback = useDebounce(onScrollPercentChange, debounceMs)

  useEffect(() => {
    const container = containerRef.current
    if (container == null) return

    const handleScroll = (): void => {
      const { scrollTop, scrollHeight, clientHeight } = container

      // Calculate scroll percentage
      const scrollableHeight = scrollHeight - clientHeight

      // If content fits in viewport, don't auto-mark as complete
      if (scrollableHeight <= 0) {
        const percent = 0 // Start at 0% for short content, let user complete manually
        if (scrollPercentRef.current !== percent) {
          scrollPercentRef.current = percent
          debouncedCallback(percent)
        }
        return
      }

      const percent = Math.min(Math.round((scrollTop / scrollableHeight) * 100), 100)

      // Only update if changed significantly (> 1%)
      if (Math.abs(percent - scrollPercentRef.current) >= 1) {
        scrollPercentRef.current = percent
        debouncedCallback(percent)

        // For major milestones, update immediately for better UX
        if ([0, 25, 50, 75, 100].includes(percent)) {
          onScrollPercentChange(percent)
        }
      }
    }

    // Initial check
    handleScroll()

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [debouncedCallback, onScrollPercentChange])

  return { containerRef }
}
