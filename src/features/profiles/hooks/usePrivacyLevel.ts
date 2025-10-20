import { useMemo } from 'react'
import { useSession } from '../../../hooks/useSession'
import type { ProfileRow } from '../types/profile.types'

interface UsePrivacyLevelResult {
  canViewProfile: (profile: ProfileRow) => boolean
  canViewAvatar: (profile: ProfileRow) => boolean
  canViewName: (profile: ProfileRow) => boolean
  canViewBio: (profile: ProfileRow) => boolean
  privacyContext: 'public' | 'cohorts' | 'private'
}

/**
 * Hook for checking privacy permissions based on profile settings
 *
 * This hook provides functions to check if certain profile information
 * can be displayed based on the profile's privacy settings and the current context.
 */
export function usePrivacyLevel(context: 'public' | 'cohorts' | 'private' = 'public'): UsePrivacyLevelResult {
  const { session } = useSession()
  const currentUserId = session?.user?.id

  const privacyContext = context

  const canViewProfile = useMemo(() => {
    return (profile: ProfileRow): boolean => {
      // Always show own profile
      if (profile.id === currentUserId) return true

      const visibility = profile.privacy_settings?.profile_visibility ?? 'private'

      switch (visibility) {
        case 'public':
          return true
        case 'cohorts':
          return privacyContext === 'cohorts'
        case 'private':
          return false
        default:
          return false
      }
    }
  }, [currentUserId, privacyContext])

  const canViewAvatar = useMemo(() => {
    return (profile: ProfileRow): boolean => {
      // Always show own avatar
      if (profile.id === currentUserId) return true

      const visibility = profile.privacy_settings?.profile_visibility ?? 'private'

      switch (visibility) {
        case 'public':
          return true
        case 'cohorts':
          return privacyContext === 'cohorts'
        case 'private':
          return false
        default:
          return false
      }
    }
  }, [currentUserId, privacyContext])

  const canViewName = useMemo(() => {
    return (profile: ProfileRow): boolean => {
      // Always show own name
      if (profile.id === currentUserId) return true

      const visibility = profile.privacy_settings?.profile_visibility ?? 'private'

      switch (visibility) {
        case 'public':
          return true
        case 'cohorts':
          return privacyContext === 'cohorts'
        case 'private':
          return false
        default:
          return false
      }
    }
  }, [currentUserId, privacyContext])

  const canViewBio = useMemo(() => {
    return (profile: ProfileRow): boolean => {
      // Always show own bio
      if (profile.id === currentUserId) return true

      const visibility = profile.privacy_settings?.profile_visibility ?? 'private'

      switch (visibility) {
        case 'public':
          return true
        case 'cohorts':
          return privacyContext === 'cohorts'
        case 'private':
          return false
        default:
          return false
      }
    }
  }, [currentUserId, privacyContext])

  return {
    canViewProfile,
    canViewAvatar,
    canViewName,
    canViewBio,
    privacyContext
  }
}