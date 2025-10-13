import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import { NotesRepository } from '../../../lib/repositories/notes'
import { type Database } from '../../../lib/database.types'

type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']

export interface CreateNoteParams {
  highlight_id: string
  content: string
}

export interface UpdateNoteParams {
  id: string
  content: string
}

/**
 * Fetch note for a highlight
 */
export function useNote (highlightId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['note', highlightId],
    queryFn: async (): Promise<Note | null> => {
      if (highlightId == null) return null

      const repository = new NotesRepository(supabase)
      return await repository.getByHighlightId(highlightId)
    },
    enabled: highlightId != null
  })
}

/**
 * Create a new note
 */
export function useCreateNote () {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateNoteParams): Promise<Note> => {
      if (session?.user == null) {
        throw new Error('User must be authenticated to create notes')
      }

      const repository = new NotesRepository(supabase)

      const noteData: NoteInsert = {
        highlight_id: params.highlight_id,
        user_id: session.user.id,
        content: params.content
      }

      return await repository.create(noteData)
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['note', data.highlight_id]
      })
      void queryClient.invalidateQueries({
        queryKey: ['highlights']
      })
    }
  })
}

/**
 * Update a note
 */
export function useUpdateNote () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateNoteParams): Promise<Note> => {
      const repository = new NotesRepository(supabase)
      return await repository.update(params.id, { content: params.content })
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['note', data.highlight_id]
      })
      void queryClient.invalidateQueries({
        queryKey: ['highlights']
      })
    }
  })
}

/**
 * Delete a note
 */
export function useDeleteNote () {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string): Promise<void> => {
      const repository = new NotesRepository(supabase)
      await repository.delete(noteId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['note']
      })
      void queryClient.invalidateQueries({
        queryKey: ['highlights']
      })
    }
  })
}
