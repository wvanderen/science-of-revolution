import { useState, useCallback, useEffect, useMemo } from 'react'

// Layout configuration interfaces
export interface LayoutConfig {
  toolbarPosition: 'top' | 'bottom' | 'side'
  contentWidth: 'full' | 'contained' | 'narrow'
  sidebarOpen: boolean
}

export interface ReaderPreferences {
  // Reader preferences that might affect layout
  theme: 'light' | 'dark'
  font_size: number
  font_family: 'serif' | 'sans'
  line_height: number
  reading_speed?: 'slow' | 'normal' | 'fast'
}

export interface UseReaderLayoutProps {
  isMobile?: boolean
  preferences: ReaderPreferences
}

export interface UseReaderLayoutReturn {
  layoutConfig: LayoutConfig
  updateLayout: (config: Partial<LayoutConfig>) => void
  toggleSidebar: () => void
  isMobile: boolean
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop'
}

// Default layout configuration
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  toolbarPosition: 'top',
  contentWidth: 'contained',
  sidebarOpen: false
}

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 768,  // md breakpoint
  tablet: 1024, // lg breakpoint
  desktop: 1280 // xl breakpoint
}

// Local storage key for layout preferences
const LAYOUT_STORAGE_KEY = 'reader-layout-config'

/**
 * Hook for managing reader layout state and responsive behavior
 * Handles layout configuration, responsive breakpoints, and persistence
 */
export function useReaderLayout({
  isMobile: isMobileProp = false,
  preferences
}: UseReaderLayoutProps): UseReaderLayoutReturn {
  // Initialize layout state from localStorage or defaults
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT_CONFIG

    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_LAYOUT_CONFIG, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load layout config from localStorage:', error)
    }

    return DEFAULT_LAYOUT_CONFIG
  })

  // Track whether content width was explicitly set by user
  const [isContentWidthExplicit, setIsContentWidthExplicit] = useState(() => {
    // If loading from localStorage, consider it as explicitly set by user
    if (typeof window === 'undefined') return false

    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
      return stored != null
    } catch {
      return false
    }
  })

  // Detect current breakpoint based on window width
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop'

    const width = window.innerWidth
    if (width < BREAKPOINTS.mobile) return 'mobile'
    if (width < BREAKPOINTS.tablet) return 'tablet'
    return 'desktop'
  })

  // Track mobile state
  const [isMobile, setIsMobile] = useState(isMobileProp)

  // Update mobile state when prop changes
  useEffect(() => {
    setIsMobile(isMobileProp)
  }, [isMobileProp])

  // Handle window resize to detect breakpoint changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const width = window.innerWidth
      let newBreakpoint: 'mobile' | 'tablet' | 'desktop'

      if (width < BREAKPOINTS.mobile) {
        newBreakpoint = 'mobile'
      } else if (width < BREAKPOINTS.tablet) {
        newBreakpoint = 'tablet'
      } else {
        newBreakpoint = 'desktop'
      }

      setCurrentBreakpoint(newBreakpoint)

      // Auto-adjust layout for mobile
      if (newBreakpoint === 'mobile') {
        setLayoutConfig(prev => ({
          ...prev,
          toolbarPosition: 'top',
          sidebarOpen: false
        }))
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Auto-adjust layout based on preferences and breakpoint
  useEffect(() => {
    // Only adjust content width if user hasn't explicitly set it
    if (isContentWidthExplicit) return

    // Adjust content width based on font size preferences
    const newContentWidth = preferences.font_size > 18 ? 'full' :
                          preferences.font_size < 14 ? 'narrow' : 'contained'

    setLayoutConfig(prev => {
      // Only auto-adjust if the new content width is different
      if (prev.contentWidth === newContentWidth) return prev
      return {
        ...prev,
        contentWidth: newContentWidth
      }
    })
  }, [preferences.font_size, isContentWidthExplicit])

  // Persist layout changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutConfig))
    } catch (error) {
      console.warn('Failed to save layout config to localStorage:', error)
    }
  }, [layoutConfig])

  // Update layout configuration
  const updateLayout = useCallback((config: Partial<LayoutConfig>) => {
    setLayoutConfig(prev => {
      const newConfig = { ...prev, ...config }

      // Track if content width was explicitly set
      if (config.contentWidth !== undefined) {
        setIsContentWidthExplicit(true)
      }

      // Validate layout constraints for mobile
      if (isMobile || currentBreakpoint === 'mobile') {
        newConfig.toolbarPosition = 'top'
        newConfig.sidebarOpen = false
      }

      return newConfig
    })
  }, [isMobile, currentBreakpoint])

  // Toggle sidebar state
  const toggleSidebar = useCallback(() => {
    if (isMobile || currentBreakpoint === 'mobile') return

    setLayoutConfig(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen
    }))
  }, [isMobile, currentBreakpoint])

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo<UseReaderLayoutReturn>(() => ({
    layoutConfig,
    updateLayout,
    toggleSidebar,
    isMobile: isMobile || currentBreakpoint === 'mobile',
    breakpoints: BREAKPOINTS,
    currentBreakpoint
  }), [
    layoutConfig,
    updateLayout,
    toggleSidebar,
    isMobile,
    currentBreakpoint
  ])

  return returnValue
}

/**
 * Helper function to generate CSS classes based on layout configuration
 */
export function getLayoutClasses(layoutConfig: LayoutConfig, currentBreakpoint: 'mobile' | 'tablet' | 'desktop'): string {
  const classes = []

  // Toolbar position classes
  switch (layoutConfig.toolbarPosition) {
    case 'top':
      classes.push('toolbar-top')
      break
    case 'bottom':
      classes.push('toolbar-bottom')
      break
    case 'side':
      classes.push('toolbar-side')
      break
  }

  // Content width classes
  switch (layoutConfig.contentWidth) {
    case 'full':
      classes.push('content-full')
      break
    case 'contained':
      classes.push('content-contained')
      break
    case 'narrow':
      classes.push('content-narrow')
      break
  }

  // Sidebar state classes
  if (layoutConfig.sidebarOpen) {
    classes.push('sidebar-open')
  }

  // Breakpoint classes
  classes.push(`breakpoint-${currentBreakpoint}`)

  return classes.join(' ')
}

/**
 * Helper function to get responsive container classes
 */
export function getContainerClasses(contentWidth: LayoutConfig['contentWidth'], currentBreakpoint: 'mobile' | 'tablet' | 'desktop'): string {
  const baseClasses = ['transition-all duration-300 ease-in-out']

  switch (contentWidth) {
    case 'full':
      baseClasses.push('w-full px-0 sm:px-4')
      break
    case 'contained':
      baseClasses.push('max-w-4xl mx-auto px-4 sm:px-6 lg:px-8')
      break
    case 'narrow':
      baseClasses.push('max-w-2xl mx-auto px-6 sm:px-8 lg:px-12')
      break
  }

  return baseClasses.join(' ')
}
