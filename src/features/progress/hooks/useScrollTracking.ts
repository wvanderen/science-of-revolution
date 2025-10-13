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
  debounceMs = 2000
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
      if (scrollableHeight <= 0) {
        // Content fits in viewport, consider 100% scrolled
        scrollPercentRef.current = 100
        debouncedCallback(100)
        return
      }

      const percent = Math.min(Math.round((scrollTop / scrollableHeight) * 100), 100)

      // Only update if changed significantly (> 1%)
      if (Math.abs(percent - scrollPercentRef.current) >= 1) {
        scrollPercentRef.current = percent
        debouncedCallback(percent)
      }
    }

    // Initial check
    handleScroll()

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [debouncedCallback])

  return { containerRef }
}
