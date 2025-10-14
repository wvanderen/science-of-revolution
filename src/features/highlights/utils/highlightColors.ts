/**
 * Theme-aware highlight color palette
 * Colors adapt to current theme for optimal contrast and readability
 */

export interface HighlightColor {
  id: string
  name: string
  label: string
  // Theme-specific colors
  themes: {
    light: string
    dark: string
    sepia: string
    highContrast: string
  }
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    id: 'yellow',
    name: 'Yellow',
    label: 'General highlight',
    themes: {
      light: '#fef3c7',      // amber-100
      dark: '#78350f',       // amber-900
      sepia: '#f59e0b',     // amber-500
      highContrast: '#000000'
    }
  },
  {
    id: 'green',
    name: 'Green',
    label: 'Important concept',
    themes: {
      light: '#d1fae5',      // emerald-100
      dark: '#064e3b',       // emerald-900
      sepia: '#059669',      // emerald-600
      highContrast: '#000000'
    }
  },
  {
    id: 'blue',
    name: 'Blue',
    label: 'Definition',
    themes: {
      light: '#dbeafe',      // blue-100
      dark: '#1e3a8a',       // blue-900
      sepia: '#2563eb',      // blue-600
      highContrast: '#000000'
    }
  },
  {
    id: 'pink',
    name: 'Pink',
    label: 'Review item',
    themes: {
      light: '#fce7f3',      // pink-100
      dark: '#831843',       // pink-900
      sepia: '#db2777',      // pink-600
      highContrast: '#000000'
    }
  },
  {
    id: 'orange',
    name: 'Orange',
    label: 'Question',
    themes: {
      light: '#fed7aa',      // orange-100
      dark: '#7c2d12',       // orange-900
      sepia: '#ea580c',      // orange-600
      highContrast: '#000000'
    }
  }
]

export function getHighlightColor (colorId: string): HighlightColor {
  return HIGHLIGHT_COLORS.find(c => c.id === colorId) ?? HIGHLIGHT_COLORS[0]
}

/**
 * Get highlight color for current theme
 */
export function getHighlightColorForTheme (colorId: string, theme: string): string {
  const color = getHighlightColor(colorId)

  switch (theme) {
    case 'dark':
      return color.themes.dark
    case 'sepia':
      return color.themes.sepia
    case 'high-contrast':
      return color.themes.highContrast
    default:
      return color.themes.light
  }
}

/**
 * Get all available highlight colors for current theme
 */
export function getHighlightColorsForTheme (theme: string): Array<HighlightColor & { bgHex: string }> {
  return HIGHLIGHT_COLORS.map(color => ({
    ...color,
    bgHex: getHighlightColorForTheme(color.id, theme)
  }))
}
