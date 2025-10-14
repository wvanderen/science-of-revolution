import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { ProgressRepository } from '../../../lib/repositories/progress'
import { type Database } from '../../../lib/database.types'

type Progress = Database['public']['Tables']['progress']['Row']

/**
 * Fetch progress for a section
 */
export function useProgress (sectionId: string | undefined) {
  const supabase = useSupabase()
  const { session } = useSession()

  return useQuery({
    queryKey: ['progress', session?.user?.id, sectionId],
    queryFn: async (): Promise<Progress | null> => {
      if (session?.user == null || sectionId == null) return null

      const repository = new ProgressRepository(supabase)
      return await repository.getByUserAndSection(session.user.id, sectionId)
    },
    enabled: session?.user != null && sectionId != null
  })
}

/**
 * Update scroll position for a section
 */
export function useUpdateProgress () {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      sectionId: string
      scrollPercent: number
    }): Promise<Progress> => {
      if (session?.user == null) {
        throw new Error('User must be authenticated to track progress')
      }

      const repository = new ProgressRepository(supabase)
      return await repository.updateScrollPosition(
        session.user.id,
        params.sectionId,
        params.scrollPercent
      )
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['progress', session?.user?.id, variables.sectionId]
      })
    }
  })
}

/**
 * Mark a section as completed manually
 */
export function useMarkCompleted () {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sectionId: string): Promise<Progress> => {
      if (session?.user == null) {
        throw new Error('User must be authenticated to mark progress')
      }

      const repository = new ProgressRepository(supabase)
      return await repository.markCompleted(session.user.id, sectionId)
    },
    onSuccess: (_, sectionId) => {
      void queryClient.invalidateQueries({
        queryKey: ['progress', session?.user?.id, sectionId]
      })
    }
  })
}

/**
 * Toggle completion status for a section
 */
export function useToggleCompleted () {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      sectionId: string
      isCompleted: boolean
    }): Promise<Progress> => {
      if (session?.user == null) {
        throw new Error('User must be authenticated to toggle progress')
      }

      const repository = new ProgressRepository(supabase)
      if (params.isCompleted) {
        return await repository.markCompleted(session.user.id, params.sectionId)
      } else {
        return await repository.markInProgress(session.user.id, params.sectionId)
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['progress', session?.user?.id, variables.sectionId]
      })
    }
  })
}
