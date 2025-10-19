import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReader, ReaderProvider } from '../../contexts/ReaderContext'
import { HighlightWithNote } from '../../highlights/hooks/useHighlights'

// Test wrapper for the hook
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ReaderProvider>{children}</ReaderProvider>
  }
}

describe('useReader Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error when used outside ReaderProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useReader())
    }).toThrow('useReader must be used within a ReaderProvider')

    consoleSpy.mockRestore()
  })

  it('returns reader context when used within ReaderProvider', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('state')
    expect(result.current).toHaveProperty('actions')
    expect(result.current).toHaveProperty('refs')
  })

  it('provides access to all state properties', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { state } = result.current

    expect(state.currentSectionId).toBe(null)
    expect(state.selectedHighlightId).toBe(null)
    expect(state.menuPosition).toBe(null)
    expect(state.noteHighlightId).toBe(null)
    expect(state.isPreferencesOpen).toBe(false)
    expect(state.isEditDocumentOpen).toBe(false)
    expect(state.localScrollPercent).toBe(0)
    expect(state.sectionHighlights).toEqual({})
  })

  it('provides functional actions for state updates', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { actions } = result.current

    // Test setCurrentSectionId
    act(() => {
      actions.setCurrentSectionId('section-123')
    })
    expect(result.current.state.currentSectionId).toBe('section-123')

    // Test setSelectedHighlightId
    act(() => {
      actions.setSelectedHighlightId('highlight-456')
    })
    expect(result.current.state.selectedHighlightId).toBe('highlight-456')

    // Test setMenuPosition
    act(() => {
      actions.setMenuPosition({ x: 100, y: 200 })
    })
    expect(result.current.state.menuPosition).toEqual({ x: 100, y: 200 })

    // Test setNoteHighlightId
    act(() => {
      actions.setNoteHighlightId('note-highlight-789')
    })
    expect(result.current.state.noteHighlightId).toBe('note-highlight-789')

    // Test setIsPreferencesOpen
    act(() => {
      actions.setIsPreferencesOpen(true)
    })
    expect(result.current.state.isPreferencesOpen).toBe(true)

    // Test setIsEditDocumentOpen
    act(() => {
      actions.setIsEditDocumentOpen(true)
    })
    expect(result.current.state.isEditDocumentOpen).toBe(true)

    // Test setLocalScrollPercent
    act(() => {
      actions.setLocalScrollPercent(75.5)
    })
    expect(result.current.state.localScrollPercent).toBe(75.5)
  })

  it('handles setSectionHighlights with direct value and functional updater', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { actions } = result.current

    // Test direct value assignment
    const highlights1: Record<string, HighlightWithNote[]> = {
      'section-1': [{ id: 'h1', text: 'First highlight', note: 'Note 1' }]
    }

    act(() => {
      actions.setSectionHighlights(highlights1)
    })
    expect(result.current.state.sectionHighlights).toEqual(highlights1)

    // Test functional updater
    const highlights2: HighlightWithNote[] = [{ id: 'h2', text: 'Second highlight', note: 'Note 2' }]

    act(() => {
      actions.setSectionHighlights(prev => ({
        ...prev,
        'section-2': highlights2
      }))
    })

    expect(result.current.state.sectionHighlights).toEqual({
      'section-1': highlights1['section-1'],
      'section-2': highlights2
    })
  })

  it('provides access to refs getters and setters', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { refs } = result.current

    // Test that all ref methods exist
    expect(typeof refs.getSectionRefs).toBe('function')
    expect(typeof refs.getObserverRef).toBe('function')
    expect(typeof refs.setObserverRef).toBe('function')
    expect(typeof refs.getCurrentSectionIdRef).toBe('function')
    expect(typeof refs.setCurrentSectionIdRef).toBe('function')
    expect(typeof refs.getIsProgrammaticScrollRef).toBe('function')
    expect(typeof refs.setIsProgrammaticScrollRef).toBe('function')
    expect(typeof refs.getHighlightSignaturesRef).toBe('function')
    expect(typeof refs.setHighlightSignaturesRef).toBe('function')
    expect(typeof refs.getLastReportedProgressRef).toBe('function')
    expect(typeof refs.setLastReportedProgressRef).toBe('function')
    expect(typeof refs.getScrollContainerRef).toBe('function')
    expect(typeof refs.setScrollContainerRef).toBe('function')
    expect(typeof refs.getResumeScrollPercentRef).toBe('function')
    expect(typeof refs.setResumeScrollPercentRef).toBe('function')
    expect(typeof refs.getHasInitializedSectionRef).toBe('function')
    expect(typeof refs.setHasInitializedSectionRef).toBe('function')
    expect(typeof refs.getIsRestoringProgressRef).toBe('function')
    expect(typeof refs.setIsRestoringProgressRef).toBe('function')
    expect(typeof refs.getProgressSignatureRef).toBe('function')
    expect(typeof refs.setProgressSignatureRef).toBe('function')
    expect(typeof refs.getLocalScrollPercentRef).toBe('function')
    expect(typeof refs.setLocalScrollPercentRef).toBe('function')
    expect(typeof refs.getRestoreTargetPercentRef).toBe('function')
    expect(typeof refs.setRestoreTargetPercentRef).toBe('function')
    expect(typeof refs.getRestoreAttemptsRef).toBe('function')
    expect(typeof refs.setRestoreAttemptsRef).toBe('function')
    expect(typeof refs.getRestoreFrameRef).toBe('function')
    expect(typeof refs.setRestoreFrameRef).toBe('function')
    expect(typeof refs.getParagraphNavigationRef).toBe('function')
    expect(typeof refs.setParagraphNavigationRef).toBe('function')
    expect(typeof refs.getLatestProgressRef).toBe('function')
    expect(typeof refs.setLatestProgressRef).toBe('function')
    expect(typeof refs.getUpdateProgressRef).toBe('function')
    expect(typeof refs.setUpdateProgressRef).toBe('function')
    expect(typeof refs.getSessionUserRef).toBe('function')
    expect(typeof refs.setSessionUserRef).toBe('function')
  })

  it('allows ref value manipulation through getters and setters', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { refs } = result.current

    // Test current section ref
    expect(refs.getCurrentSectionIdRef()).toBe(null)

    act(() => {
      refs.setCurrentSectionIdRef('section-test')
    })
    expect(refs.getCurrentSectionIdRef()).toBe('section-test')

    // Test programmatic scroll ref
    expect(refs.getIsProgrammaticScrollRef()).toBe(false)

    act(() => {
      refs.setIsProgrammaticScrollRef(true)
    })
    expect(refs.getIsProgrammaticScrollRef()).toBe(true)

    // Test highlight signatures ref
    expect(refs.getHighlightSignaturesRef()).toEqual({})

    const signatures = { 'h1': 'sig1', 'h2': 'sig2' }
    act(() => {
      refs.setHighlightSignaturesRef(signatures)
    })
    expect(refs.getHighlightSignaturesRef()).toEqual(signatures)

    // Test last reported progress ref
    expect(refs.getLastReportedProgressRef()).toBe(null)

    act(() => {
      refs.setLastReportedProgressRef(85.5)
    })
    expect(refs.getLastReportedProgressRef()).toBe(85.5)
  })

  it('handles complex ref data types', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { refs } = result.current

    // Test latest progress ref with complex object
    expect(refs.getLatestProgressRef()).toBe(null)

    const progressData = {
      sectionId: 'section-1',
      percent: 45.7,
      resourceId: 'resource-123'
    }

    act(() => {
      refs.setLatestProgressRef(progressData)
    })
    expect(refs.getLatestProgressRef()).toEqual(progressData)

    // Test restore attempts ref
    expect(refs.getRestoreAttemptsRef()).toBe(0)

    act(() => {
      refs.setRestoreAttemptsRef(3)
    })
    expect(refs.getRestoreAttemptsRef()).toBe(3)

    // Test local scroll percent ref
    expect(refs.getLocalScrollPercentRef()).toBe(0)

    act(() => {
      refs.setLocalScrollPercentRef(67.8)
    })
    expect(refs.getLocalScrollPercentRef()).toBe(67.8)
  })

  
  it('handles concurrent state updates correctly', () => {
    const { result } = renderHook(() => useReader(), {
      wrapper: createWrapper()
    })

    const { actions } = result.current

    // Perform multiple state updates in sequence
    act(() => {
      actions.setCurrentSectionId('section-1')
      actions.setSelectedHighlightId('highlight-1')
      actions.setMenuPosition({ x: 50, y: 100 })
      actions.setLocalScrollPercent(25.5)
    })

    expect(result.current.state.currentSectionId).toBe('section-1')
    expect(result.current.state.selectedHighlightId).toBe('highlight-1')
    expect(result.current.state.menuPosition).toEqual({ x: 50, y: 100 })
    expect(result.current.state.localScrollPercent).toBe(25.5)
  })
})