import { ReactNode, useMemo } from 'react'
import { ReaderLayoutManager, type ReaderLayoutManagerProps } from './ReaderLayoutManager'
import { useProfileDetails } from '../../profiles/hooks/useProfileDetails'

interface ProfileAwareLayoutManagerProps {
  children: ReactNode
  className?: string
  isMobile?: boolean
  breakpoints?: {
    mobile: number
    tablet: number
    desktop: number
  }
  allowOverride?: boolean // Allow local preferences to override profile preferences
}

/**
 * ProfileAwareLayoutManager - Wrapper around ReaderLayoutManager that integrates profile preferences
 *
 * This component:
 * - Fetches user profile data
 * - Merges profile reading preferences with default reader settings
 * - Provides profile-based preferences to ReaderLayoutManager
 * - Allows local override when needed
 */
export function ProfileAwareLayoutManager({
  children,
  className,
  isMobile,
  breakpoints,
  allowOverride = false
}: ProfileAwareLayoutManagerProps): JSX.Element {
  const { data: profile, isLoading, error } = useProfileDetails()

  // Merge profile preferences with defaults
  const preferences = useMemo(() => {
    // Default preferences
    const defaultPreferences = {
      theme: 'light' as const,
      font_size: 16,
      font_family: 'serif' as const,
      line_height: 1.5,
      reading_speed: 'normal' as const
    }

    // If profile is loading or has an error, return defaults
    if (isLoading || error || !profile) {
      return defaultPreferences
    }

    // Extract profile preferences
    const profilePrefs = profile.reading_preferences ?? {}

    // Merge preferences (profile overrides defaults)
    const mergedPreferences = {
      ...defaultPreferences,
      ...profilePrefs
    }

    return mergedPreferences
  }, [profile, isLoading, error])

  return (
    <ReaderLayoutManager
      className={className}
      isMobile={isMobile}
      breakpoints={breakpoints}
      preferences={preferences}
    >
      {children}
    </ReaderLayoutManager>
  )
}