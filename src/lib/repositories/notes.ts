import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

export class NotesRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get note by highlight ID
   */
  async getByHighlightId (highlightId: string): Promise<Note | null> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('highlight_id', highlightId)
      .single()

    if (error != null) {
      // Note doesn't exist yet
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * Get all notes for a user
   */
  async getByUserId (userId: string): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Create a new note
   */
  async create (note: NoteInsert): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert(note)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update a note
   */
  async update (id: string, updates: NoteUpdate): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Delete a note
   */
  async delete (id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error != null) throw error
  }
}
