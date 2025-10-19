import { useEffect, useRef, useCallback } from 'react'
import { useReaderProgress } from '../hooks/useReaderProgress'
import { useReader } from '../contexts/ReaderContext'
import { useResourceProgress } from '../../progress/hooks/useResourceProgress'
import { useResource } from '../../library/hooks/useResources'

export interface ReaderProgressTrackerProps {
  resourceId?: string
  onProgressUpdate?: (progress: number) => void
  onRestoreComplete?: () => void
  children?: React.ReactNode
}

function getProgressSignature (progressEntries: Array<{ resource_section_id: string, scroll_percent: number | null, status: string | null, updated_at: string | null }>): string {
  if (progressEntries.length === 0) return 'empty'

  return [...progressEntries]
    .sort((a, b) => a.resource_section_id.localeCompare(b.resource_section_id))
    .map(entry => `${entry.resource_section_id}:${entry.scroll_percent ?? 0}:${entry.status ?? 'unknown'}:${entry.updated_at ?? ''}`)
    .join('|')
}

export function ReaderProgressTracker ({
  resourceId,
  onProgressUpdate,
  onRestoreComplete,
  children
}: ReaderProgressTrackerProps): JSX.Element {
  const { refs, state } = useReader()
  const { currentSectionId } = state
  const { localScrollPercent, isRestoringProgress, updateGlobalProgress, flushLatestProgress } = useReaderProgress(resourceId)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const { data: resource } = useResource(resourceId)

  // Get URL section parameter
  const urlParams = new URLSearchParams(window.location.search)
  const urlSectionId = urlParams.get('section')

  // Get resource progress data
  const { data: resourceProgress, isLoading: isResourceProgressLoading } = useResourceProgress(resourceId)

  // Set up scroll container reference and event listeners
  useEffect(() => {
    const container = refs.getScrollContainerRef()
    if (container == null) return

    scrollContainerRef.current = container

    const handleScroll = () => {
      updateGlobalProgress()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    // Calculate initial progress after layout stabilizes
    requestAnimationFrame(() => {
      updateGlobalProgress()
    })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [refs, updateGlobalProgress])

  // Update progress when scroll position changes
  useEffect(() => {
    onProgressUpdate?.(localScrollPercent)
  }, [localScrollPercent, onProgressUpdate])

  // Handle restore completion
  useEffect(() => {
    if (!isRestoringProgress) {
      onRestoreComplete?.()
    }
  }, [isRestoringProgress, onRestoreComplete])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      flushLatestProgress()
    }
  }, [flushLatestProgress])

  // Monitor scroll container for changes and recalculate progress
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        updateGlobalProgress()
      })
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateGlobalProgress])

  // Intersection Observer for section tracking (if needed for future enhancements)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    // This can be extended to track section visibility for more granular progress
    // For now, we focus on scroll-based progress tracking
    const sections = container.querySelectorAll('[data-section-id]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id')
            if (sectionId != null) {
              refs.setCurrentSectionIdRef(sectionId)
            }
          }
        })
      },
      {
        root: container,
        threshold: 0.1,
        rootMargin: '-50px 0px -50% 0px'
      }
    )

    sections.forEach((section) => {
      observer.observe(section)
    })

    return () => {
      observer.disconnect()
    }
  }, [refs])

  // Progress restoration logic
  const cancelScheduledRestore = useCallback(() => {
    const frameRef = refs.getRestoreFrameRef()
    if (frameRef != null) {
      cancelAnimationFrame(frameRef)
      refs.setRestoreFrameRef(null)
    }
  }, [refs])

  const scheduleRestoreAttempt = useCallback(() => {
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

  // Initialize current section when resource and progress data are ready
  useEffect(() => {
    // Get resource from useResource hook
    if (resource?.sections == null || resource.sections.length === 0) return
    if (isResourceProgressLoading) return

    const sections = resource.sections
    const sectionById = new Map(sections.map(section => [section.id, section]))
    const progressList = (resourceProgress ?? []).filter(entry => sectionById.has(entry.resource_section_id))
    const progressSignature = getProgressSignature(progressList)
    const canReinitialize = !refs.getHasInitializedSectionRef() || refs.getLocalScrollPercentRef() <= 5

    if (!canReinitialize) {
      refs.setProgressSignatureRef(progressSignature)
      return
    }

    if (refs.getHasInitializedSectionRef() && refs.getProgressSignatureRef() === progressSignature) {
      return
    }

    refs.setProgressSignatureRef(progressSignature)

    const resolveFromUrl = (): { sectionId: string | null, percent: number | null } => {
      if (urlSectionId == null) return { sectionId: null, percent: null }
      if (!sectionById.has(urlSectionId)) return { sectionId: null, percent: null }

      const matching = progressList.find(entry => entry.resource_section_id === urlSectionId)
      return {
        sectionId: urlSectionId,
        percent: matching?.scroll_percent ?? null
      }
    }

    const resolveFromProgress = (): { sectionId: string | null, percent: number | null } => {
      if (progressList.length === 0) {
        return { sectionId: sections[0]?.id ?? null, percent: 0 }
      }

      const inProgressEntries = progressList
        .filter(entry => entry.status === 'in_progress')
        .map(entry => ({
          entry,
          scrollPercent: entry.scroll_percent ?? 0,
          updatedAt: entry.updated_at != null ? new Date(entry.updated_at).getTime() : 0
        }))
        .sort((a, b) => {
          if (a.scrollPercent !== b.scrollPercent) {
            return b.scrollPercent - a.scrollPercent
          }
          return b.updatedAt - a.updatedAt
        })

      if (inProgressEntries.length > 0) {
        const target = inProgressEntries[0]
        return {
          sectionId: target.entry.resource_section_id,
          percent: target.scrollPercent
        }
      }

      const completedEntries = progressList
        .filter(entry => entry.status === 'completed')
        .map(entry => {
          const section = sectionById.get(entry.resource_section_id)
          return {
            entry,
            order: section?.order ?? -1,
            updatedAt: entry.updated_at != null ? new Date(entry.updated_at).getTime() : 0
          }
        })
        .sort((a, b) => {
          if (a.order !== b.order) {
            return b.order - a.order
          }
          return b.updatedAt - a.updatedAt
        })

      if (completedEntries.length > 0) {
        const latestCompleted = completedEntries[0]
        const currentSection = sectionById.get(latestCompleted.entry.resource_section_id)
        if (currentSection != null) {
          const nextSection = sections.find(section => section.order > currentSection.order)
          if (nextSection != null) {
            return { sectionId: nextSection.id, percent: 0 }
          }
          return {
            sectionId: currentSection.id,
            percent: latestCompleted.entry.scroll_percent ?? 100
          }
        }
      }

      return { sectionId: sections[0]?.id ?? null, percent: 0 }
    }

    const fromUrl = resolveFromUrl()
    const chosen = fromUrl.sectionId != null ? fromUrl : resolveFromProgress()

    if (chosen.sectionId != null) {
      refs.setHasInitializedSectionRef(true)
      refs.setResumeScrollPercentRef(chosen.percent ?? null)
      refs.setIsRestoringProgressRef((chosen.percent ?? 0) > 0)
      refs.setCurrentSectionIdRef(chosen.sectionId)
      const normalizedPercent = chosen.percent != null
        ? Math.max(0, Math.min(100, Math.round(chosen.percent)))
        : null

      if (normalizedPercent != null) {
        refs.setLocalScrollPercentRef(normalizedPercent)
        refs.updateLocalScrollPercentState(normalizedPercent)
        refs.setRestoreTargetPercentRef(normalizedPercent)
        refs.setRestoreAttemptsRef(0)
        scheduleRestoreAttempt()
      } else {
        refs.setLocalScrollPercentRef(0)
        refs.updateLocalScrollPercentState(0)
        refs.setRestoreTargetPercentRef(0)
        refs.setRestoreAttemptsRef(0)
        scheduleRestoreAttempt()
      }
    }
  }, [resource, resourceProgress, isResourceProgressLoading, urlSectionId, scheduleRestoreAttempt, refs])

  // Handle section change restoration
  useEffect(() => {
    if (currentSectionId == null) return

    const pendingPercent = refs.getResumeScrollPercentRef()
    if (pendingPercent != null && pendingPercent > 0) {
      const container = refs.getScrollContainerRef()
      if (container != null) {
        refs.setIsRestoringProgressRef(true)
        refs.setIsProgrammaticScrollRef(true)
        requestAnimationFrame(() => {
          const scrollHeight = container.scrollHeight - container.clientHeight
          const targetScrollTop = scrollHeight > 0 ? (pendingPercent / 100) * scrollHeight : 0
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'auto'
          })

          const normalized = Math.max(0, Math.min(100, Math.round(pendingPercent)))
          refs.setLocalScrollPercentRef(normalized)
          refs.updateLocalScrollPercentState(normalized)
          refs.setLatestProgressRef({
            sectionId: currentSectionId,
            percent: pendingPercent,
            resourceId: resourceId ?? null
          })
          refs.setLastReportedProgressRef(pendingPercent)
          refs.setRestoreTargetPercentRef(normalized)
          refs.setRestoreAttemptsRef(0)
          scheduleRestoreAttempt()

          window.setTimeout(() => {
            refs.setIsProgrammaticScrollRef(false)
            refs.setIsRestoringProgressRef(false)
            updateGlobalProgress()
          }, 300)
        })
      } else {
        refs.setIsRestoringProgressRef(false)
      }
    } else if (pendingPercent === 0) {
      refs.setLatestProgressRef({
        sectionId: currentSectionId,
        percent: 0,
        resourceId: resourceId ?? null
      })
      refs.setLocalScrollPercentRef(0)
      refs.updateLocalScrollPercentState(0)
      refs.setLastReportedProgressRef(0)
      refs.setRestoreTargetPercentRef(0)
      refs.setRestoreAttemptsRef(0)
      scheduleRestoreAttempt()
      refs.setIsRestoringProgressRef(false)
    }

    refs.setResumeScrollPercentRef(null)
  }, [currentSectionId, resourceId, updateGlobalProgress, scheduleRestoreAttempt, refs])

  // Update progress refs when section changes
  useEffect(() => {
    if (currentSectionId == null) return

    if (resourceProgress != null) {
      const existing = resourceProgress.find(entry => entry.resource_section_id === currentSectionId)
      if (existing?.scroll_percent != null) {
        refs.setLastReportedProgressRef(existing.scroll_percent)
        refs.setLatestProgressRef({
          sectionId: currentSectionId,
          percent: existing.scroll_percent,
          resourceId: resourceId ?? null
        })
        return
      }
    }

    refs.setLastReportedProgressRef(null)
  }, [currentSectionId, resourceProgress, resourceId, refs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelScheduledRestore()
    }
  }, [cancelScheduledRestore])

  // Component renders a hidden div for E2E test identification
  return (
    <>
      <div
        data-testid="reader-progress-tracker"
        style={{ display: 'none' }}
        data-resource-id={resourceId}
        data-is-restoring={isRestoringProgress}
        data-scroll-percent={localScrollPercent}
      />
      {children ?? null}
    </>
  )
}