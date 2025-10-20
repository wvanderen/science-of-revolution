import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReaderLayoutManager, LAYOUT_CONFIGURATIONS } from '../ReaderLayoutManager'
import { ReaderProvider } from '../../contexts/ReaderContext'

// Mock useReaderLayout hook
const mockUseReaderLayout: {
  layoutConfig: {
    toolbarPosition: 'top' | 'bottom' | 'side'
    contentWidth: 'full' | 'contained' | 'narrow'
    sidebarOpen: boolean
  }
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop'
  isMobile: boolean
} = {
  layoutConfig: {
    toolbarPosition: 'top',
    contentWidth: 'contained',
    sidebarOpen: false
  },
  currentBreakpoint: 'desktop',
  isMobile: false
}

vi.mock('../../hooks/useReaderLayout', () => ({
  useReaderLayout: vi.fn(() => mockUseReaderLayout),
  getLayoutClasses: vi.fn(() => 'toolbar-top content-contained breakpoint-desktop'),
  getContainerClasses: vi.fn(() => 'container-classes')
}))

// Mock useReader context
const mockUseReader = {
  refs: {
    getScrollContainerRef: vi.fn(),
    setScrollContainerRef: vi.fn()
  },
  state: {
    currentSectionId: null,
    selectedHighlightId: null,
    menuPosition: null,
    noteHighlightId: null,
    isPreferencesOpen: false,
    isEditDocumentOpen: false,
    localScrollPercent: 0,
    sectionHighlights: {}
  },
  actions: {
    setCurrentSectionId: vi.fn(),
    setSelectedHighlightId: vi.fn(),
    setMenuPosition: vi.fn(),
    setNoteHighlightId: vi.fn(),
    setIsPreferencesOpen: vi.fn(),
    setIsEditDocumentOpen: vi.fn(),
    setLocalScrollPercent: vi.fn(),
    setSectionHighlights: vi.fn()
  }
}

vi.mock('../../contexts/ReaderContext', () => ({
  useReader: vi.fn(() => mockUseReader),
  ReaderProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ReaderProvider>
      {children}
    </ReaderProvider>
  )
}

describe('ReaderLayoutManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state to defaults
    mockUseReaderLayout.layoutConfig.toolbarPosition = 'top'
    mockUseReaderLayout.layoutConfig.contentWidth = 'contained'
    mockUseReaderLayout.layoutConfig.sidebarOpen = false
    mockUseReaderLayout.currentBreakpoint = 'desktop'
    mockUseReaderLayout.isMobile = false
  })

  const defaultPreferences = {
    theme: 'light' as const,
    font_size: 16,
    font_family: 'serif' as const,
    line_height: 1.5,
    reading_speed: 'normal' as const
  }

  describe('rendering', () => {
    it('should render with default layout configuration', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByTestId('reader-layout-manager')
      expect(layoutManager).toBeInTheDocument()
      expect(layoutManager).toHaveClass('h-screen', 'overflow-hidden', 'bg-background', 'text-foreground', 'flex', 'flex-col')
    })

    it('should render skip to main content link for accessibility', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#reader-main-content')
      expect(skipLink).toHaveClass('sr-only')
    })

    it('should apply custom className', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences} className="custom-class">
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByTestId('reader-layout-manager')
      expect(layoutManager).toHaveClass('custom-class')
    })

    it('should render data attributes for testing and debugging', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByTestId('reader-layout-manager')
      expect(layoutManager).toHaveAttribute('data-layout-manager', 'true')
      expect(layoutManager).toHaveAttribute('data-breakpoint', 'desktop')
      expect(layoutManager).toHaveAttribute('data-toolbar-position', 'top')
      expect(layoutManager).toHaveAttribute('data-content-width', 'contained')
      expect(layoutManager).toHaveAttribute('data-sidebar-open', 'false')
      expect(layoutManager).toHaveAttribute('data-mobile', 'false')
    })
  })

  describe('layout configurations', () => {
    it('should render top toolbar layout correctly', () => {
      mockUseReaderLayout.layoutConfig.toolbarPosition = 'top'
      mockUseReaderLayout.isMobile = false

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div data-testid="toolbar-node">Toolbar</div>
            <div data-testid="main-node">Main</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const mainContent = screen.getByRole('main')
      expect(mainContent).toBeInTheDocument()
      expect(mainContent).toHaveAttribute('data-layout-area', 'main-content')
      expect(screen.getByTestId('toolbar-node').closest('header')).not.toBeNull()
      expect(screen.getByTestId('main-node').closest('main')).not.toBeNull()
    })

    it('should render bottom toolbar layout correctly', () => {
      mockUseReaderLayout.layoutConfig.toolbarPosition = 'bottom'
      mockUseReaderLayout.isMobile = false

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const mainContent = screen.getByRole('main')
      expect(mainContent).toBeInTheDocument()
      expect(mainContent).toHaveAttribute('data-layout-area', 'main-content')
    })

    it('should render side toolbar layout on desktop', () => {
      mockUseReaderLayout.layoutConfig.toolbarPosition = 'side'
      mockUseReaderLayout.isMobile = false

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const mainContent = screen.getByRole('main')
      expect(mainContent).toBeInTheDocument()
      expect(mainContent).toHaveAttribute('data-layout-area', 'main-content')
    })

    it('should fallback to top layout for side toolbar on mobile', () => {
      mockUseReaderLayout.layoutConfig.toolbarPosition = 'side'
      mockUseReaderLayout.isMobile = true

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const mainContent = screen.getByRole('main')
      expect(mainContent).toBeInTheDocument()
      expect(mainContent).toHaveAttribute('data-layout-area', 'main-content')
    })
  })

  describe('CSS variables and styling', () => {
    it('should set correct CSS variables', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByTestId('reader-layout-manager')
      expect(layoutManager).toHaveStyle({
        '--toolbar-position': 'top',
        '--content-width': 'contained',
        '--sidebar-open': '0',
        '--current-breakpoint': 'desktop',
        '--reader-font-size': '16px',
        '--reader-line-height': '1.5',
        '--reader-font-family': 'serif'
      })
    })

    it('should update CSS variables when preferences change', () => {
      const customPreferences = {
        theme: 'dark' as const,
        font_size: 20,
        font_family: 'sans' as const,
        line_height: 1.8,
        reading_speed: 'fast' as const
      }

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={customPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByTestId('reader-layout-manager')
      expect(layoutManager).toHaveStyle({
        '--reader-font-size': '20px',
        '--reader-line-height': '1.8',
        '--reader-font-family': 'sans'
      })
    })
  })

  describe('responsive behavior', () => {
    it('should apply correct mobile attributes', () => {
      mockUseReaderLayout.isMobile = true

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByLabelText('Skip to main content').parentElement
      expect(layoutManager).toHaveAttribute('data-mobile', 'true')
    })

    it('should handle different breakpoints', () => {
      mockUseReaderLayout.currentBreakpoint = 'tablet'

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByLabelText('Skip to main content').parentElement
      expect(layoutManager).toHaveAttribute('data-breakpoint', 'tablet')
    })
  })

  describe('sidebar behavior', () => {
    it('should render sidebar open state correctly', () => {
      mockUseReaderLayout.layoutConfig.sidebarOpen = true

      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const layoutManager = screen.getByLabelText('Skip to main content').parentElement
      expect(layoutManager).toHaveAttribute('data-sidebar-open', 'true')
      expect(layoutManager).toHaveStyle({
        '--sidebar-open': '1'
      })
    })
  })

  describe('overlay container', () => {
    it('should render overlay container', () => {
      render(
        <TestWrapper>
          <ReaderLayoutManager preferences={defaultPreferences}>
            <div>Test content</div>
          </ReaderLayoutManager>
        </TestWrapper>
      )

      const overlayContainer = document.querySelector('[data-layout-area="overlay-container"]')
      expect(overlayContainer).toBeInTheDocument()
      expect(overlayContainer).toHaveClass('fixed', 'inset-0', 'z-50', 'pointer-events-none')
    })
  })
})

describe('LAYOUT_CONFIGURATIONS', () => {
  it('should provide default layout configuration', () => {
    expect(LAYOUT_CONFIGURATIONS.DEFAULT).toEqual({
      toolbarPosition: 'top',
      contentWidth: 'contained',
      sidebarOpen: false
    })
  })

  it('should provide desktop focused layout configuration', () => {
    expect(LAYOUT_CONFIGURATIONS.DESKTOP_FOCUSED).toEqual({
      toolbarPosition: 'side',
      contentWidth: 'narrow',
      sidebarOpen: true
    })
  })

  it('should provide mobile compact layout configuration', () => {
    expect(LAYOUT_CONFIGURATIONS.MOBILE_COMPACT).toEqual({
      toolbarPosition: 'top',
      contentWidth: 'full',
      sidebarOpen: false
    })
  })

  it('should provide presentation layout configuration', () => {
    expect(LAYOUT_CONFIGURATIONS.PRESENTATION).toEqual({
      toolbarPosition: 'bottom',
      contentWidth: 'full',
      sidebarOpen: false
    })
  })
})
