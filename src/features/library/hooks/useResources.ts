import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { type Database } from '../../../lib/database.types'

type Resource = Database['public']['Tables']['resources']['Row']
type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

export interface ResourceWithSections extends Resource {
  sections: ResourceSection[]
  totalWordCount?: number
  sectionCount?: number
}

/**
 * Fetch all resources ordered by sequence with section counts
 */
export function useResources () {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['resources'],
    queryFn: async (): Promise<ResourceWithSections[]> => {
      // Fetch all resources
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('sequence_order', { ascending: true, nullsFirst: false })

      if (resourcesError != null) throw resourcesError

      // Fetch all sections for all resources
      const { data: sections, error: sectionsError } = await supabase
        .from('resource_sections')
        .select('*')
        .order('order', { ascending: true })

      if (sectionsError != null) throw sectionsError

      // Group sections by resource and calculate aggregates
      const sectionsByResource = sections?.reduce((acc, section) => {
        if (!acc[section.resource_id]) {
          acc[section.resource_id] = []
        }
        acc[section.resource_id].push(section)
        return acc
      }, {} as Record<string, ResourceSection[]>) ?? {}

      // Combine resources with their sections
      const resourcesWithSections = (resources ?? []).map(resource => {
        const resourceSections = sectionsByResource[resource.id] ?? []
        const totalWordCount = resourceSections.reduce((sum, s) => sum + (s.word_count ?? 0), 0)

        return {
          ...resource,
          sections: resourceSections,
          totalWordCount,
          sectionCount: resourceSections.length
        }
      })

      return resourcesWithSections
    }
  })
}

/**
 * Fetch a single resource with all its sections
 */
export function useResource (resourceId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['resource', resourceId],
    queryFn: async (): Promise<ResourceWithSections | null> => {
      if (resourceId == null) return null

      // Fetch resource with sections
      const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single()

      if (resourceError != null) throw resourceError

      const { data: sections, error: sectionsError } = await supabase
        .from('resource_sections')
        .select('*')
        .eq('resource_id', resourceId)
        .order('order', { ascending: true })

      if (sectionsError != null) throw sectionsError

      // Calculate aggregates
      const totalWordCount = sections?.reduce((sum, s) => sum + (s.word_count ?? 0), 0) ?? 0

      return {
        ...resource,
        sections: sections ?? [],
        totalWordCount,
        sectionCount: sections?.length ?? 0
      }
    },
    enabled: resourceId != null
  })
}

/**
 * Fetch a single resource section by ID
 */
export function useResourceSection (sectionId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['resource-section', sectionId],
    queryFn: async (): Promise<ResourceSection | null> => {
      if (sectionId == null) return null

      const { data, error } = await supabase
        .from('resource_sections')
        .select('*')
        .eq('id', sectionId)
        .single()

      if (error != null) throw error
      return data
    },
    enabled: sectionId != null
  })
}

/**
 * Update a resource
 */
export function useUpdateResource () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Resource>
    }) => {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error != null) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch resources
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
    }
  })
}

/**
 * Delete a resource and all its sections
 */
export function useDeleteResource () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: string) => {
      // First, delete all sections for this resource
      const { error: sectionsError } = await supabase
        .from('resource_sections')
        .delete()
        .eq('resource_id', resourceId)

      if (sectionsError != null) throw sectionsError

      // Then delete the resource file from storage
      const { data: resource } = await supabase
        .from('resources')
        .select('storage_path')
        .eq('id', resourceId)
        .single()

      if (resource?.storage_path != null) {
        const { error: storageError } = await supabase.storage
          .from('resources')
          .remove([resource.storage_path])

        if (storageError != null) {
          console.warn('Failed to delete storage file:', storageError)
        }
      }

      // Finally delete the resource
      const { error: resourceError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)

      if (resourceError != null) throw resourceError
    },
    onSuccess: () => {
      // Invalidate and refetch resources
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
    }
  })
}
