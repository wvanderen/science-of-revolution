import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReaderProvider, useReader } from '../../../src/features/reader/contexts/ReaderContext'

// Simple test component to verify context functionality
function TestReaderComponent() {
  const reader = useReader()

  return (
    <div data-testid="reader-test-component">
      <span data-testid="current-section">{reader.state.currentSectionId || 'null'}</span>
      <span data-testid="preferences-open">{reader.state.isPreferencesOpen.toString()}</span>
      <span data-testid="scroll-percent">{reader.state.localScrollPercent.toString()}</span>
      <button
        data-testid="update-section-btn"
        onClick={() => reader.actions.setCurrentSectionId('test-section')}
      >
        Update Section
      </button>
      <button
        data-testid="toggle-preferences-btn"
        onClick={() => reader.actions.setIsPreferencesOpen(true)}
      >
        Toggle Preferences
      </button>
    </div>
  )
}

describe('Reader Context Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reader context provider successfully', () => {
    render(
      <ReaderProvider>
        <TestReaderComponent />
      </ReaderProvider>
    )

    expect(screen.getByTestId('reader-test-component')).toBeInTheDocument()
    expect(screen.getByTestId('current-section')).toHaveTextContent('null')
    expect(screen.getByTestId('preferences-open')).toHaveTextContent('false')
    expect(screen.getByTestId('scroll-percent')).toHaveTextContent('0')
  })

  it('handles state updates through context actions', async () => {
    render(
      <ReaderProvider>
        <TestReaderComponent />
      </ReaderProvider>
    )

    // Verify initial state
    expect(screen.getByTestId('current-section')).toHaveTextContent('null')

    // Update section
    await screen.getByTestId('update-section-btn').click()
    expect(screen.getByTestId('current-section')).toHaveTextContent('test-section')

    // Toggle preferences
    await screen.getByTestId('toggle-preferences-btn').click()
    expect(screen.getByTestId('preferences-open')).toHaveTextContent('true')
  })

  it('provides access to all context refs', () => {
    let contextValue: any = null

    function ContextReaderComponent() {
      contextValue = useReader()
      return <div data-testid="context-reader">Context Reader</div>
    }

    render(
      <ReaderProvider>
        <ContextReaderComponent />
      </ReaderProvider>
    )

    expect(contextValue).toBeDefined()
    expect(contextValue.refs).toBeDefined()

    // Test key ref methods exist
    expect(typeof contextValue.refs.getSectionRefs).toBe('function')
    expect(typeof contextValue.refs.setObserverRef).toBe('function')
    expect(typeof contextValue.refs.getCurrentSectionIdRef).toBe('function')
    expect(typeof contextValue.refs.setCurrentSectionIdRef).toBe('function')
    expect(typeof contextValue.refs.getIsProgrammaticScrollRef).toBe('function')
    expect(typeof contextValue.refs.setIsProgrammaticScrollRef).toBe('function')
  })

  it('maintains state consistency across multiple components', () => {
    let firstContextValue: any = null
    let secondContextValue: any = null

    function FirstReaderComponent() {
      firstContextValue = useReader()
      return <div data-testid="first-reader">First Reader</div>
    }

    function SecondReaderComponent() {
      secondContextValue = useReader()
      return <div data-testid="second-reader">Second Reader</div>
    }

    render(
      <ReaderProvider>
        <FirstReaderComponent />
        <SecondReaderComponent />
      </ReaderProvider>
    )

    // Both components should have access to the same context
    expect(firstContextValue).toBeDefined()
    expect(secondContextValue).toBeDefined()
    expect(firstContextValue.state).toBe(secondContextValue.state)
    expect(firstContextValue.actions).toBe(secondContextValue.actions)
    expect(firstContextValue.refs).toBe(secondContextValue.refs)
  })

  it('handles complex state updates through context', () => {
    let contextValue: any = null

    function StateUpdateComponent() {
      contextValue = useReader()
      return <div data-testid="state-update-reader">State Update Reader</div>
    }

    render(
      <ReaderProvider>
        <StateUpdateComponent />
      </ReaderProvider>
    )

    const { actions } = contextValue

    // Test multiple state updates
    act(() => {
      actions.setCurrentSectionId('section-1')
    })
    expect(contextValue.state.currentSectionId).toBe('section-1')

    act(() => {
      actions.setSelectedHighlightId('highlight-1')
    })
    expect(contextValue.state.selectedHighlightId).toBe('highlight-1')

    act(() => {
      actions.setMenuPosition({ x: 100, y: 200 })
    })
    expect(contextValue.state.menuPosition).toEqual({ x: 100, y: 200 })

    act(() => {
      actions.setNoteHighlightId('note-1')
    })
    expect(contextValue.state.noteHighlightId).toBe('note-1')

    act(() => {
      actions.setIsPreferencesOpen(true)
    })
    expect(contextValue.state.isPreferencesOpen).toBe(true)

    act(() => {
      actions.setIsEditDocumentOpen(true)
    })
    expect(contextValue.state.isEditDocumentOpen).toBe(true)

    act(() => {
      actions.setLocalScrollPercent(75.5)
    })
    expect(contextValue.state.localScrollPercent).toBe(75.5)
  })

  it('supports sectionHighlights with functional updates', () => {
    let contextValue: any = null

    function HighlightsComponent() {
      contextValue = useReader()
      return <div data-testid="highlights-reader">Highlights Reader</div>
    }

    render(
      <ReaderProvider>
        <HighlightsComponent />
      </ReaderProvider>
    )

    const { actions } = contextValue

    // Test direct value assignment
    const highlights1 = { 'section-1': [{ id: 'h1', text: 'Highlight 1', note: '' }] }

    act(() => {
      actions.setSectionHighlights(highlights1)
    })
    expect(contextValue.state.sectionHighlights).toEqual(highlights1)

    // Test functional updater
    act(() => {
      actions.setSectionHighlights(prev => ({
        ...prev,
        'section-2': [{ id: 'h2', text: 'Highlight 2', note: '' }]
      }))
    })

    expect(contextValue.state.sectionHighlights).toHaveProperty('section-1')
    expect(contextValue.state.sectionHighlights).toHaveProperty('section-2')
    expect(Object.keys(contextValue.state.sectionHighlights)).toHaveLength(2)
  })

  it('provides error handling for useReader outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestReaderComponent />)
    }).toThrow('useReader must be used within a ReaderProvider')

    consoleSpy.mockRestore()
  })

  it('maintains ref state persistence across updates', () => {
    let contextValue: any = null

    function RefTestComponent() {
      contextValue = useReader()
      return <div data-testid="ref-test-reader">Ref Test Reader</div>
    }

    render(
      <ReaderProvider>
        <RefTestComponent />
      </ReaderProvider>
    )

    const { refs } = contextValue

    // Test ref getter/setter functionality
    expect(refs.getCurrentSectionIdRef()).toBe(null)

    refs.setCurrentSectionIdRef('test-section')
    expect(refs.getCurrentSectionIdRef()).toBe('test-section')

    refs.setIsProgrammaticScrollRef(true)
    expect(refs.getIsProgrammaticScrollRef()).toBe(true)

    refs.setLastReportedProgressRef(50.5)
    expect(refs.getLastReportedProgressRef()).toBe(50.5)

    refs.setRestoreAttemptsRef(3)
    expect(refs.getRestoreAttemptsRef()).toBe(3)
  })

  it('supports performance optimizations through context', () => {
    const startTime = performance.now()

    render(
      <ReaderProvider>
        <TestReaderComponent />
      </ReaderProvider>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Context should initialize quickly (less than 50ms)
    expect(renderTime).toBeLessThan(50)
  })
})