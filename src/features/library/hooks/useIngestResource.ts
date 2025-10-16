import { useMutation } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { ResourceSectionsRepository } from '../../../lib/repositories/resourceSections'
import { parseContentToSections } from '../utils/contentIngestion'
import { type Database } from '../../../lib/database.types'

type ResourceInsert = Database['public']['Tables']['resources']['Insert']

interface IngestResourceParams {
  resource: Omit<ResourceInsert, 'id' | 'created_at' | 'updated_at'>
  content: string
  format?: 'markdown' | 'html' | 'auto'
}

interface IngestResourceResult {
  resourceId: string
  sectionsCreated: number
}

/**
 * Hook to ingest a new resource with content parsing and section creation
 */
export function useIngestResource () {
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async (params: IngestResourceParams): Promise<IngestResourceResult> => {
      const { resource, content, format = 'auto' } = params

      // Step 1: Create the resource record
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .insert(resource)
        .select()
        .single()

      if (resourceError != null) throw resourceError

      // Step 2: Parse content into sections
      const parsedSections = parseContentToSections(content, format, resource.title)

      // Step 3: Create section records
      const repository = new ResourceSectionsRepository(supabase)
      const sectionsToInsert = parsedSections.map(section => ({
        resource_id: resourceData.id,
        title: section.title,
        order: section.order,
        content_html: section.content_html,
        word_count: section.word_count
      }))

      await repository.createMany(sectionsToInsert)

      return {
        resourceId: resourceData.id,
        sectionsCreated: parsedSections.length
      }
    }
  })
}
