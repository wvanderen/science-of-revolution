import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReaderLayout, getLayoutClasses, getContainerClasses } from '../useReaderLayout'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock window object
const mockWindow = {
  innerWidth: 1200,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

describe('useReaderLayout', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })

    // Setup window mock
    Object.defineProperty(window, 'innerWidth', {
      value: mockWindow.innerWidth,
      writable: true
    })

    Object.defineProperty(window, 'addEventListener', {
      value: mockWindow.addEventListener,
      writable: true
    })

    Object.defineProperty(window, 'removeEventListener', {
      value: mockWindow.removeEventListener,
      writable: true
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultPreferences = {
    theme: 'light' as const,
    font_size: 16,
    font_family: 'serif' as const,
    line_height: 1.5,
    reading_speed: 'normal' as const
  }

  describe('initialization', () => {
    it('should initialize with default layout configuration', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.layoutConfig).toEqual({
        toolbarPosition: 'top',
        contentWidth: 'contained',
        sidebarOpen: false
      })
    })

    it('should load layout configuration from localStorage', () => {
      const savedConfig = {
        toolbarPosition: 'side',
        contentWidth: 'full',
        sidebarOpen: true
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig))

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.layoutConfig).toEqual(savedConfig)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.layoutConfig).toEqual({
        toolbarPosition: 'top',
        contentWidth: 'contained',
        sidebarOpen: false
      })
    })
  })

  describe('breakpoint detection', () => {
    it('should detect desktop breakpoint for large screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1400, writable: true })

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.currentBreakpoint).toBe('desktop')
      expect(result.current.isMobile).toBe(false)
    })

    it('should detect tablet breakpoint for medium screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true })

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.currentBreakpoint).toBe('tablet')
      expect(result.current.isMobile).toBe(false)
    })

    it('should detect mobile breakpoint for small screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.currentBreakpoint).toBe('mobile')
      expect(result.current.isMobile).toBe(true)
    })

    it('should set up resize event listener', () => {
      renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      )
    })

    it('should clean up resize event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      unmount()

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })

  describe('layout configuration updates', () => {
    it('should update layout configuration', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      act(() => {
        result.current.updateLayout({
          toolbarPosition: 'side',
          sidebarOpen: true
        })
      })

      expect(result.current.layoutConfig.toolbarPosition).toBe('side')
      expect(result.current.layoutConfig.sidebarOpen).toBe(true)
      expect(result.current.layoutConfig.contentWidth).toBe('contained') // unchanged
    })

    it('should save layout configuration to localStorage', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      act(() => {
        result.current.updateLayout({ sidebarOpen: true })
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reader-layout-config',
        expect.stringContaining('"sidebarOpen":true')
      )
    })

    it('should enforce mobile constraints when on mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      act(() => {
        result.current.updateLayout({
          toolbarPosition: 'side',
          sidebarOpen: true
        })
      })

      // Should override mobile-incompatible settings
      expect(result.current.layoutConfig.toolbarPosition).toBe('top')
      expect(result.current.layoutConfig.sidebarOpen).toBe(false)
    })

    it('should enforce mobile constraints when isMobile prop is true', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ isMobile: true, preferences: defaultPreferences })
      )

      act(() => {
        result.current.updateLayout({
          toolbarPosition: 'side',
          sidebarOpen: true
        })
      })

      // Should override mobile-incompatible settings
      expect(result.current.layoutConfig.toolbarPosition).toBe('top')
      expect(result.current.layoutConfig.sidebarOpen).toBe(false)
    })
  })

  describe('sidebar toggle', () => {
    it('should toggle sidebar when not on mobile', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.layoutConfig.sidebarOpen).toBe(false)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.layoutConfig.sidebarOpen).toBe(true)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.layoutConfig.sidebarOpen).toBe(false)
    })

    it('should not toggle sidebar when on mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })

      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      const initialSidebarState = result.current.layoutConfig.sidebarOpen

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.layoutConfig.sidebarOpen).toBe(initialSidebarState)
    })

    it('should not toggle sidebar when isMobile prop is true', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ isMobile: true, preferences: defaultPreferences })
      )

      const initialSidebarState = result.current.layoutConfig.sidebarOpen

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.layoutConfig.sidebarOpen).toBe(initialSidebarState)
    })
  })

  describe('preference-based adjustments', () => {
    it('should adjust content width based on font size preferences', () => {
      const { result, rerender } = renderHook(
        ({ preferences }) => useReaderLayout({ preferences }),
        {
          initialProps: { preferences: defaultPreferences }
        }
      )

      // Large font size should use full width
      rerender({
        preferences: { ...defaultPreferences, font_size: 20 }
      })

      expect(result.current.layoutConfig.contentWidth).toBe('full')

      // Small font size should use narrow width
      rerender({
        preferences: { ...defaultPreferences, font_size: 12 }
      })

      expect(result.current.layoutConfig.contentWidth).toBe('narrow')
    })

    it('should not override explicit content width preference', () => {
      const { result, rerender } = renderHook(
        ({ preferences }) => useReaderLayout({ preferences }),
        {
          initialProps: { preferences: defaultPreferences }
        }
      )

      // Set explicit content width
      act(() => {
        result.current.updateLayout({ contentWidth: 'full' })
      })

      // Change font size - should not override explicit setting
      rerender({
        preferences: { ...defaultPreferences, font_size: 20 }
      })

      expect(result.current.layoutConfig.contentWidth).toBe('full')
    })
  })

  describe('breakpoints', () => {
    it('should provide correct breakpoint values', () => {
      const { result } = renderHook(() =>
        useReaderLayout({ preferences: defaultPreferences })
      )

      expect(result.current.breakpoints).toEqual({
        mobile: 768,
        tablet: 1024,
        desktop: 1280
      })
    })
  })
})

describe('layout utility functions', () => {
  describe('getLayoutClasses', () => {
    it('should generate correct CSS classes for layout configuration', () => {
      const layoutConfig = {
        toolbarPosition: 'top' as const,
        contentWidth: 'contained' as const,
        sidebarOpen: false
      }
      const currentBreakpoint = 'desktop' as const

      const classes = getLayoutClasses(layoutConfig, currentBreakpoint)

      expect(classes).toBe('toolbar-top content-contained breakpoint-desktop')
    })

    it('should include sidebar class when sidebar is open', () => {
      const layoutConfig = {
        toolbarPosition: 'side' as const,
        contentWidth: 'full' as const,
        sidebarOpen: true
      }
      const currentBreakpoint = 'tablet' as const

      const classes = getLayoutClasses(layoutConfig, currentBreakpoint)

      expect(classes).toBe('toolbar-side content-full sidebar-open breakpoint-tablet')
    })
  })

  describe('getContainerClasses', () => {
    it('should generate correct container classes for full width', () => {
      const classes = getContainerClasses('full', 'desktop')

      expect(classes).toBe('transition-all duration-300 ease-in-out w-full px-0 sm:px-4')
    })

    it('should generate correct container classes for contained width', () => {
      const classes = getContainerClasses('contained', 'tablet')

      expect(classes).toBe('transition-all duration-300 ease-in-out max-w-4xl mx-auto px-4 sm:px-6 lg:px-8')
    })

    it('should generate correct container classes for narrow width', () => {
      const classes = getContainerClasses('narrow', 'mobile')

      expect(classes).toBe('transition-all duration-300 ease-in-out max-w-2xl mx-auto px-6 sm:px-8 lg:px-12')
    })
  })
})
