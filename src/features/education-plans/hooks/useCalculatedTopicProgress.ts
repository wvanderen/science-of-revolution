import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { ProgressRepository } from '../../../lib/repositories/progress'
import { useTopicReadings } from './usePlanTopics'
import { useResources } from '../../library/hooks/useResources'

/**
 * Hook to calculate topic progress from global resource completion data
 * This replaces the manual reading_progress tracking with automatic calculation
 * based on the user's actual reading progress in the progress table
 */
export function useCalculatedTopicProgress(topicId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()
  const { data: readings } = useTopicReadings(topicId)
  const { data: resources } = useResources()

  return useQuery({
    queryKey: ['calculated-topic-progress', topicId, session?.user?.id],
    queryFn: async () => {
      if (!topicId || !session?.user?.id || !readings || readings.length === 0) {
        return {
          progress_percentage: 0,
          status: 'not_started' as const,
          completedReadings: 0,
          totalReadings: 0,
          readingCompletions: {} as Record<string, { percentage: number; isCompleted: boolean }>
        }
      }

      const progressRepository = new ProgressRepository(supabase)
      const readingCompletions: Record<string, { percentage: number; isCompleted: boolean }> = {}

      // Fetch all progress data in parallel for better performance
      const progressPromises = readings.map(reading =>
        progressRepository.getByUserAndResource(session.user.id, reading.resource_id)
      )
      const allProgressData = await Promise.all(progressPromises)

      let totalProgress = 0
      let completedCount = 0

      // Process each reading with its corresponding progress data
      readings.forEach((reading, index) => {
        const resourceId = reading.resource_id
        const resource = resources?.find(r => r.id === resourceId)
        const totalSections = resource?.sections?.length ?? 0

        if (totalSections === 0) {
          // If resource has no sections, skip it
          readingCompletions[resourceId] = { percentage: 0, isCompleted: false }
          return
        }

        const progressEntries = allProgressData[index]

        // Calculate completion percentage
        const completedSections = progressEntries.filter(p => p.status === 'completed').length
        const furthestPercent = progressEntries.reduce((max, entry) => {
          const sectionProgress = entry.status === 'completed' ? 100 : (entry.scroll_percent ?? 0)
          return Math.max(max, sectionProgress)
        }, 0)

        let completionPercentage = Math.max(0, Math.min(100, Math.round(furthestPercent)))

        // If all sections are completed, ensure it shows 100%
        const isCompleted = completedSections === totalSections
        if (isCompleted) {
          completionPercentage = 100
        } else if (completedSections < totalSections && completionPercentage >= 100) {
          // Cap at 99% if not all sections are completed
          completionPercentage = 99
        }

        readingCompletions[resourceId] = {
          percentage: completionPercentage,
          isCompleted
        }

        totalProgress += completionPercentage
        if (isCompleted) {
          completedCount++
        }
      })

      // Calculate average progress across all readings
      const averageProgress = readings.length > 0
        ? Math.round(totalProgress / readings.length)
        : 0

      // Determine status
      const status = averageProgress >= 100
        ? 'completed'
        : averageProgress > 0
          ? 'in_progress'
          : 'not_started'

      return {
        progress_percentage: averageProgress,
        status,
        completedReadings: completedCount,
        totalReadings: readings.length,
        readingCompletions
      }
    },
    enabled: !!topicId && !!session?.user?.id && !!readings && readings.length > 0,
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently to show real-time progress
    gcTime: 2 * 60 * 1000
  })
}
