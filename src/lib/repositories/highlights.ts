import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type Highlight = Database['public']['Tables']['highlights']['Row']
type HighlightInsert = Database['public']['Tables']['highlights']['Insert']
type HighlightUpdate = Database['public']['Tables']['highlights']['Update']
type Note = Database['public']['Tables']['notes']['Row']

export type HighlightWithNote = Highlight & { note: Note | null }

export class HighlightsRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get all highlights for a section by the current user
   */
  async getBySectionId (sectionId: string): Promise<HighlightWithNote[]> {
    const { data, error } = await this.supabase
      .from('highlights')
      .select('*, notes (*)')
      .eq('resource_section_id', sectionId)
      .order('start_pos', { ascending: true })

    if (error != null) throw error
    type HighlightWithNotesQuery = Highlight & { notes: Note[] | Note | null }
    const rows = (data ?? []) as HighlightWithNotesQuery[]

    return rows.map(({ notes, ...highlight }) => {
      let note: Note | null = null

      if (Array.isArray(notes) && notes.length > 0) {
        note = notes[0] ?? null
      } else if (notes != null && !Array.isArray(notes)) {
        note = notes
      }

      return {
        ...(highlight as Highlight),
        note
      }
    })
  }

  /**
   * Get a specific highlight by ID
   */
  async getById (id: string): Promise<Highlight | null> {
    const { data, error } = await this.supabase
      .from('highlights')
      .select('*')
      .eq('id', id)
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Create a new highlight
   */
  async create (highlight: HighlightInsert): Promise<Highlight> {
    const { data, error } = await this.supabase
      .from('highlights')
      .insert(highlight)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update a highlight
   */
  async update (id: string, updates: HighlightUpdate): Promise<Highlight> {
    const { data, error } = await this.supabase
      .from('highlights')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Delete a highlight
   */
  async delete (id: string): Promise<void> {
    const { error } = await this.supabase
      .from('highlights')
      .delete()
      .eq('id', id)

    if (error != null) throw error
  }

  /**
   * Get shared highlights for a section (respecting visibility)
   */
  async getSharedBySectionId (sectionId: string): Promise<Highlight[]> {
    const { data, error } = await this.supabase
      .from('highlights')
      .select('*')
      .eq('resource_section_id', sectionId)
      .in('visibility', ['cohort', 'global'])
      .order('created_at', { ascending: false })

    if (error != null) throw error
    return data ?? []
  }
}
