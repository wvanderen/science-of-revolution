import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type Progress = Database['public']['Tables']['progress']['Row']
type ProgressInsert = Database['public']['Tables']['progress']['Insert']
type ProgressUpdate = Database['public']['Tables']['progress']['Update']

export class ProgressRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get progress for a user and section
   */
  async getByUserAndSection (userId: string, sectionId: string): Promise<Progress | null> {
    const { data, error } = await this.supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_section_id', sectionId)
      .single()

    if (error != null) {
      // Progress doesn't exist yet
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * Get all progress for a user on a resource
   */
  async getByUserAndResource (userId: string, resourceId: string): Promise<Progress[]> {
    // Join with resource_sections to filter by resource_id
    const { data, error } = await this.supabase
      .from('progress')
      .select(`
        *,
        resource_sections!inner(resource_id)
      `)
      .eq('user_id', userId)
      .eq('resource_sections.resource_id', resourceId)

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Upsert progress (create or update)
   */
  async upsert (progress: ProgressInsert): Promise<Progress> {
    const { data, error } = await this.supabase
      .from('progress')
      .upsert(progress, {
        onConflict: 'user_id,resource_section_id'
      })
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update scroll position
   */
  async updateScrollPosition (
    userId: string,
    sectionId: string,
    scrollPercent: number
  ): Promise<Progress> {
    const updates: ProgressUpdate = {
      scroll_percent: scrollPercent,
      status: scrollPercent >= 90 ? 'completed' : 'in_progress',
      completed_at: scrollPercent >= 90 ? new Date().toISOString() : null
    }

    const { data, error } = await this.supabase
      .from('progress')
      .upsert(
        {
          user_id: userId,
          resource_section_id: sectionId,
          ...updates
        },
        {
          onConflict: 'user_id,resource_section_id'
        }
      )
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Mark section as completed manually
   */
  async markCompleted (userId: string, sectionId: string): Promise<Progress> {
    return await this.updateScrollPosition(userId, sectionId, 100)
  }
}
