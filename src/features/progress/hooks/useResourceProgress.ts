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
  const sectionTotal = sections?.length ?? totalSections

  // Calculate average progress across all sections
  const averagePercent = (() => {
    if (sectionTotal === 0) return 0

    // Create a map of section progress
    const progressMap = new Map(
      progress.map(p => [
        p.resource_section_id,
        p.status === 'completed' ? 100 : (p.scroll_percent ?? 0)
      ])
    )

    // If we have section definitions, use them to calculate average
    if (sections != null && sections.length > 0) {
      const total = sections.reduce((sum, section) => {
        const sectionProgress = progressMap.get(section.id) ?? 0
        return sum + sectionProgress
      }, 0)
      return total / sections.length
    }

    // Otherwise, assume any sections without progress are at 0%
    const totalProgress = Array.from(progressMap.values()).reduce((sum, val) => sum + val, 0)
    const sectionsWithNoProgress = Math.max(0, sectionTotal - progress.length)
    return totalProgress / sectionTotal
  })()

  const furthestPercent = (() => {
    return progress.reduce((max, entry) => {
      const sectionProgress = entry.status === 'completed' ? 100 : (entry.scroll_percent ?? 0)
      return Math.max(max, sectionProgress)
    }, 0)
  })()

  // Use average progress for more accurate completion tracking
  let normalizedCompletion = Math.max(0, Math.min(100, Math.round(averagePercent)))

  return {
    completedSections,
    totalSections: sectionTotal,
    completionPercentage: normalizedCompletion,
    hasStarted: progress.length > 0,
    isCompleted: sectionTotal > 0 ? completedSections === sectionTotal : normalizedCompletion >= 100,
    furthestPercent: normalizedCompletion
  }
}
