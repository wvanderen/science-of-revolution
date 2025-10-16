import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { PlanEnrollmentRepository, type UserPlanProgressData, type UserTopicProgressData, type UserPlanProgressWithPlan } from '../../../lib/repositories/planEnrollment'

export interface UserPlanProgress {
  id: string
  user_id: string
  education_plan_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
  current_topic_id: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface UserTopicProgress {
  id: string
  user_id: string
  topic_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
  progress_percentage: number
  reading_progress: Record<string, number>
  created_at: string
  updated_at: string
}

/**
 * Hook to get user's enrollment status for a specific plan
 */
export function usePlanEnrollment(planId: string | undefined, userId?: string) {
  const { session } = useSession()
  const currentUserId = userId || session?.user?.id
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['plan-enrollment', planId, currentUserId],
    queryFn: () => {
      if (!planId || !currentUserId) return null
      return repository.getEnrollment(currentUserId, planId)
    },
    enabled: !!planId && !!currentUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get all enrollments for the current user
 */
export function useUserEnrollments() {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery<UserPlanProgressWithPlan[]>({
    queryKey: ['user-enrollments', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await repository.getUserEnrollments(session.user.id)
    },
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get enrollments for a specific plan
 */
export function usePlanEnrollments(planId: string | undefined) {
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['plan-enrollments', planId],
    queryFn: () => {
      if (!planId) return []
      return repository.getPlanEnrollments(planId)
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to enroll in an education plan
 */
export function useEnrollInPlan() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: (planId: string) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to enroll in plans')
      }

      return repository.enroll({
        userId: session.user.id,
        planId
      })
    },
    onSuccess: (enrollment, planId) => {
      // Add to cache
      queryClient.setQueryData(['plan-enrollment', planId, session?.user?.id], enrollment)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['plan-enrollments', planId] })
    },
    onError: (error) => {
      console.error('Failed to enroll in plan:', error)
    }
  })
}

/**
 * Hook to unenroll from an education plan
 */
export function useUnenrollFromPlan() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: (planId: string) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to unenroll from plans')
      }

      return repository.unenroll(session.user.id, planId)
    },
    onSuccess: (_, planId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['plan-enrollment', planId, session?.user?.id] })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['plan-enrollments', planId] })
    },
    onError: (error) => {
      console.error('Failed to unenroll from plan:', error)
    }
  })
}

/**
 * Hook to update plan progress
 */
export function useUpdatePlanProgress() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: UserPlanProgressData }) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to update progress')
      }

      return repository.updatePlanProgress(session.user.id, planId, data)
    },
    onSuccess: (updatedProgress, variables) => {
      // Update cache
      queryClient.setQueryData(['plan-enrollment', variables.planId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['plan-enrollments', variables.planId] })
    },
    onError: (error) => {
      console.error('Failed to update plan progress:', error)
    }
  })
}

/**
 * Hook to start a plan
 */
export function useStartPlan() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: ({ planId, firstTopicId }: { planId: string; firstTopicId?: string }) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to start plans')
      }

      return repository.startPlan(session.user.id, planId, firstTopicId)
    },
    onSuccess: (updatedProgress, planId) => {
      // Update cache
      queryClient.setQueryData(['plan-enrollment', planId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
    },
    onError: (error) => {
      console.error('Failed to start plan:', error)
    }
  })
}

/**
 * Hook to complete a plan
 */
export function useCompletePlan() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: (planId: string) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to complete plans')
      }

      return repository.completePlan(session.user.id, planId)
    },
    onSuccess: (updatedProgress, planId) => {
      // Update cache
      queryClient.setQueryData(['plan-enrollment', planId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
    },
    onError: (error) => {
      console.error('Failed to complete plan:', error)
    }
  })
}

/**
 * Hook to get topic progress for a user
 */
export function useTopicProgress(topicId: string | undefined, userId?: string) {
  const { session } = useSession()
  const currentUserId = userId || session?.user?.id
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['topic-progress', topicId, currentUserId],
    queryFn: () => {
      if (!topicId || !currentUserId) return null
      return repository.getTopicProgress(currentUserId, topicId)
    },
    enabled: !!topicId && !!currentUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get all topic progress for a user in a plan
 */
export function useUserPlanTopicProgress(planId: string | undefined, userId?: string) {
  const { session } = useSession()
  const currentUserId = userId || session?.user?.id
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['user-plan-topic-progress', planId, currentUserId],
    queryFn: () => {
      if (!planId || !currentUserId) return []
      return repository.getUserPlanTopicProgress(currentUserId, planId)
    },
    enabled: !!planId && !!currentUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to update topic progress
 */
export function useUpdateTopicProgress() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: UserTopicProgressData }) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to update topic progress')
      }

      return repository.updateTopicProgress(session.user.id, topicId, data)
    },
    onSuccess: (updatedProgress, topicId) => {
      // Update cache
      queryClient.setQueryData(['topic-progress', topicId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-plan-topic-progress'] })
    },
    onError: (error) => {
      console.error('Failed to update topic progress:', error)
    }
  })
}

/**
 * Hook to start a topic
 */
export function useStartTopic() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: (topicId: string) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to start topics')
      }

      return repository.startTopic(session.user.id, topicId)
    },
    onSuccess: (updatedProgress, topicId) => {
      // Update cache
      queryClient.setQueryData(['topic-progress', topicId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-plan-topic-progress'] })
    },
    onError: (error) => {
      console.error('Failed to start topic:', error)
    }
  })
}

/**
 * Hook to complete a topic
 */
export function useCompleteTopic() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: (topicId: string) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to complete topics')
      }

      return repository.completeTopic(session.user.id, topicId)
    },
    onSuccess: (updatedProgress, topicId) => {
      // Update cache
      queryClient.setQueryData(['topic-progress', topicId, session?.user?.id], updatedProgress)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-plan-topic-progress'] })
      queryClient.invalidateQueries({ queryKey: ['plan-enrollment'] })
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
    },
    onError: (error) => {
      console.error('Failed to complete topic:', error)
    }
  })
}

/**
 * Hook to update reading progress within a topic
 */
export function useUpdateReadingProgress() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useMutation({
    mutationFn: ({ topicId, resourceId, progressPercent }: {
      topicId: string;
      resourceId: string;
      progressPercent: number;
    }) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to update reading progress')
      }

      return repository.updateReadingProgress(session.user.id, topicId, resourceId, progressPercent)
    },
    onSuccess: (updatedProgress, variables) => {
      // Update cache
      queryClient.setQueryData(['topic-progress', variables.topicId, session?.user?.id], updatedProgress)

      // Invalidate all relevant queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['user-plan-topic-progress'] })
      queryClient.invalidateQueries({ queryKey: ['topic-progress', variables.topicId] })
      queryClient.invalidateQueries({ queryKey: ['plan-enrollment'] })
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', session?.user?.id] })
    },
    onError: (error) => {
      console.error('Failed to update reading progress:', error)
    }
  })
}

/**
 * Hook to get plan enrollment statistics
 */
export function usePlanEnrollmentStats(planId: string | undefined) {
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['plan-enrollment-stats', planId],
    queryFn: () => {
      if (!planId) return null
      return repository.getPlanEnrollmentStats(planId)
    },
    enabled: !!planId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get user's learning insights
 */
export function useUserLearningInsights() {
  const { session } = useSession()
  const supabase = useSupabase()
  const repository = new PlanEnrollmentRepository(supabase)

  return useQuery({
    queryKey: ['user-learning-insights', session?.user?.id],
    queryFn: () => {
      if (!session?.user?.id) return null
      return repository.getUserLearningInsights(session.user.id)
    },
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000
  })
}

