import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { ReadingSessionRepository, type SessionAnalytics, type UserReadingInsights } from '../../../lib/repositories/readingSessions'
import { useSession } from '../../../hooks/useSession'

/**
 * Hook to start a reading session
 */
export function useStartReadingSession() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const repository = new ReadingSessionRepository(supabase)

  return useMutation({
    mutationFn: (data: {
      planId: string
      topicId: string
      resourceId: string
      userId: string
    }) => repository.startSession(data),
    onSuccess: (session) => {
      // Set the active session directly in cache
      queryClient.setQueryData(['active-reading-session', session.user_id, session.resource_id], session)
      // Don't invalidate queries on start to prevent re-renders
    },
    onError: (error) => {
      console.error('Failed to start reading session:', error)
    }
  })
}

/**
 * Hook to update an active reading session
 */
export function useUpdateReadingSession() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const repository = new ReadingSessionRepository(supabase)

  return useMutation({
    mutationFn: ({ sessionId, updates }: {
      sessionId: string
      updates: {
        readingTime?: number
        scrollProgress?: number
        sectionsViewed?: number
        completed?: boolean
      }
    }) => repository.updateSession(sessionId, updates),
    onSuccess: (updatedSession) => {
      // Only update the specific session in cache, don't invalidate everything
      queryClient.setQueryData(['active-reading-session', updatedSession.user_id, updatedSession.resource_id], updatedSession)
      // Don't invalidate analytics on every update to prevent re-renders
    }
  })
}

/**
 * Hook to end a reading session
 */
export function useEndReadingSession() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const repository = new ReadingSessionRepository(supabase)

  return useMutation({
    mutationFn: (sessionId: string) => repository.endSession(sessionId),
    onSuccess: () => {
      // Invalidate on session end to update analytics
      queryClient.invalidateQueries({ queryKey: ['user-insights'] })
      queryClient.invalidateQueries({ queryKey: ['session-analytics'] })
    }
  })
}

/**
 * Hook to get active session for a resource
 */
export function useActiveReadingSession(resourceId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery({
    queryKey: ['active-reading-session', session?.user?.id, resourceId],
    queryFn: () => {
      if (!session?.user?.id || !resourceId) return null
      return repository.getActiveSession(session.user.id, resourceId)
    },
    enabled: !!session?.user?.id && !!resourceId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000
  })
}

/**
 * Hook to get resource analytics
 */
export function useResourceAnalytics(resourceId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery<SessionAnalytics>({
    queryKey: ['resource-analytics', session?.user?.id, resourceId],
    queryFn: async () => {
      if (!session?.user?.id || !resourceId) {
        return {
          totalSessions: 0,
          totalReadingTime: 0,
          averageSessionTime: 0,
          completedSessions: 0,
          completionRate: 0,
          sectionsViewed: 0,
          lastSessionDate: null
        }
      }
      return repository.getResourceAnalytics(session.user.id, resourceId)
    },
    enabled: !!session?.user?.id && !!resourceId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get topic analytics
 */
export function useTopicAnalytics(topicId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery<SessionAnalytics>({
    queryKey: ['topic-analytics', session?.user?.id, topicId],
    queryFn: async () => {
      if (!session?.user?.id || !topicId) {
        return {
          totalSessions: 0,
          totalReadingTime: 0,
          averageSessionTime: 0,
          completedSessions: 0,
          completionRate: 0,
          sectionsViewed: 0,
          lastSessionDate: null
        }
      }
      return repository.getTopicAnalytics(session.user.id, topicId)
    },
    enabled: !!session?.user?.id && !!topicId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get plan analytics
 */
export function usePlanAnalytics(planId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery<SessionAnalytics>({
    queryKey: ['plan-analytics', session?.user?.id, planId],
    queryFn: async () => {
      if (!session?.user?.id || !planId) {
        return {
          totalSessions: 0,
          totalReadingTime: 0,
          averageSessionTime: 0,
          completedSessions: 0,
          completionRate: 0,
          sectionsViewed: 0,
          lastSessionDate: null
        }
      }
      return repository.getPlanAnalytics(session.user.id, planId)
    },
    enabled: !!session?.user?.id && !!planId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get comprehensive user reading insights
 */
export function useUserReadingInsights() {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery<UserReadingInsights>({
    queryKey: ['user-insights', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        return {
          totalReadingTime: 0,
          totalSessions: 0,
          currentStreak: 0,
          completedReadings: 0,
          averageProgressPerSession: 0,
          mostActiveTime: null,
          recentSessions: []
        }
      }
      return repository.getUserInsights(session.user.id)
    },
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Hook to get recent reading sessions
 */
export function useRecentReadingSessions(limit: number = 10) {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new ReadingSessionRepository(supabase)

  return useQuery({
    queryKey: ['recent-reading-sessions', session?.user?.id, limit],
    queryFn: () => {
      if (!session?.user?.id) return []
      return repository.getRecentSessions(session.user.id, limit)
    },
    enabled: !!session?.user?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}
