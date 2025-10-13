import { useQuery } from '@tanstack/react-query'
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
 * Fetch all resources ordered by sequence
 */
export function useResources () {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['resources'],
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('sequence_order', { ascending: true, nullsFirst: false })

      if (error != null) throw error
      return data ?? []
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
