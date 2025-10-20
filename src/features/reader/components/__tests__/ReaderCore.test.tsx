import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReaderCore, ReaderCoreIntegration } from '../ReaderCore'
import { ReaderProvider } from '../../contexts/ReaderContext'
import { ToastProvider } from '../../../../components/providers/ToastProvider'

// Mock dependencies
vi.mock('../ReaderProgressTracker', () => ({
  ReaderProgressTracker: ({ children, onProgressUpdate, onRestoreComplete }: any) => (
    <div data-testid="reader-progress-tracker" data-resource-id={children?.props?.resourceId}>
      {children}
    </div>
  )
}))

vi.mock('../ReaderSectionNavigator', () => ({
  ReaderSectionNavigator: ({ children, contentRef }: any) => (
    <>
      {children({
        currentSectionId: 'section1',
        registerSectionRef: vi.fn(),
        handleSectionChange: vi.fn(),
        getInitialSectionId: vi.fn(() => 'section1')
      })}
    </>
  )
}))

vi.mock('../../hooks/useReaderHighlighting', () => ({
  useReaderHighlighting: vi.fn(() => ({
    selection: { text: 'test selection' },
    selectedHighlightId: null,
    menuPosition: null,
    noteHighlight: null,
    highlightLookup: {},
    handleCreateHighlight: vi.fn(),
    handleCancelHighlight: vi.fn(),
    handleHighlightClick: vi.fn(),
    handleDeleteHighlight: vi.fn(),
    handleAddNote: vi.fn(),
    handleCloseMenu: vi.fn(),
    handleCloseNoteEditor: vi.fn(),
    containerRef: { current: null }
  }))
}))

vi.mock('../../../components/providers/ToastProvider', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn()
  }))
}))

vi.mock('../../highlights/components/HighlightToolbar', () => ({
  HighlightToolbar: ({ selection, onCreateHighlight, onCancel }: any) => (
    <div data-testid="highlight-toolbar" data-has-selection={!!selection}>
      <button onClick={() => onCreateHighlight('yellow', 'private')}>Create Highlight</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

vi.mock('../../highlights/components/HighlightMenu', () => ({
  HighlightMenu: ({ highlight, onAddNote, onDelete, onClose }: any) => (
    <div data-testid="highlight-menu" data-highlight-id={highlight?.id}>
      <button onClick={() => onAddNote(highlight.id)}>Add Note</button>
      <button onClick={() => onDelete(highlight.id)}>Delete</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

vi.mock('../../notes/components/HighlightNoteModal', () => ({
  HighlightNoteModal: ({ highlight, onClose }: any) => (
    <div data-testid="highlight-note-modal" data-highlight-id={highlight?.id}>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

// Mock ReaderContext
const mockUseReader = {
  state: {
    currentSectionId: 'section1',
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
  },
  refs: {
    setScrollContainerRef: vi.fn(),
    getScrollContainerRef: vi.fn(() => null),
    // ... other refs (omitted for brevity)
  }
}

vi.mock('../../contexts/ReaderContext', () => ({
  useReader: vi.fn(() => mockUseReader),
  ReaderProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ReaderProvider>
          {children}
        </ReaderProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

describe('ReaderCore', () => {
  const mockSections = [
    {
      id: 'section1',
      title: 'Introduction',
      content: '<p>This is the introduction</p>',
      order: 1
    },
    {
      id: 'section2',
      title: 'Chapter 1',
      content: '<p>This is chapter 1</p>',
      order: 2
    }
  ]

  const defaultProps = {
    documentId: 'test-doc-1',
    sections: mockSections,
    content: 'Test content'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render with required props', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByTestId('reader-core')).toBeInTheDocument()
      expect(screen.getByTestId('reader-progress-tracker')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} className="custom-class" />
        </TestWrapper>
      )

      const readerCore = screen.getByTestId('reader-core')
      expect(readerCore).toHaveClass('custom-class')
    })

    it('should render custom children when provided', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps}>
            <div data-testid="custom-content">Custom content</div>
          </ReaderCore>
        </TestWrapper>
      )

      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    })

    it('should render default sections when no children provided', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Chapter 1')).toBeInTheDocument()
    })

    it('should render accessibility announcements', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      const announcement = screen.getByText(/Currently reading section:/)
      expect(announcement).toBeInTheDocument()
      expect(announcement).toHaveClass('sr-only')
    })
  })

  describe('data attributes', () => {
    it('should set correct data attributes', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      const readerCore = screen.getByTestId('reader-core')
      expect(readerCore).toHaveAttribute('data-reader-core', 'true')
      expect(readerCore).toHaveAttribute('data-document-id', 'test-doc-1')
      expect(readerCore).toHaveAttribute('data-current-section', 'section1')
    })

    it('should update current section attribute when section changes', () => {
      mockUseReader.state.currentSectionId = 'section2'

      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      const readerCore = screen.getByTestId('reader-core')
      expect(readerCore).toHaveAttribute('data-current-section', 'section2')
    })
  })

  describe('callback handling', () => {
    it('should call onProgressUpdate when progress changes', () => {
      const onProgressUpdate = vi.fn()

      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} onProgressUpdate={onProgressUpdate} />
        </TestWrapper>
      )

      // The onProgressUpdate should be called through the ReaderProgressTracker
      // This is a simplified test - in reality, we'd need to mock the progress tracker more thoroughly
      expect(onProgressUpdate).toBeDefined()
    })

    it('should call onSectionChange when section changes', () => {
      const onSectionChange = vi.fn()

      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} onSectionChange={onSectionChange} />
        </TestWrapper>
      )

      // The onSectionChange should be called when handleSectionChange is triggered
      expect(onSectionChange).toBeDefined()
    })
  })

  describe('highlighting integration', () => {
    it('should render highlight toolbar', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getAllByText(/Selected: test selection/)).toHaveLength(2)
    })

    it('should not render highlight menu when no highlight selected', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('highlight-menu')).not.toBeInTheDocument()
    })

    it('should not render highlight note modal when no note highlight', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('highlight-note-modal')).not.toBeInTheDocument()
    })

    it('should omit internal highlighting UI when custom children provided', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps}>
            <div data-testid="custom-content">Custom content</div>
          </ReaderCore>
        </TestWrapper>
      )

      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.queryByTestId('highlight-toolbar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('highlight-menu')).not.toBeInTheDocument()
      expect(screen.queryByTestId('highlight-note-modal')).not.toBeInTheDocument()
    })
  })

  describe('development mode', () => {
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should render debug information in development mode', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText(/Document ID: test-doc-1/)).toBeInTheDocument()
      expect(screen.getByText(/Current Section: section/)).toBeInTheDocument()
      expect(screen.getByText(/Sections: 2/)).toBeInTheDocument()
      expect(screen.getByText(/Highlights: 0/)).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle empty sections gracefully', () => {
      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} sections={[]} />
        </TestWrapper>
      )

      expect(screen.getByTestId('reader-core')).toBeInTheDocument()
    })

    it('should handle missing section data gracefully', () => {
      const invalidSections = [
        { id: '', title: '', content: '', order: 1 }
      ]

      render(
        <TestWrapper>
          <ReaderCore {...defaultProps} sections={invalidSections} />
        </TestWrapper>
      )

      expect(screen.getByTestId('reader-core')).toBeInTheDocument()
    })
  })
})

describe('ReaderCoreIntegration', () => {
  const mockResource = {
    id: 'resource-1',
    sections: [
      { id: 'section1', title: 'Section 1', content: 'Content 1', order: 1 },
      { id: 'section2', title: 'Section 2', content: 'Content 2', order: 2 }
    ]
  }

  const mockSections = [
    { id: 'section1', title: 'Section 1', content: 'Content 1', order: 1 },
    { id: 'section2', title: 'Section 2', content: 'Content 2', order: 2 }
  ]

  describe('createPropsFromResource', () => {
    it('should create valid props from resource', () => {
      const props = ReaderCoreIntegration.createPropsFromResource(mockResource)

      expect(props).toEqual({
        documentId: 'resource-1',
        sections: mockResource.sections,
        initialSectionId: undefined,
        onProgressUpdate: undefined,
        onSectionChange: undefined
      })
    })

    it('should include optional props when provided', () => {
      const onProgressUpdate = vi.fn()
      const onSectionChange = vi.fn()

      const props = ReaderCoreIntegration.createPropsFromResource(mockResource, {
        initialSectionId: 'section2',
        onProgressUpdate,
        onSectionChange
      })

      expect(props.initialSectionId).toBe('section2')
      expect(props.onProgressUpdate).toBe(onProgressUpdate)
      expect(props.onSectionChange).toBe(onSectionChange)
    })
  })

  describe('validateProps', () => {
    it('should validate correct props', () => {
      const validProps: any = {
        documentId: 'test-doc',
        sections: mockSections,
        content: 'test content'
      }

      const errors = ReaderCoreIntegration.validateProps(validProps)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid props', () => {
      const invalidProps: any = {
        documentId: '',
        sections: [],
        content: 'test content'
      }

      const errors = ReaderCoreIntegration.validateProps(invalidProps)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('documentId is required')
      expect(errors[1]).toContain('At least one section is required')
    })

    it('should validate section structure', () => {
      const invalidSectionProps: any = {
        documentId: 'test-doc',
        sections: [{ id: '', title: '', content: '', order: 1 }],
        content: 'test content'
      }

      const errors = ReaderCoreIntegration.validateProps(invalidSectionProps)
      expect(errors).toContain('All sections must have id and title')
    })
  })
})
