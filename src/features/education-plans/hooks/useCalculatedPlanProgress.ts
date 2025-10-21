import { useQuery } from '@tanstack/react-query'
import { useSession } from '../../../hooks/useSession'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { usePlanTopics } from './usePlanTopics'
import { ProgressRepository } from '../../../lib/repositories/progress'
import { PlanTopicRepository } from '../../../lib/repositories/planTopics'
// import type { Database } from '../../../lib/database.types'


/**
 * Hook to calculate plan progress from topic completion data
 * This calculates the overall plan progress based on individual topic progress
 */
export function useCalculatedPlanProgress(planId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const { data: topics } = usePlanTopics(planId)

  return useQuery({
    queryKey: ['calculated-plan-progress', planId, session?.user?.id],
    queryFn: async () => {
      if (!planId || !session?.user?.id || !topics || topics.length === 0) {
        return {
          progress_percentage: 0,
          completedTopics: 0,
          totalTopics: 0,
          status: 'not_started' as const
        }
      }

      const progressRepository = new ProgressRepository(supabase)
      const planTopicRepository = new PlanTopicRepository(supabase)

      // Calculate progress for each topic
      const topicProgressPromises = topics.map(async (topic) => {
        // Get readings for this topic
        const readings = await planTopicRepository.getTopicReadings(topic.id)

        if (!readings || readings.length === 0) {
          return { progress_percentage: 0, status: 'not_started' as const }
        }

        // Fetch all resource sections for this topic's readings in parallel
        const resourceSectionsPromises = readings.map(async (reading) => {
          const { data, error } = await supabase
            .from('resource_sections')
            .select('*')
            .eq('resource_id', reading.resource_id)
            .order('order', { ascending: true })

          if (error != null) throw error
          return data ?? []
        })

        const allResourceSections = await Promise.all(resourceSectionsPromises)

        // Fetch all progress data in parallel
        const progressPromises = readings.map((reading) =>
          progressRepository.getByUserAndResource(session.user.id, reading.resource_id)
        )
        const allProgressData = await Promise.all(progressPromises)

        let totalProgress = 0

        // Process each reading
        readings.forEach((reading, index) => {
          const sections = allResourceSections[index]
          const totalSections = sections.length

          if (totalSections === 0) {
            return
          }

          const progressEntries = allProgressData[index]
          const completedSections = progressEntries.filter((p) => p.status === 'completed').length
          const furthestPercent = progressEntries.reduce((max, entry) => {
            const sectionProgress = entry.status === 'completed' ? 100 : (entry.scroll_percent ?? 0)
            return Math.max(max, sectionProgress)
          }, 0)

          let completionPercentage = Math.max(0, Math.min(100, Math.round(furthestPercent)))

          const isCompleted = completedSections === totalSections
          if (isCompleted) {
            completionPercentage = 100
          } else if (completedSections < totalSections && completionPercentage >= 100) {
            completionPercentage = 99
          }

          totalProgress += completionPercentage
        })

        const averageProgress = readings.length > 0
          ? Math.round(totalProgress / readings.length)
          : 0

        const status = averageProgress >= 100
          ? 'completed'
          : averageProgress > 0
            ? 'in_progress'
            : 'not_started'

        return { progress_percentage: averageProgress, status }
      })

      const topicProgressResults = await Promise.all(topicProgressPromises)

      // Calculate overall plan progress
      let completedTopics = 0
      let totalProgress = 0

      topicProgressResults.forEach((result) => {
        totalProgress += result.progress_percentage
        if (result.status === 'completed') {
          completedTopics++
        }
      })

      const averageProgress = topics.length > 0
        ? Math.round(totalProgress / topics.length)
        : 0

      const status = averageProgress >= 100
        ? 'completed'
        : averageProgress > 0
          ? 'in_progress'
          : 'not_started'

      return {
        progress_percentage: averageProgress,
        completedTopics,
        totalTopics: topics.length,
        status
      }
    },
    enabled: !!planId && !!session?.user?.id && !!topics && topics.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000
  })
}
