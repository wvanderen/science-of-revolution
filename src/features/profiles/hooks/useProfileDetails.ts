import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProfilesRepository } from '../../../lib/repositories/profiles'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'
import {
  type ProfileFormValues,
  type ProfileRow,
  type ReadingPreferences,
  type PrivacySettings
} from '../types/profile.types'

const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  font_size: 18,
  font_family: 'serif',
  theme: 'light',
  reading_speed: 'normal'
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile_visibility: 'private',
  share_reading_progress: false,
  allow_shared_notes: false
}

const DEFAULT_FORM_VALUES: ProfileFormValues = {
  displayName: '',
  bio: '',
  avatarUrl: null,
  readingPreferences: DEFAULT_READING_PREFERENCES,
  privacySettings: DEFAULT_PRIVACY_SETTINGS
}

function mapProfileToFormValues (profile: ProfileRow | null): ProfileFormValues {
  if (profile == null) return DEFAULT_FORM_VALUES

  return {
    displayName: profile.display_name ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatar_url,
    readingPreferences: {
      ...DEFAULT_READING_PREFERENCES,
      ...(profile.reading_preferences ?? {})
    },
    privacySettings: {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(profile.privacy_settings ?? {})
    }
  }
}

export function useProfileDetails () {
  const supabase = useSupabase()
  const { session, loading: sessionLoading } = useSession()
  const userId = session?.user?.id ?? null

  const repository = useMemo(() => new ProfilesRepository(supabase), [supabase])

  const query = useQuery({
    queryKey: ['profile-detail', userId],
    enabled: !sessionLoading && userId != null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (userId == null) {
        throw new Error('User is not authenticated')
      }

      const profile = await repository.getProfile(userId)
      if (profile == null) {
        throw new Error('Profile not found')
      }

      return profile
    }
  })

  const formValues = useMemo(() => mapProfileToFormValues(query.data ?? null), [query.data])

  return {
    ...query,
    userId,
    formValues,
    isSessionLoading: sessionLoading
  }
}
