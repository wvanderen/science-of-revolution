import React from 'react'

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface UserAvatarProps {
  src?: string | null
  alt?: string
  size: 'small' | 'medium' | 'large'
  fallback?: string
  privacyLevel?: 'public' | 'cohorts' | 'private'
  className?: string
}

const sizeClasses = {
  small: 'w-8 h-8 text-sm',
  medium: 'w-10 h-10 text-base',
  large: 'w-16 h-16 text-lg'
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User avatar',
  size,
  fallback,
  privacyLevel: _privacyLevel = 'public',
  className
}) => {
  const [imageError, setImageError] = React.useState(false)

  // Generate fallback initials from fallback text
  const generateFallback = (text?: string) => {
    if (!text) return '?'
    const words = text.trim().split(/\s+/)
    if (words.length >= 2) {
      return words[0][0]?.toUpperCase() + words[1][0]?.toUpperCase()
    }
    return text[0]?.toUpperCase() ?? '?'
  }

  const showFallback = !src || imageError
  const fallbackText = generateFallback(fallback)

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium select-none',
          sizeClasses[size],
          className
        )}
        title={alt}
      >
        {fallbackText}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'rounded-full object-cover select-none',
        sizeClasses[size],
        className
      )}
      onError={() => setImageError(true)}
      title={alt}
    />
  )
}