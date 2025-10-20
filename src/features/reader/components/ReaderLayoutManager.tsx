import { type ReactNode, useMemo, useCallback } from 'react'
import { useReaderLayout, getLayoutClasses, getContainerClasses } from '../hooks/useReaderLayout'
import { useReader } from '../contexts/ReaderContext'

export interface ReaderLayoutManagerProps {
  children: ReactNode
  className?: string
  isMobile?: boolean
  breakpoints?: {
    mobile: number
    tablet: number
    desktop: number
  }
  preferences?: {
    theme: 'light' | 'dark'
    font_size: number
    font_family: 'serif' | 'sans'
    line_height: number
    reading_speed?: 'slow' | 'normal' | 'fast'
  }
}

/**
 * ReaderLayoutManager - Main layout coordinator component
 *
 * This component manages the overall layout of the reader interface, including:
 * - Responsive layout coordination between all reader sub-components
 * - Layout state management through useReaderLayout hook
 * - Mobile-first responsive design patterns
 * - CSS class generation for different layout configurations
 */
export function ReaderLayoutManager ({
  children,
  className = '',
  isMobile: isMobileProp = false,
  breakpoints,
  preferences = {
    theme: 'light',
    font_size: 16,
    font_family: 'serif',
    line_height: 1.5,
    reading_speed: 'normal'
  }
}: ReaderLayoutManagerProps): JSX.Element {
  const { refs } = useReader()

  // Use reader layout hook for layout state management
  const {
    layoutConfig,
    currentBreakpoint,
    isMobile
  } = useReaderLayout({
    isMobile: isMobileProp,
    preferences
  })

  // Generate dynamic CSS classes based on layout configuration
  const layoutClasses = useMemo(() => {
    const baseClasses = [
      'h-screen',
      'overflow-hidden',
      'bg-background',
      'text-foreground',
      'flex',
      'flex-col'
    ]

    // Add layout-specific classes
    const layoutSpecificClasses = getLayoutClasses(layoutConfig, currentBreakpoint)

    // Add theme classes
    const themeClasses = [`theme-${preferences.theme}`]

    // Add responsive classes
    const responsiveClasses = [
      'transition-all',
      'duration-300',
      'ease-in-out'
    ]

    return [
      ...baseClasses,
      ...layoutSpecificClasses,
      ...themeClasses,
      ...responsiveClasses,
      className
    ].filter(Boolean).join(' ')
  }, [layoutConfig, currentBreakpoint, preferences.theme, className])

  // Generate container classes for content area
  const contentContainerClasses = useMemo(() => {
    return getContainerClasses(layoutConfig.contentWidth, currentBreakpoint)
  }, [layoutConfig.contentWidth, currentBreakpoint])

  // Handle layout-specific event handlers
  const handleLayoutInteraction = useCallback((event: React.MouseEvent) => {
    // Close sidebars on mobile when clicking outside
    if (isMobile && layoutConfig.sidebarOpen) {
      // This would typically be handled by the specific sidebar component
      // but we can provide a global handler here if needed
    }
  }, [isMobile, layoutConfig.sidebarOpen])

  // Generate layout-specific CSS variables for dynamic styling
  const cssVariables = useMemo(() => {
    const variables: Record<string, string> = {}

    // Set CSS variables for layout configuration
    variables['--toolbar-position'] = layoutConfig.toolbarPosition
    variables['--content-width'] = layoutConfig.contentWidth
    variables['--sidebar-open'] = layoutConfig.sidebarOpen ? '1' : '0'
    variables['--current-breakpoint'] = currentBreakpoint

    // Set CSS variables for preferences
    variables['--reader-font-size'] = `${preferences.font_size}px`
    variables['--reader-line-height'] = preferences.line_height.toString()
    variables['--reader-font-family'] = preferences.font_family

    return variables
  }, [layoutConfig, currentBreakpoint, preferences])

  // Convert children to array for easier handling
  const childrenArray = useMemo(() => {
    if (children == null) return []
    return Array.isArray(children) ? children : [children]
  }, [children])

  // Render layout with proper semantic HTML structure
  return (
    <div
      className={layoutClasses}
      data-testid="reader-layout-manager"
      data-layout-manager="true"
      data-breakpoint={currentBreakpoint}
      data-toolbar-position={layoutConfig.toolbarPosition}
      data-content-width={layoutConfig.contentWidth}
      data-sidebar-open={layoutConfig.sidebarOpen}
      data-mobile={isMobile}
      style={cssVariables}
      onClick={handleLayoutInteraction}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#reader-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Layout structure based on configuration */}
      {layoutConfig.toolbarPosition === 'top' && (
        <>
          {/* Top toolbar area */}
          <header
            className="flex-shrink-0 z-40"
            data-layout-area="toolbar-top"
          >
            {childrenArray[0] ?? null}
          </header>

          {/* Main content area */}
          <main
            id="reader-main-content"
            className={`flex-1 min-h-0 overflow-hidden ${contentContainerClasses}`}
            data-layout-area="main-content"
          >
            {childrenArray.slice(1)}
          </main>
        </>
      )}

      {layoutConfig.toolbarPosition === 'bottom' && (
        <>
          {/* Main content area */}
          <main
            id="reader-main-content"
            className={`flex-1 min-h-0 overflow-hidden ${contentContainerClasses}`}
            data-layout-area="main-content"
          >
            {childrenArray.slice(0, -1)}
          </main>

          {/* Bottom toolbar area */}
          <footer
            className="flex-shrink-0 z-40"
            data-layout-area="toolbar-bottom"
          >
            {childrenArray[childrenArray.length - 1] ?? null}
          </footer>
        </>
      )}

      {layoutConfig.toolbarPosition === 'side' && !isMobile && (
        <div className="flex-1 min-h-0 flex">
          {/* Side toolbar */}
          <aside
            className={`flex-shrink-0 z-40 transition-all duration-300 ${
              layoutConfig.sidebarOpen ? 'w-64' : 'w-16'
            }`}
            data-layout-area="toolbar-side"
          >
            {childrenArray[0] ?? null}
          </aside>

          {/* Main content area */}
          <main
            id="reader-main-content"
            className={`flex-1 min-h-0 overflow-hidden ${contentContainerClasses}`}
            data-layout-area="main-content"
          >
            {childrenArray.slice(1)}
          </main>
        </div>
      )}

      {/* Fallback for side toolbar on mobile - switch to top layout */}
      {layoutConfig.toolbarPosition === 'side' && isMobile && (
        <>
          {/* Top toolbar area (mobile fallback) */}
          <header
            className="flex-shrink-0 z-40"
            data-layout-area="toolbar-top"
          >
            {childrenArray[0] ?? null}
          </header>

          {/* Main content area */}
          <main
            id="reader-main-content"
            className={`flex-1 min-h-0 overflow-hidden ${contentContainerClasses}`}
            data-layout-area="main-content"
          >
            {childrenArray.slice(1)}
          </main>
        </>
      )}

      {/* Layout indicators for development and testing */}
      <div
        className="fixed bottom-4 right-4 text-xs text-foreground-muted opacity-50 z-50"
        data-layout-debug="true"
        style={{ display: 'none' }} // Hidden by default, can be enabled for debugging
      >
        <div>Breakpoint: {currentBreakpoint}</div>
        <div>Toolbar: {layoutConfig.toolbarPosition}</div>
        <div>Width: {layoutConfig.contentWidth}</div>
        <div>Sidebar: {layoutConfig.sidebarOpen ? 'open' : 'closed'}</div>
        <div>Mobile: {isMobile ? 'yes' : 'no'}</div>
        <div>Children: {childrenArray.length}</div>
      </div>

      {/* Global overlay for modals and overlays */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        data-layout-area="overlay-container"
      >
        {/* Overlays will be rendered here by child components */}
      </div>
    </div>
  )
}

// Layout configuration constants for external use
export const LAYOUT_CONFIGURATIONS = {
  DEFAULT: {
    toolbarPosition: 'top' as const,
    contentWidth: 'contained' as const,
    sidebarOpen: false
  },
  DESKTOP_FOCUSED: {
    toolbarPosition: 'side' as const,
    contentWidth: 'narrow' as const,
    sidebarOpen: true
  },
  MOBILE_COMPACT: {
    toolbarPosition: 'top' as const,
    contentWidth: 'full' as const,
    sidebarOpen: false
  },
  PRESENTATION: {
    toolbarPosition: 'bottom' as const,
    contentWidth: 'full' as const,
    sidebarOpen: false
  }
} as const

// Helper function to create layout presets
export function createLayoutPreset(
  preset: keyof typeof LAYOUT_CONFIGURATIONS
): ReaderLayoutManagerProps['preferences'] {
  // This could be extended to return different preferences based on layout presets
  return {
    theme: 'light',
    font_size: 16,
    font_family: 'serif',
    line_height: 1.5,
    reading_speed: 'normal'
  }
}
