import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']
type ResourceSectionInsert = Database['public']['Tables']['resource_sections']['Insert']
type ResourceSectionUpdate = Database['public']['Tables']['resource_sections']['Update']

export class ResourceSectionsRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get all sections for a resource, ordered by section order
   */
  async getByResourceId (resourceId: string): Promise<ResourceSection[]> {
    const { data, error } = await this.supabase
      .from('resource_sections')
      .select('*')
      .eq('resource_id', resourceId)
      .order('order', { ascending: true })

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Get a specific section by ID
   */
  async getById (id: string): Promise<ResourceSection | null> {
    const { data, error } = await this.supabase
      .from('resource_sections')
      .select('*')
      .eq('id', id)
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Create a new resource section
   */
  async create (section: ResourceSectionInsert): Promise<ResourceSection> {
    const { data, error } = await this.supabase
      .from('resource_sections')
      .insert(section)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Create multiple sections in a batch
   */
  async createMany (sections: ResourceSectionInsert[]): Promise<ResourceSection[]> {
    const { data, error } = await this.supabase
      .from('resource_sections')
      .insert(sections)
      .select()

    if (error != null) throw error
    return data ?? []
  }

  /**
   * Update a resource section
   */
  async update (id: string, updates: ResourceSectionUpdate): Promise<ResourceSection> {
    const { data, error } = await this.supabase
      .from('resource_sections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Delete a resource section
   */
  async delete (id: string): Promise<void> {
    const { error } = await this.supabase
      .from('resource_sections')
      .delete()
      .eq('id', id)

    if (error != null) throw error
  }

  /**
   * Delete all sections for a resource
   */
  async deleteByResourceId (resourceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('resource_sections')
      .delete()
      .eq('resource_id', resourceId)

    if (error != null) throw error
  }
}
