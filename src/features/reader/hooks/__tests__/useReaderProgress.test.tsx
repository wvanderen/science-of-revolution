import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReaderProgress } from '../useReaderProgress'
import { ReaderProvider } from '../../contexts/ReaderContext'

// Mock the ReaderContext
vi.mock('../../contexts/ReaderContext', () => ({
  useReader: vi.fn(),
  ReaderProvider: ({ children }: { children: React.ReactNode }) => children
}))

import { useReader } from '../../contexts/ReaderContext'

const mockRefs = {
  getLatestProgressRef: vi.fn(),
  getSessionUserRef: vi.fn(),
  setLastReportedProgressRef: vi.fn(),
  getUpdateProgressRef: vi.fn(),
  getRestoreFrameRef: vi.fn(),
  setRestoreFrameRef: vi.fn(),
  getRestoreTargetPercentRef: vi.fn(),
  setRestoreTargetPercentRef: vi.fn(),
  setRestoreAttemptsRef: vi.fn(),
  getRestoreAttemptsRef: vi.fn(() => 0),
  setIsRestoringProgressRef: vi.fn(),
  setIsProgrammaticScrollRef: vi.fn(),
  getScrollContainerRef: vi.fn(),
  getCurrentSectionIdRef: vi.fn(),
  setLatestProgressRef: vi.fn(),
  setLocalScrollPercentRef: vi.fn(),
  updateLocalScrollPercentState: vi.fn(),
  getIsRestoringProgressRef: vi.fn(() => false),
  getLastReportedProgressRef: vi.fn(),
  getLocalScrollPercentRef: vi.fn(() => 0)
}

const mockState = {
  localScrollPercent: 0
}

const mockUseReader = vi.fn(() => ({
  refs: mockRefs,
  state: mockState
}))

describe('useReaderProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    ;(useReader as any).mockImplementation(() => mockUseReader())

    mockRefs.getSessionUserRef.mockReturnValue({ id: 'test-user' })
    mockRefs.getUpdateProgressRef.mockReturnValue({
      mutate: vi.fn()
    })
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 0
    })
    mockRefs.getCurrentSectionIdRef.mockReturnValue('test-section')
    mockRefs.getLatestProgressRef.mockReturnValue(null)
    mockRefs.getLastReportedProgressRef.mockReturnValue(null)
    mockRefs.getRestoreTargetPercentRef.mockReturnValue(null)
    mockRefs.getRestoreFrameRef.mockReturnValue(null)
  })

  it('should return initial progress values', () => {
    const { result } = renderHook(() => useReaderProgress('test-resource'))

    expect(result.current.localScrollPercent).toBe(0)
    expect(result.current.isRestoringProgress).toBe(false)
    expect(typeof result.current.updateGlobalProgress).toBe('function')
    expect(typeof result.current.flushLatestProgress).toBe('function')
  })

  it('should calculate progress correctly for normal scroll position', () => {
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 100
    })

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setLocalScrollPercentRef).toHaveBeenCalledWith(50)
    expect(mockRefs.setLatestProgressRef).toHaveBeenCalledWith({
      sectionId: 'test-section',
      percent: 50,
      resourceId: 'test-resource'
    })
  })

  it('should handle short content (100% progress)', () => {
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 0,
      clientHeight: 800,
      scrollTop: 0
    })

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setLocalScrollPercentRef).toHaveBeenCalledWith(100)
  })

  it('should handle near-bottom detection (100% progress)', () => {
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 190 // 10 pixels from bottom
    })

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setLocalScrollPercentRef).toHaveBeenCalledWith(100)
  })

  it('should update progress when threshold is met', () => {
    mockRefs.getLastReportedProgressRef.mockReturnValue(40)
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 100 // 50% progress
    })

    const mockUpdateProgress = { mutate: vi.fn() }
    mockRefs.getUpdateProgressRef.mockReturnValue(mockUpdateProgress)

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setLastReportedProgressRef).toHaveBeenCalledWith(50)
    expect(mockUpdateProgress.mutate).toHaveBeenCalledWith({
      sectionId: 'test-section',
      scrollPercent: 50,
      resourceId: 'test-resource'
    })
  })

  it('should not update progress when restoring', () => {
    mockRefs.getIsRestoringProgressRef.mockReturnValue(true)
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 100
    })

    const mockUpdateProgress = { mutate: vi.fn() }
    mockRefs.getUpdateProgressRef.mockReturnValue(mockUpdateProgress)

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockUpdateProgress.mutate).not.toHaveBeenCalled()
  })

  it('should provide flushLatestProgress function', () => {
    mockRefs.getLatestProgressRef.mockReturnValue({
      sectionId: 'test-section',
      percent: 75,
      resourceId: 'test-resource'
    })

    const mockUpdateProgress = { mutate: vi.fn() }
    mockRefs.getUpdateProgressRef.mockReturnValue(mockUpdateProgress)

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    expect(typeof result.current.flushLatestProgress).toBe('function')

    // Manually call flushLatestProgress to test its functionality
    act(() => {
      result.current.flushLatestProgress()
    })

    expect(mockRefs.setLastReportedProgressRef).toHaveBeenCalledWith(75)
    expect(mockUpdateProgress.mutate).toHaveBeenCalledWith({
      sectionId: 'test-section',
      scrollPercent: 75,
      resourceId: 'test-resource'
    })
  })

  it('should handle restore target completion', () => {
    mockRefs.getRestoreTargetPercentRef.mockReturnValue(50)
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 100 // 50% progress
    })
    mockRefs.getRestoreFrameRef.mockReturnValue(null)

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setRestoreTargetPercentRef).toHaveBeenCalledWith(null)
    expect(mockRefs.setIsRestoringProgressRef).toHaveBeenCalledWith(false)
  })

  it('should not update progress when no user session', () => {
    mockRefs.getSessionUserRef.mockReturnValue(null)
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 100
    })

    const mockUpdateProgress = { mutate: vi.fn() }
    mockRefs.getUpdateProgressRef.mockReturnValue(mockUpdateProgress)

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockUpdateProgress.mutate).not.toHaveBeenCalled()
  })

  it('should clamp scroll percentage to valid range', () => {
    mockRefs.getScrollContainerRef.mockReturnValue({
      scrollHeight: 1000,
      clientHeight: 800,
      scrollTop: 2000 // Over 100%
    })

    const { result } = renderHook(() => useReaderProgress('test-resource'))

    act(() => {
      result.current.updateGlobalProgress()
    })

    expect(mockRefs.setLocalScrollPercentRef).toHaveBeenCalledWith(100)
  })
})