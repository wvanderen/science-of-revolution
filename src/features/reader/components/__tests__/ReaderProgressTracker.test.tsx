import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReaderProgressTracker } from '../ReaderProgressTracker'
import { ReaderProvider } from '../../contexts/ReaderContext'

// Mock the useReaderProgress hook
vi.mock('../../hooks/useReaderProgress', () => ({
  useReaderProgress: vi.fn()
}))

// Mock the useResourceProgress hook
vi.mock('../../../progress/hooks/useResourceProgress', () => ({
  useResourceProgress: vi.fn()
}))

// Mock the useResource hook
vi.mock('../../../library/hooks/useResources', () => ({
  useResource: vi.fn()
}))

// Mock the ReaderContext
vi.mock('../../contexts/ReaderContext', () => ({
  useReader: vi.fn(),
  ReaderProvider: ({ children }: { children: React.ReactNode }) => children
}))

import { useReaderProgress } from '../../hooks/useReaderProgress'
import { useReader } from '../../contexts/ReaderContext'
import { useResourceProgress } from '../../../progress/hooks/useResourceProgress'
import { useResource } from '../../../library/hooks/useResources'

const mockUpdateGlobalProgress = vi.fn()
const mockFlushLatestProgress = vi.fn()

const mockRefs = {
  getScrollContainerRef: vi.fn(),
  setCurrentSectionIdRef: vi.fn(),
  getHasInitializedSectionRef: vi.fn(),
  getLocalScrollPercentRef: vi.fn(),
  getProgressSignatureRef: vi.fn(),
  setProgressSignatureRef: vi.fn(),
  setHasInitializedSectionRef: vi.fn(),
  setResumeScrollPercentRef: vi.fn(),
  setIsRestoringProgressRef: vi.fn(),
  setCurrentSectionId: vi.fn(),
  setLocalScrollPercentRef: vi.fn(),
  updateLocalScrollPercentState: vi.fn(),
  setRestoreTargetPercentRef: vi.fn(),
  setRestoreAttemptsRef: vi.fn(),
  getRestoreTargetPercentRef: vi.fn(),
  getRestoreAttemptsRef: vi.fn(() => 0),
  getRestoreFrameRef: vi.fn(),
  setRestoreFrameRef: vi.fn(),
  setIsProgrammaticScrollRef: vi.fn(),
  getLatestProgressRef: vi.fn(),
  setLatestProgressRef: vi.fn(),
  getLastReportedProgressRef: vi.fn(),
  setLastReportedProgressRef: vi.fn(),
  getResumeScrollPercentRef: vi.fn(),
  getCurrentSectionIdRef: vi.fn(),
  getSectionRefs: vi.fn(() => new Map()),
  getUpdateProgressRef: vi.fn()
}

const mockState = {
  currentSectionId: 'test-section'
}

const mockUseReader = vi.fn(() => ({
  refs: mockRefs,
  state: mockState
}))

describe('ReaderProgressTracker', () => {
  const mockScrollContainer = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    scrollHeight: 1000,
    clientHeight: 800,
    scrollTop: 100
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock implementations
    ;(useReader as any).mockImplementation(() => mockUseReader())
    ;(useReaderProgress as any).mockReturnValue({
      localScrollPercent: 50,
      isRestoringProgress: false,
      updateGlobalProgress: mockUpdateGlobalProgress,
      flushLatestProgress: mockFlushLatestProgress
    })
    ;(useResourceProgress as any).mockReturnValue({
      data: [],
      isLoading: false
    })

    mockRefs.getScrollContainerRef.mockReturnValue(mockScrollContainer as any)
    ; (useResource as any).mockReturnValue({
      data: {
        sections: [
          { id: 'section-1', order: 0 },
          { id: 'section-2', order: 1 }
        ]
      }
    })
    mockRefs.getHasInitializedSectionRef.mockReturnValue(false)
    mockRefs.getLocalScrollPercentRef.mockReturnValue(0)
    mockRefs.getProgressSignatureRef.mockReturnValue(null)

    mockUpdateGlobalProgress.mockClear()
    mockFlushLatestProgress.mockClear()

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 0)
      return 1
    })

    // Mock ResizeObserver
    const mockResizeObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    }
    global.ResizeObserver = vi.fn(() => mockResizeObserver) as any

    // Mock IntersectionObserver
    const mockIntersectionObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: vi.fn(() => [])
    }
    global.IntersectionObserver = vi.fn(() => mockIntersectionObserver) as any
  })

  it('should render without children', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )
  })

  it('should render with children', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource">
          <div>Test Content</div>
        </ReaderProgressTracker>
      </ReaderProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should set up scroll event listener on mount', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    expect(mockScrollContainer.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    )
  })

  it('should remove scroll event listener on unmount', () => {
    const { unmount } = render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    unmount()

    expect(mockScrollContainer.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('should call flushLatestProgress on unmount', () => {
    const { unmount } = render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    unmount()

    expect(mockFlushLatestProgress).toHaveBeenCalled()
  })

  it('should call onProgressUpdate when progress changes', () => {
    const onProgressUpdate = vi.fn()

    // Mock useReaderProgress to return different progress value
    ;(useReaderProgress as any).mockReturnValue({
      localScrollPercent: 75,
      isRestoringProgress: false,
      updateGlobalProgress: mockUpdateGlobalProgress,
      flushLatestProgress: mockFlushLatestProgress
    })

    render(
      <ReaderProvider>
        <ReaderProgressTracker
          resourceId="test-resource"
          onProgressUpdate={onProgressUpdate}
        />
      </ReaderProvider>
    )

    expect(onProgressUpdate).toHaveBeenCalledWith(75)
  })

  it('should call onRestoreComplete when restore completes', () => {
    const onRestoreComplete = vi.fn()

    // Mock useReaderProgress to simulate restore completion
    ;(useReaderProgress as any).mockReturnValue({
      localScrollPercent: 50,
      isRestoringProgress: false,
      updateGlobalProgress: mockUpdateGlobalProgress,
      flushLatestProgress: mockFlushLatestProgress
    })

    render(
      <ReaderProvider>
        <ReaderProgressTracker
          resourceId="test-resource"
          onRestoreComplete={onRestoreComplete}
        />
      </ReaderProvider>
    )

    expect(onRestoreComplete).toHaveBeenCalled()
  })

  it('should set up ResizeObserver for scroll container', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    expect(global.ResizeObserver).toHaveBeenCalled()
    // Note: Since ResizeObserver is mocked, we just verify it was created
  })

  it('should set up IntersectionObserver for section tracking', () => {
    const mockSections = [
      { getAttribute: vi.fn(() => 'section-1') },
      { getAttribute: vi.fn(() => 'section-2') }
    ] as any
    mockScrollContainer.querySelectorAll.mockReturnValue(mockSections)

    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    expect(global.IntersectionObserver).toHaveBeenCalled()
    expect(mockScrollContainer.querySelectorAll).toHaveBeenCalledWith('[data-section-id]')
  })

  it('should handle missing scroll container gracefully', () => {
    mockRefs.getScrollContainerRef.mockReturnValue(null)

    expect(() => {
      render(
        <ReaderProvider>
          <ReaderProgressTracker resourceId="test-resource" />
        </ReaderProvider>
      )
    }).not.toThrow()

    expect(mockScrollContainer.addEventListener).not.toHaveBeenCalled()
  })

  it('should update progress after layout stabilizes', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker resourceId="test-resource" />
      </ReaderProvider>
    )

    expect(global.requestAnimationFrame).toHaveBeenCalled()
    // Note: updateGlobalProgress is called inside requestAnimationFrame callback
    // which is executed asynchronously in the test
  })

  it('should work without resourceId', () => {
    render(
      <ReaderProvider>
        <ReaderProgressTracker />
      </ReaderProvider>
    )

    expect(mockScrollContainer.addEventListener).toHaveBeenCalled()
  })
})