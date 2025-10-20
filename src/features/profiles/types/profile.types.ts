import { type Database } from '../../../lib/database.types'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ReadingPreferences = ProfileRow['reading_preferences']
export type PrivacySettings = ProfileRow['privacy_settings']

export interface ProfileFormValues {
  displayName: string
  bio: string
  avatarUrl: string | null
  readingPreferences: ReadingPreferences
  privacySettings: PrivacySettings
}

export interface ProfileUpdateError {
  message: string
  field?: keyof ProfileFormValues | string
}
