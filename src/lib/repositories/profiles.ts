import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type ReadingPreferences = ProfileRow['reading_preferences']
type PrivacySettings = ProfileRow['privacy_settings']

export interface CreateProfileDto {
  id: string
  display_name: string
  roles?: string[]
  primary_cohort_id?: string | null
  avatar_url?: string | null
  bio?: string | null
  reading_preferences?: Partial<ReadingPreferences>
  privacy_settings?: Partial<PrivacySettings>
}

export class ProfilesRepository {
  constructor (private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Retrieve a profile by user id.
   */
  async getProfile (userId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error != null) {
      if (error.code === 'PGRST116' || error.code === 'PGRST301') return null
      throw error
    }

    return data
  }

  /**
   * Create a profile record for a new user.
   */
  async createProfile (profile: CreateProfileDto): Promise<ProfileRow> {
    const { reading_preferences, privacy_settings, ...rest } = profile

    const insertPayload: ProfileInsert = {
      ...rest,
      reading_preferences: {
        font_size: 18,
        font_family: 'serif',
        theme: 'light',
        reading_speed: 'normal',
        ...reading_preferences
      },
      privacy_settings: {
        profile_visibility: 'private',
        share_reading_progress: false,
        allow_shared_notes: false,
        ...privacy_settings
      }
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .insert(insertPayload)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update top-level profile information.
   */
  async updateProfile (userId: string, updates: Omit<ProfileUpdate, 'id'>): Promise<ProfileRow> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update the avatar URL independently.
   */
  async updateAvatar (userId: string, avatarUrl: string | null): Promise<ProfileRow> {
    return await this.updateProfile(userId, { avatar_url: avatarUrl })
  }

  /**
   * Merge and persist updated reading preferences.
   */
  async updatePreferences (
    userId: string,
    preferences: Partial<ReadingPreferences>
  ): Promise<ProfileRow> {
    const profile = await this.getProfile(userId)
    const currentPreferences = profile?.reading_preferences ?? {
      font_size: 18,
      font_family: 'serif',
      theme: 'light',
      reading_speed: 'normal'
    }

    const updatedPreferences: ReadingPreferences = {
      ...currentPreferences,
      ...preferences
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        reading_preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }

  /**
   * Update privacy settings for a profile. Requires full payload to enforce explicit choices.
   */
  async updatePrivacySettings (
    userId: string,
    settings: PrivacySettings
  ): Promise<ProfileRow> {
    const defaultSettings: PrivacySettings = {
      profile_visibility: 'private',
      share_reading_progress: false,
      allow_shared_notes: false
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        privacy_settings: {
          ...defaultSettings,
          ...settings
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error != null) throw error
    return data
  }
}
