import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../../../hooks/useSession'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import type { LibraryView, ResourceStatus, ResourceLength } from '../components/LibraryFilterBar'
import type { ResourceWithSections } from './useResources'

interface FilterCriteria {
  searchQuery: string
  view: LibraryView
  statusFilter: ResourceStatus
  lengthFilter: ResourceLength
  typeFilter: string
}

/**
 * Estimate reading time in minutes based on word count
 */
function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200) // 200 words per minute
}

/**
 * Get reading length category based on estimated reading time
 */
function getReadingLength(wordCount: number): 'short' | 'medium' | 'long' {
  const minutes = estimateReadingTime(wordCount)
  if (minutes < 15) return 'short'
  if (minutes <= 45) return 'medium'
  return 'long'
}

/**
 * Hook to filter resources based on search and filter criteria
 */
export function useFilteredResources(
  resources: ResourceWithSections[] | undefined,
  criteria: FilterCriteria
) {
  const filteredResources = useMemo(() => {
    if (!resources) return []

    return resources.filter((resource) => {
      const { searchQuery, view, statusFilter, lengthFilter, typeFilter } = criteria

      // Text search (title and author)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const titleMatch = resource.title.toLowerCase().includes(query)
        const authorMatch = resource.author?.toLowerCase().includes(query)
        if (!titleMatch && !authorMatch) return false
      }

      // Type filter
      if (typeFilter !== 'all' && resource.type !== typeFilter) {
        return false
      }

      // Length filter
      if (lengthFilter !== 'all') {
        const readingLength = getReadingLength(resource.totalWordCount || 0)
        if (readingLength !== lengthFilter) return false
      }

      return true
    })
  }, [resources, criteria])

  return filteredResources
}

/**
 * Hook to filter resources based on view (all, queue, collections)
 */
export function useViewFilteredResources(
  resources: ResourceWithSections[] | undefined,
  view: LibraryView
) {
  const { data: progressMap = {} } = useResourceProgressMap(resources)

  return useMemo(() => {
    if (!resources) return []

    switch (view) {
      case 'queue': {
        // Show resources with any progress or that have been interacted with
        return resources.filter((resource) => {
          const progress = progressMap[resource.id]
          return progress && progress.length > 0
        })
      }

      case 'collections': {
        // Group by type and show collections (for now, just show all)
        // TODO: Implement actual collections when we have a collections table
        return resources
      }

      case 'all':
      default:
        return resources
    }
  }, [resources, view, progressMap])
}

/**
 * Hook to get resource progress for filtering by status
 */
function useResourceProgressMap(resources: ResourceWithSections[] | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['resource-progress-map', session?.user?.id, resources?.map(r => r.id).join(',')],
    queryFn: async (): Promise<Record<string, any[]>> => {
      if (!session?.user?.id || !resources) return {}

      const resourceIds = resources.map(r => r.id)
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .in('resource_section_id', resourceIds)
        .eq('user_id', session.user.id)

      if (error) throw error

      // Group by resource_id (need to join with resource_sections to get resource_id)
      return (data ?? []).reduce((acc, progress) => {
        // For now, we'll use section_id as a proxy
        const resourceId = progress.resource_section_id
        if (!acc[resourceId]) {
          acc[resourceId] = []
        }
        acc[resourceId].push(progress)
        return acc
      }, {} as Record<string, any[]>)
    },
    enabled: !!session?.user?.id && !!resources?.length
  })
}

/**
 * Hook to apply status filtering to resources
 */
export function useStatusFilteredResources(
  resources: ResourceWithSections[] | undefined,
  statusFilter: ResourceStatus
) {
  const { data: progressMap = {} } = useResourceProgressMap(resources)

  return useMemo(() => {
    if (!resources || statusFilter === 'all') return resources

    return resources.filter((resource) => {
      const progress = progressMap[resource.id] || []

      switch (statusFilter) {
        case 'not-started':
          return progress.length === 0 || progress.every(p => p.status === 'not_started')

        case 'in-progress':
          return progress.some(p => p.status === 'in_progress')

        case 'completed':
          // Consider completed if all sections are completed
          if (progress.length === 0) return false
          return progress.every(p => p.status === 'completed')

        default:
          return true
      }
    })
  }, [resources, statusFilter, progressMap])
}

/**
 * Combined hook to apply all filters in the correct order
 */
export function useCompletelyFilteredResources(
  resources: ResourceWithSections[] | undefined,
  criteria: FilterCriteria
) {
  // First apply view filtering
  const viewFiltered = useViewFilteredResources(resources, criteria.view)

  // Then apply text/type/length filters
  const searchFiltered = useFilteredResources(viewFiltered, criteria)

  // Finally apply status filtering
  const statusFiltered = useStatusFilteredResources(searchFiltered, criteria.statusFilter)

  return statusFiltered
}