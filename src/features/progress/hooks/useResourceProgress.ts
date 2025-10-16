import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { ProgressRepository } from '../../../lib/repositories/progress'
import { type Database } from '../../../lib/database.types'

type Progress = Database['public']['Tables']['progress']['Row']
type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

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
 * Calculate completion details for a resource, including furthest scroll percent across sections
 */
export function useResourceCompletion (
  resourceId: string | undefined,
  totalSections: number = 0,
  sections?: ResourceSection[]
) {
  const { data: progress = [] } = useResourceProgress(resourceId)

  const completedSections = progress.filter(p => p.status === 'completed').length

  const furthestPercent = (() => {
    return progress.reduce((max, entry) => {
      const sectionProgress = entry.status === 'completed' ? 100 : (entry.scroll_percent ?? 0)
      return Math.max(max, sectionProgress)
    }, 0)
  })()

  let normalizedCompletion = Math.max(0, Math.min(100, Math.round(furthestPercent)))
  if ((sections?.length ?? totalSections) > 0 && completedSections < (sections?.length ?? totalSections) && normalizedCompletion >= 100) {
    normalizedCompletion = 99
  }
  const sectionTotal = sections?.length ?? totalSections

  return {
    completedSections,
    totalSections: sectionTotal,
    completionPercentage: normalizedCompletion,
    hasStarted: progress.length > 0,
    isCompleted: sectionTotal > 0 ? completedSections === sectionTotal : normalizedCompletion >= 100,
    furthestPercent: normalizedCompletion
  }
}
