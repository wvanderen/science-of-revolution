import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type SharedNote = Database['public']['Views']['shared_notes_view']['Row']
type Highlight = Database['public']['Tables']['highlights']['Row']

export class SharedNotesRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get shared notes for a specific section, optionally filtered by cohort
   */
  async getSharedNotesBySectionId (
    sectionId: string,
    cohortId?: string
  ): Promise<SharedNote[]> {
    let query = this.supabase
      .from('shared_notes_view')
      .select('*')
      .eq('resource_section_id', sectionId)

    if (cohortId != null) {
      query = query.eq('cohort_id', cohortId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Get all shared notes for a specific cohort
   */
  async getSharedNotesByCohortId (cohortId: string): Promise<SharedNote[]> {
    const { data, error } = await this.supabase
      .from('shared_notes_view')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false })

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Share a highlight with a specific cohort
   * Updates visibility and sets cohort_id
   *
   * @security RLS policies enforce that:
   * 1. User must own the highlight (user_id = auth.uid())
   * 2. User must be a member of the target cohort
   * Database will reject unauthorized updates with an RLS policy violation
   */
  async shareHighlight (
    highlightId: string,
    cohortId: string,
    visibility: 'cohort' | 'global' = 'cohort'
  ): Promise<Highlight> {
    const { data, error } = await this.supabase
      .from('highlights')
      .update({
        visibility,
        cohort_id: cohortId,
        updated_at: new Date().toISOString()
      })
      .eq('id', highlightId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Make a highlight private (unshare)
   *
   * @security RLS policies ensure user can only unshare their own highlights
   */
  async unshareHighlight (highlightId: string): Promise<Highlight> {
    const { data, error } = await this.supabase
      .from('highlights')
      .update({
        visibility: 'private',
        cohort_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', highlightId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }
}
