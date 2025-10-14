import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { type ResourceWithSections } from './useResources'

export interface RecentReading {
  id: string
  resource: ResourceWithSections
  progress: {
    completedSections: number
    totalSections: number
    scrollPercent: number
    status: string
    lastReadAt: string | null
  }
  readingTime: string
}

export interface ReadingStats {
  totalRead: number
  totalTimeMinutes: number
  currentStreak: number
  averageSessionMinutes: number
}

export interface Recommendation {
  id: string
  title: string
  author: string
  reason: string
  type: string
  length: 'short' | 'medium' | 'long'
  coverArt?: string
}

/**
 * Hook to get reading insights and recommendations
 */
export function useReadingInsights(resources: ResourceWithSections[] = []) {
  const supabase = useSupabase()
  const { session } = useSession()

  return useQuery({
    queryKey: ['reading-insights', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        return {
          recentReading: [],
          stats: {
            totalRead: 0,
            totalTimeMinutes: 0,
            currentStreak: 0,
            averageSessionMinutes: 0
          },
          recommendations: []
        }
      }

      // Get recent progress with resource information
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          *,
          resource_sections!inner(
            id,
            title,
            resource_id,
            resources!inner(
              id,
              title,
              author,
              type,
              storage_path,
              created_at,
              updated_at
            )
          )
        `)
        .eq('user_id', session.user.id)
        .neq('status', 'not_started')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (progressError) throw progressError

      // Process recent reading data
      const resourceProgressMap = new Map<string, any[]>()

      progressData?.forEach(progress => {
        const resourceId = progress.resource_sections.resources.id
        if (!resourceProgressMap.has(resourceId)) {
          resourceProgressMap.set(resourceId, [])
        }
        resourceProgressMap.get(resourceId)?.push(progress)
      })

      const recentReading: RecentReading[] = []

      for (const [resourceId, progressArray] of resourceProgressMap) {
        const resource = resources.find(r => r.id === resourceId)
        if (!resource) continue

        const completedSections = progressArray.filter(p => p.status === 'completed').length
        const totalSections = progressArray.length
        const avgScrollPercent = progressArray.reduce((sum, p) => sum + (p.scroll_percent || 0), 0) / totalSections
        const lastReadAt = new Date(Math.max(...progressArray.map(p => new Date(p.updated_at).getTime())))

        // Calculate reading time (rough estimate)
        const totalWords = resource.totalWordCount || 0
        const readWords = Math.floor(totalWords * (avgScrollPercent / 100))
        const readingMinutes = Math.max(1, Math.ceil(readWords / 200)) // Assuming 200 WPM

        recentReading.push({
          id: resourceId,
          resource,
          progress: {
            completedSections,
            totalSections,
            scrollPercent: Math.round(avgScrollPercent),
            status: avgScrollPercent >= 90 ? 'completed' : avgScrollPercent > 0 ? 'in-progress' : 'not-started',
            lastReadAt: lastReadAt.toISOString()
          },
          readingTime: readingMinutes < 60
            ? `${readingMinutes}m`
            : `${Math.floor(readingMinutes / 60)}h ${readingMinutes % 60}m`
        })
      }

      // Sort by last read time and limit to 5
      recentReading.sort((a, b) =>
        new Date(b.progress.lastReadAt!).getTime() - new Date(a.progress.lastReadAt!).getTime()
      )

      // Calculate stats
      const completedResources = recentReading.filter(r => r.progress.status === 'completed')
      const totalReadingTime = recentReading.reduce((sum, r) => {
        const minutes = parseInt(r.readingTime) || 0
        return sum + minutes
      }, 0)

      const stats: ReadingStats = {
        totalRead: completedResources.length,
        totalTimeMinutes: totalReadingTime,
        currentStreak: calculateStreak(completedResources.map(r => r.progress.lastReadAt!)),
        averageSessionMinutes: recentReading.length > 0
          ? Math.round(totalReadingTime / recentReading.length)
          : 0
      }

      // Generate recommendations (placeholder logic)
      const recommendations: Recommendation[] = generateRecommendations(resources, recentReading)

      return {
        recentReading: recentReading.slice(0, 5),
        stats,
        recommendations: recommendations.slice(0, 3)
      }
    },
    enabled: !!session?.user?.id && resources.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

/**
 * Calculate reading streak based on completion dates
 */
function calculateStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0

  const dates = completionDates
    .map(date => new Date(date).toDateString())
    .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort newest first

  let streak = 0
  const today = new Date().toDateString()
  let currentDate = new Date()

  // Check if there's activity today or yesterday to start streak
  const hasToday = dates[0] === today
  const hasYesterday = dates[0] === new Date(Date.now() - 86400000).toDateString()

  if (!hasToday && !hasYesterday) return 0

  if (hasYesterday && !hasToday) {
    // If no activity today but there was yesterday, start from yesterday
    currentDate = new Date(Date.now() - 86400000)
  }

  // Count consecutive days
  for (let i = 0; i < dates.length; i++) {
    const expectedDate = currentDate.toDateString()
    if (dates[i] === expectedDate) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Generate reading recommendations based on user history
 */
function generateRecommendations(resources: ResourceWithSections[], recentReading: RecentReading[]): Recommendation[] {
  const readResourceIds = new Set(recentReading.map(r => r.id))
  const unreadResources = resources.filter(r => !readResourceIds.has(r.id))

  // Simple recommendation logic - can be enhanced
  const recommendations: Recommendation[] = []

  // Recommend short resources if user hasn't read much
  if (recentReading.length < 3) {
    const shortResources = unreadResources.filter(r => {
      const wordCount = r.totalWordCount || 0
      return wordCount < 2000 // Less than 10 minutes reading
    }).slice(0, 2)

    shortResources.forEach(resource => {
      recommendations.push({
        id: resource.id,
        title: resource.title,
        author: resource.author || 'Unknown',
        reason: 'Quick read to get started',
        type: resource.type || 'article',
        length: 'short',
        coverArt: resource.storage_path
      })
    })
  }

  // Recommend resources similar to what user has read
  if (recentReading.length > 0) {
    const readTypes = [...new Set(recentReading.map(r => r.resource.type))]
    const similarResources = unreadResources.filter(r =>
      readTypes.includes(r.type || 'article')
    ).slice(0, 2)

    similarResources.forEach(resource => {
      recommendations.push({
        id: resource.id,
        title: resource.title,
        author: resource.author || 'Unknown',
        reason: `Similar to other ${resource.type}s you've read`,
        type: resource.type || 'article',
        length: resource.totalWordCount && resource.totalWordCount < 2000 ? 'short'
          : resource.totalWordCount && resource.totalWordCount < 8000 ? 'medium'
          : 'long' as const,
        coverArt: resource.storage_path
      })
    })
  }

  // Fill with popular resources if needed
  if (recommendations.length < 3) {
    const popularResources = unreadResources
      .slice(0, 3 - recommendations.length)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.author || 'Unknown',
        reason: 'Popular in the library',
        type: resource.type || 'article',
        length: resource.totalWordCount && resource.totalWordCount < 2000 ? 'short'
          : resource.totalWordCount && resource.totalWordCount < 8000 ? 'medium'
          : 'long' as const,
        coverArt: resource.storage_path
      }))

    recommendations.push(...popularResources)
  }

  return recommendations.slice(0, 3)
}