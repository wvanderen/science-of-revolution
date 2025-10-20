import { render, screen } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReaderProvider, useReader } from '../ReaderContext'
import { type HighlightWithNote } from '../../../highlights/hooks/useHighlights'

const makeHighlight = (overrides: Partial<HighlightWithNote> = {}): HighlightWithNote => {
  const timestamp = '2025-10-19T12:00:00.000Z'
  return {
    id: 'highlight-id',
    user_id: 'user-1',
    resource_section_id: 'section-1',
    start_pos: 0,
    end_pos: 10,
    text_content: 'Sample highlight',
    color: 'yellow',
    visibility: 'private',
    created_at: timestamp,
    updated_at: timestamp,
    note: null,
    ...overrides
  }
}

// Test wrapper component
function TestComponent({ children }: { children?: React.ReactNode }) {
  return (
    <ReaderProvider>
      {children}
    </ReaderProvider>
  )
}

// Test consumer component
function TestConsumer() {
  const reader = useReader()

  return (
    <div data-testid="reader-data">
      <span data-testid="current-section">{reader.state.currentSectionId}</span>
      <span data-testid="selected-highlight">{reader.state.selectedHighlightId}</span>
      <span data-testid="menu-position">{reader.state.menuPosition ? `${reader.state.menuPosition.x},${reader.state.menuPosition.y}` : null}</span>
      <span data-testid="preferences-open">{reader.state.isPreferencesOpen.toString()}</span>
      <span data-testid="edit-open">{reader.state.isEditDocumentOpen.toString()}</span>
      <span data-testid="scroll-percent">{reader.state.localScrollPercent}</span>
      <button
        data-testid="set-section-btn"
        onClick={() => reader.actions.setCurrentSectionId('section-1')}
      >
        Set Section
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

describe('ReaderProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides initial state with default values', () => {
    render(
      <TestComponent>
        <TestConsumer />
      </TestComponent>
    )

    expect(screen.getByTestId('current-section')).toHaveTextContent('')
    expect(screen.getByTestId('selected-highlight')).toHaveTextContent('')
    expect(screen.getByTestId('menu-position')).toHaveTextContent('')
    expect(screen.getByTestId('preferences-open')).toHaveTextContent('false')
    expect(screen.getByTestId('edit-open')).toHaveTextContent('false')
    expect(screen.getByTestId('scroll-percent')).toHaveTextContent('0')
  })

  it('allows state updates through actions', async () => {
    render(
      <TestComponent>
        <TestConsumer />
      </TestComponent>
    )

    // Verify initial state
    expect(screen.getByTestId('current-section')).toHaveTextContent('')

    // Click button to update section
    await screen.getByTestId('set-section-btn').click()

    // State should be updated
    expect(screen.getByTestId('current-section')).toHaveTextContent('section-1')
  })

  it('toggles boolean state correctly', async () => {
    render(
      <TestComponent>
        <TestConsumer />
      </TestComponent>
    )

    // Verify initial state
    expect(screen.getByTestId('preferences-open')).toHaveTextContent('false')

    // Click button to toggle preferences
    await screen.getByTestId('toggle-preferences-btn').click()

    // State should be updated
    expect(screen.getByTestId('preferences-open')).toHaveTextContent('true')
  })

  it('provides refs object with all required methods', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: TestComponent
    })

    expect(result.current.refs).toBeDefined()
    expect(typeof result.current.refs.getSectionRefs).toBe('function')
    expect(typeof result.current.refs.setObserverRef).toBe('function')
    expect(typeof result.current.refs.getCurrentSectionIdRef).toBe('function')
    expect(typeof result.current.refs.setCurrentSectionIdRef).toBe('function')
  })

  it('provides all required actions', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: TestComponent
    })

    expect(result.current.actions).toBeDefined()
    expect(typeof result.current.actions.setCurrentSectionId).toBe('function')
    expect(typeof result.current.actions.setSelectedHighlightId).toBe('function')
    expect(typeof result.current.actions.setMenuPosition).toBe('function')
    expect(typeof result.current.actions.setNoteHighlightId).toBe('function')
    expect(typeof result.current.actions.setIsPreferencesOpen).toBe('function')
    expect(typeof result.current.actions.setIsEditDocumentOpen).toBe('function')
    expect(typeof result.current.actions.setLocalScrollPercent).toBe('function')
    expect(typeof result.current.actions.setSectionHighlights).toBe('function')
  })

  it('provides complete state object', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: TestComponent
    })

    expect(result.current.state).toBeDefined()
    expect(result.current.state).toHaveProperty('currentSectionId')
    expect(result.current.state).toHaveProperty('selectedHighlightId')
    expect(result.current.state).toHaveProperty('menuPosition')
    expect(result.current.state).toHaveProperty('noteHighlightId')
    expect(result.current.state).toHaveProperty('isPreferencesOpen')
    expect(result.current.state).toHaveProperty('isEditDocumentOpen')
    expect(result.current.state).toHaveProperty('localScrollPercent')
    expect(result.current.state).toHaveProperty('sectionHighlights')
  })

  it('updates sectionHighlights with functional updater', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: TestComponent
    })

    const newHighlights = {
      'section-1': [
        makeHighlight({ id: 'h1', text_content: 'Test highlight' })
      ]
    }

    // Test direct value assignment
    act(() => {
      result.current.actions.setSectionHighlights(newHighlights)
    })
    expect(result.current.state.sectionHighlights).toEqual(newHighlights)

    // Test functional updater
    act(() => {
      result.current.actions.setSectionHighlights(prev => ({
        ...prev,
        'section-2': [
          makeHighlight({ id: 'h2', resource_section_id: 'section-2', text_content: 'Another highlight' })
        ]
      }))
    })

    expect(result.current.state.sectionHighlights).toHaveProperty('section-1')
    expect(result.current.state.sectionHighlights).toHaveProperty('section-2')
  })

  it('handles complex menu position updates', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: TestComponent
    })

    const position = { x: 100, y: 200 }

    act(() => {
      result.current.actions.setMenuPosition(position)
    })

    expect(result.current.state.menuPosition).toEqual(position)

    // Test null position
    act(() => {
      result.current.actions.setMenuPosition(null)
    })
    expect(result.current.state.menuPosition).toBeNull()
  })
})
