/**
 * Generate a default avatar URL based on user information
 */
export function generateDefaultAvatarUrl(userId: string, displayName?: string): string {
  // Use a reliable avatar service like DiceBear or UI Avatars
  const seed = displayName || userId
  const encodedSeed = encodeURIComponent(seed.substring(0, 20)) // Limit length

  // Using UI Avatars API with consistent parameters
  return `https://ui-avatars.com/api/?name=${encodedSeed}&background=6366f1&color=fff&size=256&format=png&bold=true`
}

/**
 * Get a gradient-based avatar as fallback
 */
export function generateGradientAvatar(userId: string): string {
  // Generate consistent colors based on user ID
  const colors = [
    '6366f1', // Indigo
    '8b5cf6', // Violet
    'ec4899', // Pink
    'f43f5e', // Rose
    'f97316', // Orange
    'eab308', // Yellow
    '22c55e', // Green
    '14b8a6', // Teal
    '06b6d4', // Cyan
    '3b82f6'  // Blue
  ]

  // Use user ID to select consistent colors
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color1 = colors[hash % colors.length]
  const color2 = colors[(hash + 3) % colors.length]

  return `https://ui-avatars.com/api/?background=${color1}-${color2}&color=fff&name=${userId.substring(0, 2).toUpperCase()}&size=256&format=png&bold=true`
}

/**
 * Determine if an avatar URL is a fallback/default
 */
export function isFallbackAvatarUrl(url: string): boolean {
  return url.includes('ui-avatars.com') ||
         url.includes('dicebear.com') ||
         url.includes('gravatar.com') ||
         url.includes('avatar-placeholder')
}

/**
 * Get the best available avatar URL with fallback
 */
export function getAvatarWithFallback(
  customAvatarUrl: string | null | undefined,
  userId: string,
  displayName?: string
): string {
  if (customAvatarUrl && !isFallbackAvatarUrl(customAvatarUrl)) {
    return customAvatarUrl
  }

  // If custom avatar is empty or invalid, use fallback
  if (displayName && displayName.trim().length > 0) {
    return generateDefaultAvatarUrl(userId, displayName)
  }

  return generateGradientAvatar(userId)
}

/**
 * Preload avatar image to check if it loads successfully
 */
export async function preloadAvatar(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Get a verified working avatar URL
 */
export async function getVerifiedAvatarUrl(
  customAvatarUrl: string | null | undefined,
  userId: string,
  displayName?: string
): Promise<string> {
  // Try custom avatar first
  if (customAvatarUrl && !isFallbackAvatarUrl(customAvatarUrl)) {
    try {
      const isValid = await preloadAvatar(customAvatarUrl)
      if (isValid) {
        return customAvatarUrl
      }
    } catch (error) {
      console.warn('Failed to load custom avatar:', error)
    }
  }

  // Fallback to generated avatar
  const fallbackUrl = displayName
    ? generateDefaultAvatarUrl(userId, displayName)
    : generateGradientAvatar(userId)

  // Verify fallback loads
  try {
    const isValid = await preloadAvatar(fallbackUrl)
    if (isValid) {
      return fallbackUrl
    }
  } catch (error) {
    console.warn('Failed to load fallback avatar:', error)
  }

  // Ultimate fallback - return the URL anyway
  return fallbackUrl
}