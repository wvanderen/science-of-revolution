import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { HighlightsRepository, type HighlightWithNote } from '../../../lib/repositories/highlights'
import { type Database } from '../../../lib/database.types'

type Highlight = Database['public']['Tables']['highlights']['Row']
type HighlightInsert = Database['public']['Tables']['highlights']['Insert']

export interface CreateHighlightParams {
  resource_section_id: string
  start_pos: number
  end_pos: number
  text_content: string
  color: string
  visibility?: 'private' | 'cohort' | 'global'
}

/**
 * Fetch highlights for a section
 */
export function useHighlights (sectionId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['highlights', sectionId],
    queryFn: async (): Promise<HighlightWithNote[]> => {
      if (sectionId == null) return []

      const repository = new HighlightsRepository(supabase)
      return await repository.getBySectionId(sectionId)
    },
    enabled: sectionId != null
  })
}

/**
 * Create a new highlight
 */
export function useCreateHighlight () {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateHighlightParams): Promise<Highlight> => {
      if (session?.user == null) {
        throw new Error('User must be authenticated to create highlights')
      }

      const repository = new HighlightsRepository(supabase)

      const highlightData: HighlightInsert = {
        user_id: session.user.id,
        resource_section_id: params.resource_section_id,
        start_pos: params.start_pos,
        end_pos: params.end_pos,
        text_content: params.text_content,
        color: params.color,
        visibility: params.visibility ?? 'private'
      }

      return await repository.create(highlightData)
    },
    onSuccess: (_, variables) => {
      // Invalidate highlights query for this section
      void queryClient.invalidateQueries({
        queryKey: ['highlights', variables.resource_section_id]
      })
    }
  })
}

/**
 * Delete a highlight
 */
export function useDeleteHighlight () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (highlightId: string): Promise<void> => {
      const repository = new HighlightsRepository(supabase)
      await repository.delete(highlightId)
    },
    onSuccess: () => {
      // Invalidate all highlights queries
      void queryClient.invalidateQueries({
        queryKey: ['highlights']
      })
    }
  })
}

/**
 * Update highlight color or visibility
 */
export function useUpdateHighlight () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      color?: string
      visibility?: 'private' | 'cohort' | 'global'
    }): Promise<Highlight> => {
      const repository = new HighlightsRepository(supabase)
      const { id, ...updates } = params
      return await repository.update(id, updates)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['highlights']
      })
    }
  })
}

export type { HighlightWithNote } from '../../../lib/repositories/highlights'
