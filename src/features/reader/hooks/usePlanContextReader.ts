import { useEffect, useMemo, useRef } from 'react'
import { useUpdateReadingProgress, useTopicProgress } from '../../education-plans/hooks/usePlanEnrollment'
import { usePlanTopic } from '../../education-plans/hooks/usePlanTopics'
import { useSession } from '../../../hooks/useSession'
import { useResource } from '../../library/hooks/useResources'
import { useStartReadingSession, useUpdateReadingSession, useEndReadingSession, useActiveReadingSession } from '../../education-plans/hooks/useReadingSessions'

interface PlanContext {
  planId: string | null
  topicId: string | null
  isInPlanContext: boolean
}

interface PlanContextData extends PlanContext {
  topicTitle: string | null
  topicProgress: number | null
  isLoadingTopic: boolean
}

/**
 * Hook to detect and manage education plan context in the reader
 *
 * Extracts planId and topicId from URL query params and provides
 * plan context information along with progress tracking utilities
 */
export function usePlanContext(): PlanContext {
  const searchParams = new URLSearchParams(window.location.search)
  const planId = searchParams.get('planId')
  const topicId = searchParams.get('topicId')

  return useMemo(() => ({
    planId,
    topicId,
    isInPlanContext: !!topicId && !!planId
  }), [planId, topicId])
}

/**
 * Hook to get enriched plan context data including topic info
 */
export function usePlanContextData(): PlanContextData {
  const context = usePlanContext()
  const { session } = useSession()
  const { data: topic, isLoading: isLoadingTopic } = usePlanTopic(context.topicId ?? undefined)
  const { data: topicProgress } = useTopicProgress(context.topicId ?? undefined, session?.user?.id)

  return {
    ...context,
    topicTitle: topic?.title ?? null,
    topicProgress: topicProgress?.progress_percentage ?? null,
    isLoadingTopic
  }
}

/**
 * Hook to automatically track reading progress in education plan context
 *
 * When the reader is opened from an education plan topic:
 * 1. Tracks scroll progress and updates reading progress
 * 2. Auto-updates topic progress based on completed readings
 * 3. Provides plan context metadata
 * 4. Tracks reading sessions for analytics
 */
export function usePlanContextReader(resourceId: string | undefined, currentSectionId: string | null) {
  const context = usePlanContext()
  const { session } = useSession()
  const updateReadingProgress = useUpdateReadingProgress()
  const { data: resource } = useResource(resourceId)

  // Session tracking
  const startReadingSession = useStartReadingSession()
  const updateReadingSession = useUpdateReadingSession()
  const endReadingSession = useEndReadingSession()
  const { data: activeSession } = useActiveReadingSession(resourceId)

  // Track session start time and viewed sections
  const sessionStartTime = useRef<number>(Date.now())
  const viewedSections = useRef<Set<string>>(new Set())

  // Calculate overall resource progress based on current section
  const resourceProgress = useMemo(() => {
    if (!resource || !currentSectionId) return 0

    const sections = resource.sections
    const currentIndex = sections.findIndex(s => s.id === currentSectionId)

    if (currentIndex === -1) return 0

    // Calculate progress as percentage through the resource
    // Use currentIndex + 1 so we count the current section as part of progress
    const progress = ((currentIndex + 1) / sections.length) * 100
    return Math.round(progress)
  }, [resource, currentSectionId])

  // Track last reported progress to avoid redundant updates
  const lastReportedProgressRef = useMemo(() => ({ current: 0 }), [])

  // Start reading session when entering reader in plan context
  useEffect(() => {
    if (!context.isInPlanContext || !context.planId || !context.topicId || !resourceId) return
    if (!session?.user?.id) return
    if (activeSession) return // Session already active

    // Start a new session
    startReadingSession.mutate({
      userId: session.user.id,
      planId: context.planId,
      topicId: context.topicId,
      resourceId
    })

    sessionStartTime.current = Date.now()
    viewedSections.current.clear()
  }, [context.isInPlanContext, context.planId, context.topicId, resourceId, session?.user?.id, activeSession, startReadingSession])

  // Track section views
  useEffect(() => {
    if (!currentSectionId || !activeSession) return
    viewedSections.current.add(currentSectionId)
  }, [currentSectionId, activeSession])

  // Update session progress periodically (throttled to avoid infinite loops)
  useEffect(() => {
    if (!activeSession || !context.isInPlanContext) return
    if (resourceProgress === 0) return

    // Throttle updates: only update every 10% progress change or every 30 seconds
    const progressChange = Math.abs(resourceProgress - (activeSession.scroll_progress ?? 0))
    if (progressChange < 10 && resourceProgress < 100) {
      // Don't update unless 10% progress change or completed
      return
    }

    const elapsedSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000)
    const isCompleted = resourceProgress >= 100

    updateReadingSession.mutate({
      sessionId: activeSession.id,
      updates: {
        readingTime: elapsedSeconds,
        scrollProgress: resourceProgress,
        sectionsViewed: viewedSections.current.size,
        completed: isCompleted
      }
    })
  }, [activeSession, context.isInPlanContext, resourceProgress])

  // End session when leaving page (cleanup function)
  useEffect(() => {
    const sessionToEnd = activeSession?.id
    return () => {
      if (sessionToEnd) {
        endReadingSession.mutate(sessionToEnd)
      }
    }
  }, [activeSession?.id])

  // Update reading progress when in plan context
  useEffect(() => {
    if (!context.isInPlanContext || !context.topicId || !resourceId) return
    if (!session?.user?.id) return
    if (resourceProgress === 0) return

    // Only update if progress has changed by at least 5% to reduce API calls
    const progressChange = Math.abs(resourceProgress - lastReportedProgressRef.current)
    if (progressChange < 5 && resourceProgress < 100) return

    // Update reading progress for this resource within the topic
    updateReadingProgress.mutate({
      topicId: context.topicId,
      resourceId,
      progressPercent: resourceProgress
    })

    lastReportedProgressRef.current = resourceProgress
  }, [context.isInPlanContext, context.topicId, resourceId, resourceProgress, session?.user?.id, updateReadingProgress, lastReportedProgressRef])

  return {
    ...context,
    resourceProgress,
    isUpdatingProgress: updateReadingProgress.isPending,
    activeSession
  }
}
