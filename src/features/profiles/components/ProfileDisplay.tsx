import React from 'react'
import { useProfileDetails } from '../hooks/useProfileDetails'
import { usePrivacyLevel } from '../hooks/usePrivacyLevel'
import { UserAvatar } from './UserAvatar'

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface ProfileDisplayProps {
  userId: string
  privacyContext?: 'public' | 'cohorts' | 'private'
  showAvatar?: boolean
  showName?: boolean
  showBio?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const sizeClasses = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg'
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  userId,
  privacyContext = 'public',
  showAvatar = true,
  showName = true,
  showBio = false,
  size = 'medium',
  className
}) => {
  const { data: profile, isLoading, error } = useProfileDetails(userId)
  const { canViewAvatar, canViewName, canViewBio } = usePrivacyLevel(privacyContext)

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-3', sizeClasses[size], className)}>
        {showAvatar && (
          <div className="animate-pulse bg-muted rounded-full w-10 h-10" />
        )}
        {(showName || showBio) && (
          <div className="space-y-1">
            {showName && <div className="animate-pulse bg-muted rounded h-4 w-24" />}
            {showBio && <div className="animate-pulse bg-muted rounded h-3 w-32" />}
          </div>
        )}
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={cn('flex items-center gap-3 text-muted-foreground', sizeClasses[size], className)}>
        {showAvatar && (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            ?
          </div>
        )}
        {(showName || showBio) && (
          <div>
            {showName && <span>Profile unavailable</span>}
          </div>
        )}
      </div>
    )
  }

  // Check privacy settings for each element
  const canShowAvatar = showAvatar && canViewAvatar(profile)
  const canShowName = showName && canViewName(profile)
  const canShowBio = showBio && canViewBio(profile)
  const displayName = profile.display_name ?? 'Unknown User'

  return (
    <div className={cn('flex items-center gap-3', sizeClasses[size], className)}>
      {canShowAvatar && (
        <UserAvatar
          src={profile.avatar_url}
          alt={`${displayName} avatar`}
          size={size}
          fallback={displayName}
          privacyLevel={profile.privacy_settings?.profile_visibility}
        />
      )}

      {(canShowName || canShowBio) && (
        <div className="flex flex-col">
          {canShowName && (
            <span className={cn(
              'font-medium text-foreground',
              sizeClasses[size]
            )}>
              {displayName}
            </span>
          )}
          {canShowBio && profile.bio && (
            <span className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </span>
          )}
        </div>
      )}
    </div>
  )
}