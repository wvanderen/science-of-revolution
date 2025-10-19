import { useCallback, useEffect } from 'react'
import { useReader } from '../contexts/ReaderContext'

export interface UseReaderProgressReturn {
  localScrollPercent: number
  isRestoringProgress: boolean
  updateGlobalProgress: () => void
  flushLatestProgress: () => void
}

export function useReaderProgress (resourceId?: string): UseReaderProgressReturn {
  const { refs, state } = useReader()
  const { localScrollPercent } = state

  // Save progress before unmounting to prevent data loss
  const flushLatestProgress = useCallback(() => {
    const latest = refs.getLatestProgressRef()
    const sessionUser = refs.getSessionUserRef()
    if (latest == null || sessionUser == null) return

    refs.setLastReportedProgressRef(latest.percent)
    refs.getUpdateProgressRef().mutate({
      sectionId: latest.sectionId,
      scrollPercent: latest.percent,
      resourceId: latest.resourceId ?? resourceId ?? undefined
    })
  }, [refs, resourceId])

  const cancelScheduledRestore = useCallback(() => {
    const frameRef = refs.getRestoreFrameRef()
    if (frameRef != null) {
      cancelAnimationFrame(frameRef)
      refs.setRestoreFrameRef(null)
    }
  }, [refs])

  const _scheduleRestoreAttempt = useCallback(() => {
    if (refs.getRestoreTargetPercentRef() == null) {
      cancelScheduledRestore()
      return
    }

    refs.setRestoreAttemptsRef(0)

    const attemptRestore = () => {
      const target = refs.getRestoreTargetPercentRef()
      if (target == null) {
        cancelScheduledRestore()
        refs.setIsRestoringProgressRef(false)
        refs.setIsProgrammaticScrollRef(false)
        return
      }

      const container = refs.getScrollContainerRef()
      if (container == null) {
        refs.setRestoreFrameRef(requestAnimationFrame(attemptRestore))
        return
      }

      const scrollRange = container.scrollHeight - container.clientHeight
      if (scrollRange <= 0) {
        refs.setRestoreFrameRef(requestAnimationFrame(attemptRestore))
        return
      }

      const desiredTop = Math.max(0, (target / 100) * scrollRange)
      const diffPx = Math.abs(container.scrollTop - desiredTop)

      if (diffPx <= 1) {
        refs.setRestoreTargetPercentRef(null)
        refs.setRestoreAttemptsRef(0)
        refs.setIsRestoringProgressRef(false)
        refs.setIsProgrammaticScrollRef(false)
        cancelScheduledRestore()
        return
      }

      refs.setIsRestoringProgressRef(true)
      refs.setIsProgrammaticScrollRef(true)
      container.scrollTo({ top: desiredTop, behavior: 'auto' })
      refs.setRestoreAttemptsRef(refs.getRestoreAttemptsRef() + 1)

      if (refs.getRestoreAttemptsRef() >= 60) {
        refs.setRestoreTargetPercentRef(null)
        refs.setIsRestoringProgressRef(false)
        cancelScheduledRestore()
        window.setTimeout(() => {
          refs.setIsProgrammaticScrollRef(false)
        }, 80)
        return
      }

      refs.setRestoreFrameRef(requestAnimationFrame(attemptRestore))
      window.setTimeout(() => {
        refs.setIsProgrammaticScrollRef(false)
      }, 80)
    }

    cancelScheduledRestore()
    refs.setRestoreFrameRef(requestAnimationFrame(attemptRestore))
  }, [refs, cancelScheduledRestore])

  const updateGlobalProgress = useCallback(() => {
    const container = refs.getScrollContainerRef()
    if (container == null) return
    const sessionUser = refs.getSessionUserRef()

    const scrollHeight = container.scrollHeight - container.clientHeight

    // Handle short content and near-bottom detection
    let percent: number
    if (scrollHeight <= 0) {
      // Content fits entirely on screen - consider it 100% viewable
      percent = 100
    } else {
      // Check if we're within 10 pixels of the bottom
      const distanceFromBottom = scrollHeight - container.scrollTop
      if (distanceFromBottom <= 10) {
        percent = 100
      } else {
        const rawRatio = container.scrollTop / scrollHeight
        const clampedRatio = Math.max(0, Math.min(rawRatio, 1))
        percent = Math.round(clampedRatio * 100)
      }
    }

    refs.setLocalScrollPercentRef(percent)
    refs.updateLocalScrollPercentState(percent)

    const activeSectionId = refs.getCurrentSectionIdRef()
    if (activeSectionId != null) {
      refs.setLatestProgressRef({
        sectionId: activeSectionId,
        percent,
        resourceId: resourceId ?? null
      })
    }

    const restoreTarget = refs.getRestoreTargetPercentRef()
    if (restoreTarget != null) {
      const diff = Math.abs(percent - restoreTarget)
      if (diff <= 2) {
        refs.setRestoreTargetPercentRef(null)
        refs.setRestoreAttemptsRef(0)
        refs.setIsRestoringProgressRef(false)
        cancelScheduledRestore()
      }
    }

    if (refs.getIsRestoringProgressRef()) {
      return
    }

    const lastReported = refs.getLastReportedProgressRef()

    // Update progress if: never reported before, changed by 5%, or reached 100%
    const shouldUpdate = activeSectionId != null && (
      lastReported == null ||
      Math.abs(percent - lastReported) >= 5 ||
      percent === 100
    )

    if (shouldUpdate) {
      if (sessionUser == null) return
      refs.setLastReportedProgressRef(percent)
      refs.setLatestProgressRef({
        sectionId: activeSectionId,
        percent,
        resourceId: resourceId ?? null
      })
      refs.getUpdateProgressRef().mutate({
        sectionId: activeSectionId,
        scrollPercent: percent,
        resourceId: resourceId ?? undefined
      })
    }
  }, [refs, resourceId, cancelScheduledRestore])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelScheduledRestore()
    }
  }, [cancelScheduledRestore])

  return {
    localScrollPercent,
    isRestoringProgress: refs.getIsRestoringProgressRef() ?? false,
    updateGlobalProgress,
    flushLatestProgress
  }
}