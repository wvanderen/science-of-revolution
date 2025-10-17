import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResource } from '../../library/hooks/useResources'
import { ReaderLayout } from '../components/ReaderLayout'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReaderContent } from '../components/ReaderContent'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useHighlights, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { getTextSelection } from '../../highlights/utils/textAnchoring'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProgress, useUpdateProgress, useToggleCompleted } from '../../progress/hooks/useProgress'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'
import { useParagraphNavigation } from '../hooks/useParagraphNavigation'
import { ReaderPreferencesPanel } from '../../preferences/components/ReaderPreferencesPanel'
import { EditDocumentModal } from '../components/EditDocumentModal'
import { useQueryClient } from '@tanstack/react-query'
import { PlanContextBanner } from '../components/PlanContextBanner'
import { usePlanContextReader } from '../hooks/usePlanContextReader'
import { useSession } from '../../../hooks/useSession'
import { useResourceProgress } from '../../progress/hooks/useResourceProgress'

function areHighlightListsEqual (
  previous: HighlightWithNote[] | undefined,
  next: HighlightWithNote[]
): boolean {
  if (previous == null) return next.length === 0
  if (previous.length !== next.length) return false

  for (let i = 0; i < previous.length; i++) {
    const prevItem = previous[i]
    const nextItem = next[i]

    if (prevItem.id !== nextItem.id) return false
    if (prevItem.updated_at !== nextItem.updated_at) return false

    const prevNoteUpdated = prevItem.note?.updated_at ?? null
    const nextNoteUpdated = nextItem.note?.updated_at ?? null
    if (prevNoteUpdated !== nextNoteUpdated) return false
  }

  return true
}

function getHighlightsSignature (highlights: HighlightWithNote[]): string {
  if (highlights.length === 0) return 'empty'

  return highlights
    .map(highlight => ({
      id: highlight.id,
      startPos: highlight.start_pos,
      updatedAt: highlight.updated_at ?? '',
      noteUpdatedAt: highlight.note?.updated_at ?? ''
    }))
    .sort((a, b) => {
      if (a.startPos !== b.startPos) {
        return a.startPos - b.startPos
      }
      return a.id.localeCompare(b.id)
    })
    .map(item => `${item.id}:${item.updatedAt}:${item.noteUpdatedAt}`)
    .join('|')
}

function getProgressSignature (progressEntries: Array<{ resource_section_id: string, scroll_percent: number | null, status: string | null, updated_at: string | null }>): string {
  if (progressEntries.length === 0) return 'empty'

  return [...progressEntries]
    .sort((a, b) => a.resource_section_id.localeCompare(b.resource_section_id))
    .map(entry => `${entry.resource_section_id}:${entry.scroll_percent ?? 0}:${entry.status ?? 'unknown'}:${entry.updated_at ?? ''}`)
    .join('|')
}

/**
 * Main reader page for viewing resource sections
 * URL params: /reader/:resourceId?section=:sectionId
 */
export function ReaderPage (): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { data: resource, isLoading, error } = useResource(resourceId)
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { session } = useSession()
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const currentSectionIdRef = useRef<string | null>(null)
  const isProgrammaticScrollRef = useRef(false)
  const [sectionHighlights, setSectionHighlights] = useState<Record<string, HighlightWithNote[]>>({})
  const highlightSignaturesRef = useRef<Record<string, string>>({})
  const lastReportedProgressRef = useRef<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const resumeScrollPercentRef = useRef<number | null>(null)
  const hasInitializedSectionRef = useRef(false)
  const isRestoringProgressRef = useRef(false)
  const progressSignatureRef = useRef<string | null>(null)
  const localScrollPercentRef = useRef(0)
  const restoreTargetPercentRef = useRef<number | null>(null)
  const restoreAttemptsRef = useRef(0)
  const restoreFrameRef = useRef<number | null>(null)
  const registerSectionRef = useCallback((sectionId: string, element: HTMLElement | null) => {
    const refs = sectionRefs.current

    if (element != null) {
      refs.set(sectionId, element)
      if (observerRef.current != null) {
        observerRef.current.observe(element)
      }
    } else {
      const existing = refs.get(sectionId)
      if (existing != null && observerRef.current != null) {
        observerRef.current.unobserve(existing)
      }
      refs.delete(sectionId)
    }
  }, [])
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    if (observerRef.current != null) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.length === 0) return
      if (isProgrammaticScrollRef.current) return

      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)

      if (visibleEntries.length === 0) return

      const nextSectionElement = visibleEntries[0].target as HTMLElement
      const nextSectionId = nextSectionElement.dataset.sectionId
      if (nextSectionId == null) return
      if (currentSectionIdRef.current === nextSectionId) return

      setCurrentSectionId(nextSectionId)

      // Update URL without adding history entries during scroll
      const url = new URL(window.location.href)
      url.searchParams.set('section', nextSectionId)
      window.history.replaceState({}, '', url)
    }, {
      root: container,
      threshold: [0.1, 0.25, 0.5],
      rootMargin: '-30% 0px -50% 0px'
    })

    observerRef.current = observer

    sectionRefs.current.forEach(element => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [resource?.sections?.length])
  // Get section ID from URL query params
  const searchParams = new URLSearchParams(window.location.search)
  const urlSectionId = searchParams.get('section')

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  useEffect(() => {
    currentSectionIdRef.current = currentSectionId
  }, [currentSectionId])

  // Highlight menu state
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false)

  // Local scroll progress for immediate UI feedback
  const [localScrollPercent, setLocalScrollPercent] = useState(0)

  // Text selection for highlighting
  const { selection, clearSelection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  // Create a separate ref for paragraph navigation to avoid conflicts
  const paragraphNavigationRef = useRef<HTMLDivElement>(null)
  const { announcement: paragraphAnnouncement, focusedParagraphElement } = useParagraphNavigation({ contentRef: paragraphNavigationRef })

  // Plan context tracking - automatically updates reading progress when in plan context
  usePlanContextReader(resourceId, currentSectionId)

  // Fetch highlights for current section
  const { data: highlights = [] } = useHighlights(currentSectionId ?? undefined)
  useEffect(() => {
    if (currentSectionId == null) return

    const nextSignature = getHighlightsSignature(highlights)
    const previousSignature = highlightSignaturesRef.current[currentSectionId]

    if (previousSignature === nextSignature) return

    setSectionHighlights(prev => {
      const existing = prev[currentSectionId]
      if (areHighlightListsEqual(existing, highlights)) {
        highlightSignaturesRef.current[currentSectionId] = nextSignature
        return prev
      }

      highlightSignaturesRef.current[currentSectionId] = nextSignature
      return {
        ...prev,
        [currentSectionId]: highlights
      }
    })
  }, [currentSectionId, highlights])
  const highlightLookup = useMemo(() => {
    const lookup: Record<string, HighlightWithNote> = {}
    Object.values(sectionHighlights).forEach(sectionList => {
      sectionList.forEach(highlight => {
        lookup[highlight.id] = highlight
      })
    })
    return lookup
  }, [sectionHighlights])

  // Progress tracking
  const { data: progress } = useProgress(currentSectionId ?? undefined)
  const updateProgress = useUpdateProgress()
  const toggleCompleted = useToggleCompleted()
  const { data: resourceProgress, isLoading: isResourceProgressLoading } = useResourceProgress(resourceId)

  // Track the latest progress for save-on-unmount
  const latestProgressRef = useRef<{ sectionId: string; percent: number; resourceId: string | null } | null>(null)
  const updateProgressRef = useRef(updateProgress)
  const sessionUserRef = useRef(session?.user ?? null)

  useEffect(() => {
    updateProgressRef.current = updateProgress
  }, [updateProgress])

  useEffect(() => {
    sessionUserRef.current = session?.user ?? null
  }, [session?.user])

  // Save progress before unmounting to prevent data loss
  const flushLatestProgress = useCallback(() => {
    const latest = latestProgressRef.current
    const sessionUser = sessionUserRef.current
    if (latest == null || sessionUser == null) return

    lastReportedProgressRef.current = latest.percent
    updateProgressRef.current.mutate({
      sectionId: latest.sectionId,
      scrollPercent: latest.percent,
      resourceId: latest.resourceId ?? resourceId ?? undefined
    })
  }, [resourceId])

  const cancelScheduledRestore = useCallback(() => {
    if (restoreFrameRef.current != null) {
      cancelAnimationFrame(restoreFrameRef.current)
      restoreFrameRef.current = null
    }
  }, [])

  const scheduleRestoreAttempt = useCallback(() => {
    if (restoreTargetPercentRef.current == null) {
      cancelScheduledRestore()
      return
    }

    restoreAttemptsRef.current = 0

    const attemptRestore = () => {
      const target = restoreTargetPercentRef.current
      if (target == null) {
        cancelScheduledRestore()
        isRestoringProgressRef.current = false
        isProgrammaticScrollRef.current = false
        return
      }

      const container = scrollContainerRef.current
      if (container == null) {
        restoreFrameRef.current = requestAnimationFrame(attemptRestore)
        return
      }

      const scrollRange = container.scrollHeight - container.clientHeight
      if (scrollRange <= 0) {
        restoreFrameRef.current = requestAnimationFrame(attemptRestore)
        return
      }

      const desiredTop = Math.max(0, (target / 100) * scrollRange)
      const diffPx = Math.abs(container.scrollTop - desiredTop)

      if (diffPx <= 1) {
        restoreTargetPercentRef.current = null
        restoreAttemptsRef.current = 0
        isRestoringProgressRef.current = false
        isProgrammaticScrollRef.current = false
        cancelScheduledRestore()
        return
      }

      isRestoringProgressRef.current = true
      isProgrammaticScrollRef.current = true
      container.scrollTo({ top: desiredTop, behavior: 'auto' })
      restoreAttemptsRef.current += 1

      if (restoreAttemptsRef.current >= 60) {
        restoreTargetPercentRef.current = null
        isRestoringProgressRef.current = false
        cancelScheduledRestore()
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false
        }, 80)
        return
      }

      restoreFrameRef.current = requestAnimationFrame(attemptRestore)
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 80)
    }

    cancelScheduledRestore()
    restoreFrameRef.current = requestAnimationFrame(attemptRestore)
  }, [cancelScheduledRestore])

  useEffect(() => {
    hasInitializedSectionRef.current = false
    resumeScrollPercentRef.current = null
    isRestoringProgressRef.current = false
    progressSignatureRef.current = null
    localScrollPercentRef.current = 0
    restoreTargetPercentRef.current = null
    restoreAttemptsRef.current = 0
    cancelScheduledRestore()
    latestProgressRef.current = null
    setCurrentSectionId(null)
  }, [resourceId, cancelScheduledRestore])

  useEffect(() => {
    return () => {
      flushLatestProgress()
    }
  }, [flushLatestProgress])

  useEffect(() => {
    return () => {
      cancelScheduledRestore()
    }
  }, [cancelScheduledRestore])
  const updateGlobalProgress = useCallback(() => {
    const container = scrollContainerRef.current
    if (container == null) return
    const sessionUser = sessionUserRef.current

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

    localScrollPercentRef.current = percent

    const activeSectionId = currentSectionIdRef.current
    if (activeSectionId != null) {
      latestProgressRef.current = {
        sectionId: activeSectionId,
        percent,
        resourceId: resourceId ?? null
      }
    }

    const restoreTarget = restoreTargetPercentRef.current
    if (restoreTarget != null) {
      const diff = Math.abs(percent - restoreTarget)
      if (diff <= 2) {
        restoreTargetPercentRef.current = null
        restoreAttemptsRef.current = 0
        isRestoringProgressRef.current = false
        cancelScheduledRestore()
      }
    }

    setLocalScrollPercent(percent)

    if (isRestoringProgressRef.current) {
      return
    }

    const lastReported = lastReportedProgressRef.current

    // Update progress if: never reported before, changed by 5%, or reached 100%
    const shouldUpdate = activeSectionId != null && (
      lastReported == null ||
      Math.abs(percent - lastReported) >= 5 ||
      percent === 100
    )

    if (shouldUpdate) {
      if (sessionUser == null) return
      lastReportedProgressRef.current = percent
      latestProgressRef.current = {
        sectionId: activeSectionId,
        percent,
        resourceId: resourceId ?? null
      }
      updateProgressRef.current.mutate({
        sectionId: activeSectionId,
        scrollPercent: percent,
        resourceId: resourceId ?? undefined
      })
    }
  }, [resourceId])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

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
  }, [updateGlobalProgress])
  useEffect(() => {
    if (currentSectionId == null) return
    requestAnimationFrame(() => {
      updateGlobalProgress()
    })
  }, [currentSectionId, updateGlobalProgress])

  // Initialize current section when resource and progress data are ready
  useEffect(() => {
    if (resource?.sections == null || resource.sections.length === 0) return
    if (isResourceProgressLoading) return

    const sections = resource.sections
    const sectionById = new Map(sections.map(section => [section.id, section]))
    const progressList = (resourceProgress ?? []).filter(entry => sectionById.has(entry.resource_section_id))
    const progressSignature = getProgressSignature(progressList)
    const canReinitialize = !hasInitializedSectionRef.current || localScrollPercentRef.current <= 5

    if (!canReinitialize) {
      progressSignatureRef.current = progressSignature
      return
    }

    if (hasInitializedSectionRef.current && progressSignatureRef.current === progressSignature) {
      return
    }

    progressSignatureRef.current = progressSignature

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
      hasInitializedSectionRef.current = true
      resumeScrollPercentRef.current = chosen.percent ?? null
      isRestoringProgressRef.current = (chosen.percent ?? 0) > 0
      setCurrentSectionId(chosen.sectionId)
      const normalizedPercent = chosen.percent != null
        ? Math.max(0, Math.min(100, Math.round(chosen.percent)))
        : null

      if (normalizedPercent != null) {
        setLocalScrollPercent(normalizedPercent)
        localScrollPercentRef.current = normalizedPercent
        restoreTargetPercentRef.current = normalizedPercent
        restoreAttemptsRef.current = 0
        scheduleRestoreAttempt()
      } else {
        setLocalScrollPercent(0)
        localScrollPercentRef.current = 0
        restoreTargetPercentRef.current = 0
        restoreAttemptsRef.current = 0
        scheduleRestoreAttempt()
      }
    }
  }, [resource, resourceProgress, isResourceProgressLoading, urlSectionId, scheduleRestoreAttempt])

  useEffect(() => {
    if (currentSectionId == null) return

    const pendingPercent = resumeScrollPercentRef.current
    if (pendingPercent != null && pendingPercent > 0) {
      const container = scrollContainerRef.current
      if (container != null) {
        isRestoringProgressRef.current = true
        isProgrammaticScrollRef.current = true
        requestAnimationFrame(() => {
          const scrollHeight = container.scrollHeight - container.clientHeight
          const targetScrollTop = scrollHeight > 0 ? (pendingPercent / 100) * scrollHeight : 0
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'auto'
          })

          const normalized = Math.max(0, Math.min(100, Math.round(pendingPercent)))
          localScrollPercentRef.current = normalized
          setLocalScrollPercent(normalized)
          latestProgressRef.current = {
            sectionId: currentSectionId,
            percent: pendingPercent,
            resourceId: resourceId ?? null
          }
          lastReportedProgressRef.current = pendingPercent
          restoreTargetPercentRef.current = normalized
          restoreAttemptsRef.current = 0
          scheduleRestoreAttempt()

          window.setTimeout(() => {
            isProgrammaticScrollRef.current = false
            isRestoringProgressRef.current = false
            updateGlobalProgress()
          }, 300)
        })
      } else {
        isRestoringProgressRef.current = false
      }
    } else if (pendingPercent === 0) {
      latestProgressRef.current = {
        sectionId: currentSectionId,
        percent: 0,
        resourceId: resourceId ?? null
      }
      localScrollPercentRef.current = 0
      setLocalScrollPercent(0)
      lastReportedProgressRef.current = 0
      restoreTargetPercentRef.current = 0
      restoreAttemptsRef.current = 0
      scheduleRestoreAttempt()
      isRestoringProgressRef.current = false
    }

    resumeScrollPercentRef.current = null
  }, [currentSectionId, resourceId, updateGlobalProgress, scheduleRestoreAttempt])

  useEffect(() => {
    if (currentSectionId == null) return

    if (resourceProgress != null) {
      const existing = resourceProgress.find(entry => entry.resource_section_id === currentSectionId)
      if (existing?.scroll_percent != null) {
        lastReportedProgressRef.current = existing.scroll_percent
        latestProgressRef.current = {
          sectionId: currentSectionId,
          percent: existing.scroll_percent,
          resourceId: resourceId ?? null
        }
        return
      }
    }

    lastReportedProgressRef.current = null
  }, [currentSectionId, resourceProgress, resourceId])

  // Update URL when section changes
  const handleSectionChange = (sectionId: string): void => {
    flushLatestProgress()
    latestProgressRef.current = null
    localScrollPercentRef.current = 0
    setLocalScrollPercent(0)
    restoreTargetPercentRef.current = null
    restoreAttemptsRef.current = 0
    cancelScheduledRestore()
    setCurrentSectionId(sectionId)

    const sectionElement = sectionRefs.current.get(sectionId)
    const container = scrollContainerRef.current

    if (sectionElement != null && container != null) {
      isProgrammaticScrollRef.current = true
      const offsetTop = sectionElement.offsetTop
      const headerOffset = 32
      const targetScrollTop = Math.max(0, offsetTop - headerOffset)

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })

      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false
        updateGlobalProgress()
      }, 400)
    }

    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    window.history.pushState({}, '', url)
  }

  const handleClose = (): void => {
    flushLatestProgress()
    latestProgressRef.current = null
    restoreTargetPercentRef.current = null
    restoreAttemptsRef.current = 0
    cancelScheduledRestore()
    // Check if we came from an education plan context
    const searchParams = new URLSearchParams(window.location.search)
    const planId = searchParams.get('planId')
    const topicId = searchParams.get('topicId')

    if (topicId) {
      // Return to topic detail page
      navigate(`/education-plans/topics/${topicId}`)
    } else if (planId) {
      // Return to plan detail page
      navigate(`/education-plans/${planId}`)
    } else {
      // Default to library
      navigate('/library')
    }
  }

  // Handle highlight creation
  const handleCreateHighlight = async (color: string, visibility: 'private' | 'cohort'): Promise<void> => {
    if (selection == null) return

    const activeSelection = window.getSelection()
    if (activeSelection == null || activeSelection.rangeCount === 0) return

    const range = activeSelection.getRangeAt(0)
    const commonAncestor = range.commonAncestorContainer
    let sectionContentElement: HTMLElement | null = null

    if (commonAncestor instanceof HTMLElement) {
      sectionContentElement = commonAncestor.closest('[data-section-content="true"]') as HTMLElement | null
    } else if (commonAncestor != null) {
      sectionContentElement = commonAncestor.parentElement?.closest('[data-section-content="true"]') as HTMLElement | null
    }

    if (sectionContentElement == null) return

    const sectionElement = sectionContentElement.closest('[data-section-id]') as HTMLElement | null
    const sectionId = sectionElement?.dataset.sectionId
    if (sectionId == null) return

    const sectionSelection = getTextSelection(sectionContentElement)
    if (sectionSelection == null) return

    try {
      const createdHighlight = await createHighlight.mutateAsync({
        resource_section_id: sectionId,
        start_pos: sectionSelection.startPos,
        end_pos: sectionSelection.endPos,
        text_content: sectionSelection.text,
        color,
        visibility
      })

      const highlightForCache: HighlightWithNote = {
        ...createdHighlight,
        note: null
      }

      setSectionHighlights(prev => {
        const existing = prev[sectionId] ?? []
        const updated = [...existing, highlightForCache].sort((a, b) => a.start_pos - b.start_pos)
        return {
          ...prev,
          [sectionId]: updated
        }
      })

      setCurrentSectionId(sectionId)
      showToast('Highlight saved', { type: 'success' })
      clearSelection()
    } catch (error) {
      console.error('Failed to create highlight:', error)
      showToast('Failed to save highlight', { type: 'error' })
    }
  }

  const handleCancelHighlight = (): void => {
    clearSelection()
  }

  // Handle clicking on a highlight to show menu
  const handleHighlightClick = (highlightId: string, event: React.MouseEvent): void => {
    event.preventDefault()

    const targetHighlight = highlightLookup[highlightId]
    if (targetHighlight != null && targetHighlight.resource_section_id != null) {
      setCurrentSectionId(targetHighlight.resource_section_id)
    }

    setSelectedHighlightId(highlightId)
    setMenuPosition({ x: event.clientX, y: event.clientY })
  }

  // Handle deleting a highlight
  const handleDeleteHighlight = async (highlightId: string): Promise<void> => {
    const targetHighlight = highlightLookup[highlightId]
    const sectionId = targetHighlight?.resource_section_id ?? null

    try {
      await deleteHighlight.mutateAsync(highlightId)
      if (sectionId != null) {
        setSectionHighlights(prev => {
          const existing = prev[sectionId]
          if (existing == null) return prev
          const filtered = existing.filter(h => h.id !== highlightId)
          if (filtered.length === existing.length) return prev
          return {
            ...prev,
            [sectionId]: filtered
          }
        })
      }
      if (noteHighlightId === highlightId) {
        setNoteHighlightId(null)
      }
    } catch (error) {
      console.error('Failed to delete highlight:', error)
    }
  }

  // Handle adding a note to a highlight
  const handleAddNote = (highlightId: string): void => {
    setNoteHighlightId(highlightId)
    handleCloseMenu()
  }

  // Close highlight menu
  const handleCloseMenu = (): void => {
    setSelectedHighlightId(null)
    setMenuPosition(null)
  }

  const handleCloseNoteEditor = (): void => {
    setNoteHighlightId(null)
  }

  const handleOpenPreferences = (): void => {
    setIsPreferencesOpen(true)
  }

  const handleClosePreferences = (): void => {
    setIsPreferencesOpen(false)
  }

  const handleToggleCompleted = (): void => {
    if (currentSectionId == null) return
    if (session?.user == null) {
      showToast('Please sign in to update progress', { type: 'info' })
      return
    }

    const isCompleted = progress?.status === 'completed'
    toggleCompleted.mutate({
      sectionId: currentSectionId,
      isCompleted: !isCompleted
    })
  }

  const handleOpenEditDocument = (): void => {
    setIsEditDocumentOpen(true)
  }

  const handleCloseEditDocument = (): void => {
    setIsEditDocumentOpen(false)
  }

  const handleSaveDocument = (): void => {
    // Invalidate and refetch resource data to show updated content
    queryClient.invalidateQueries({ queryKey: ['resource', resourceId] })
    queryClient.invalidateQueries({ queryKey: ['resources'] })
  }

  useEffect(() => {
    if (noteHighlightId == null) return

    if (highlightLookup[noteHighlightId] == null) {
      setNoteHighlightId(null)
    }
  }, [noteHighlightId, highlightLookup])
  useEffect(() => {
    if (selectedHighlightId == null) return
    if (highlightLookup[selectedHighlightId] == null) {
      setSelectedHighlightId(null)
      setMenuPosition(null)
    }
  }, [selectedHighlightId, highlightLookup])

  // Handle 'h' key to highlight focused paragraph
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent): Promise<void> => {
      if (event.key !== 'h' && event.key !== 'H') return

      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (target.isContentEditable) return

      if (focusedParagraphElement == null) return
      if (selection != null) return

      const paragraphText = focusedParagraphElement.textContent?.trim()
      if (paragraphText == null || paragraphText.length === 0) return

      const sectionElement = focusedParagraphElement.closest('[data-section-id]') as HTMLElement | null
      const sectionId = sectionElement?.dataset.sectionId
      if (sectionElement == null || sectionId == null) return

      const sectionContentElement = sectionElement.querySelector('[data-section-content="true"]') as HTMLElement | null
      if (sectionContentElement == null) return

      let startPos = 0
      let foundStart = false
      const walker = document.createTreeWalker(sectionContentElement, NodeFilter.SHOW_TEXT, null)

      let node: Node | null
      while ((node = walker.nextNode()) != null) {
        if (node.parentElement != null && focusedParagraphElement.contains(node.parentElement)) {
          foundStart = true
          break
        }
        startPos += node.textContent?.length ?? 0
      }

      if (!foundStart) return

      const endPos = startPos + paragraphText.length
      const paragraphIndex = focusedParagraphElement.getAttribute('data-reader-paragraph-index')
      const sectionHighlightList = sectionHighlights[sectionId] ?? []

      const existingHighlight = sectionHighlightList.find(h =>
        h.start_pos === startPos &&
        h.end_pos === endPos &&
        h.text_content.trim() === paragraphText
      )

      try {
        if (existingHighlight != null) {
          await deleteHighlight.mutateAsync(existingHighlight.id)
          setSectionHighlights(prev => {
            const existing = prev[sectionId]
            if (existing == null) return prev
            const updated = existing.filter(h => h.id !== existingHighlight.id)
            if (updated.length === existing.length) return prev
            return {
              ...prev,
              [sectionId]: updated
            }
          })
          showToast('Highlight removed', { type: 'success' })
        } else {
          const newHighlight = await createHighlight.mutateAsync({
            resource_section_id: sectionId,
            start_pos: startPos,
            end_pos: endPos,
            text_content: paragraphText,
            color: 'yellow',
            visibility: 'private'
          })

          const highlightForCache: HighlightWithNote = {
            ...newHighlight,
            note: null
          }

          setSectionHighlights(prev => {
            const existing = prev[sectionId] ?? []
            const updated = [...existing, highlightForCache].sort((a, b) => a.start_pos - b.start_pos)
            return {
              ...prev,
              [sectionId]: updated
            }
          })

          setCurrentSectionId(sectionId)
          showToast('Paragraph highlighted', { type: 'success' })
        }

        if (paragraphIndex != null) {
          const container = containerRef.current
          if (container != null) {
            const refocusParagraph = (): void => {
              const paragraph = container.querySelector(`[data-reader-paragraph-index="${paragraphIndex}"]`) as HTMLElement
              if (paragraph != null) {
                paragraph.focus({ preventScroll: true })
              }
            }

            refocusParagraph()
            setTimeout(refocusParagraph, 50)
            setTimeout(refocusParagraph, 200)
          }
        }
      } catch (error) {
        console.error('Failed to toggle highlight:', error)
        showToast('Failed to toggle highlight', { type: 'error' })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [focusedParagraphElement, selection, containerRef, createHighlight, deleteHighlight, sectionHighlights, showToast])

  const noteHighlight = useMemo<HighlightWithNote | null>(() => {
    if (noteHighlightId == null) return null
    return highlightLookup[noteHighlightId] ?? null
  }, [noteHighlightId, highlightLookup])

  if (isLoading) {
    return (
      <ReaderLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-foreground-muted">Loading...</div>
        </div>
      </ReaderLayout>
    )
  }

  if (error != null || resource == null) {
    return (
      <ReaderLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-error">Failed to load resource</div>
          <button onClick={handleClose} className="btn btn-primary">
            Return to Library
          </button>
        </div>
      </ReaderLayout>
    )
  }

  if (resource.sections.length === 0) {
    return (
      <ReaderLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-foreground-muted">No sections available</div>
        </div>
      </ReaderLayout>
    )
  }

  // Combine database progress with local scroll percent for immediate UI feedback
  const displayProgress = progress ?? null

  return (
    <ReaderLayout>
      {/* Plan context banner - shows when reading from an education plan */}
      <PlanContextBanner />

      {/* Fixed header that stays at top */}
      <ReaderToolbar
        sections={resource.sections}
        currentSectionId={currentSectionId}
        onSectionSelect={handleSectionChange}
        onClose={handleClose}
        progress={displayProgress}
        scrollPercent={localScrollPercent}
        onOpenPreferences={handleOpenPreferences}
        onToggleCompleted={handleToggleCompleted}
        onEditDocument={handleOpenEditDocument}
      />

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto pt-16"
      >
        <ReaderContent
          sections={resource.sections}
          sectionHighlights={sectionHighlights}
          contentRef={containerRef}
          paragraphNavigationRef={paragraphNavigationRef}
          onHighlightClick={handleHighlightClick}
          onSectionRef={registerSectionRef}
        />

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {paragraphAnnouncement}
        </div>
      </div>

      {/* Highlight toolbar - shows when text is selected */}
      <HighlightToolbar
        selection={selection}
        onCreateHighlight={handleCreateHighlight}
        onCancel={handleCancelHighlight}
      />

      {/* Highlight menu - shows when clicking on a highlight */}
      {selectedHighlightId != null && menuPosition != null && highlightLookup[selectedHighlightId] != null && (
        <HighlightMenu
          highlight={highlightLookup[selectedHighlightId]!}
          position={menuPosition}
          onAddNote={handleAddNote}
          onDelete={handleDeleteHighlight}
          onClose={handleCloseMenu}
        />
      )}

      {noteHighlight != null && (
        <HighlightNoteModal
          highlight={noteHighlight}
          onClose={handleCloseNoteEditor}
        />
      )}

      {/* Reader preferences panel */}
      <ReaderPreferencesPanel
        isOpen={isPreferencesOpen}
        onClose={handleClosePreferences}
      />

      {/* Edit document modal (facilitators only) */}
      <EditDocumentModal
        resourceId={resourceId!}
        sections={resource.sections}
        isOpen={isEditDocumentOpen}
        onClose={handleCloseEditDocument}
        onSave={handleSaveDocument}
      />
    </ReaderLayout>
  )
}
