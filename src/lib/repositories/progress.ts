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
    // Get existing progress to check if already completed
    const existingProgress = await this.getByUserAndSection(userId, sectionId)

    // Once completed, stay completed unless manually un-completed
    const isAlreadyCompleted = existingProgress?.status === 'completed'

    // Determine status and completion timestamp
    let status: 'not_started' | 'in_progress' | 'completed'
    let completed_at: string | null

    if (isAlreadyCompleted) {
      // Preserve completed status
      status = 'completed'
      completed_at = existingProgress.completed_at ?? new Date().toISOString()
    } else if (scrollPercent >= 85) {
      // Mark as completed when reaching 85% or higher
      // This is more forgiving and handles cases where users reach "the bottom"
      // but might not be at exactly 100% due to rounding or browser differences
      status = 'completed'
      completed_at = new Date().toISOString()
    } else {
      // In progress
      status = 'in_progress'
      completed_at = null
    }

    const { data, error } = await this.supabase
      .from('progress')
      .upsert(
        {
          user_id: userId,
          resource_section_id: sectionId,
          scroll_percent: scrollPercent,
          status,
          completed_at
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

  /**
   * Mark section as in progress (not completed)
   */
  async markInProgress (userId: string, sectionId: string): Promise<Progress> {
    const updates: ProgressUpdate = {
      status: 'in_progress',
      completed_at: null
    }

    const { data, error } = await this.supabase
      .from('progress')
      .upsert(
        {
          user_id: userId,
          resource_section_id: sectionId,
          scroll_percent: 0, // Reset to 0 when uncompleting
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
}
