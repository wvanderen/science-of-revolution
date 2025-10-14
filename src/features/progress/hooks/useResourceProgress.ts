import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { ProgressRepository } from '../../../lib/repositories/progress'
import { type Database } from '../../../lib/database.types'

type Progress = Database['public']['Tables']['progress']['Row']

/**
 * Fetch all progress for a user on a resource
 */
export function useResourceProgress (resourceId: string | undefined) {
  const supabase = useSupabase()
  const { session } = useSession()

  return useQuery({
    queryKey: ['resource-progress', session?.user?.id, resourceId],
    queryFn: async (): Promise<Progress[]> => {
      if (session?.user == null || resourceId == null) return []

      const repository = new ProgressRepository(supabase)
      return await repository.getByUserAndResource(session.user.id, resourceId)
    },
    enabled: session?.user != null && resourceId != null
  })
}

/**
 * Calculate completion percentage for a resource
 */
export function useResourceCompletion (resourceId: string | undefined, totalSections: number = 0) {
  const { data: progress = [] } = useResourceProgress(resourceId)

  const completedSections = progress.filter(p => p.status === 'completed').length
  const completionPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0

  return {
    completedSections,
    totalSections,
    completionPercentage,
    hasStarted: completedSections > 0 || progress.some(p => p.status === 'in_progress'),
    isCompleted: completedSections === totalSections && totalSections > 0
  }
}