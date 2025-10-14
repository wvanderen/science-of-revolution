import { useEffect } from 'react'
import { useReaderPreferences } from '../hooks/useReaderPreferences'

interface PreferencesProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that applies reader preferences globally
 * Manages document root classes for theme and font preferences
 */
export function PreferencesProvider ({ children }: PreferencesProviderProps): JSX.Element {
  const { preferences } = useReaderPreferences()

  useEffect(() => {
    const root = document.documentElement
    const theme = preferences.theme ?? 'light'
    const fontFamily = preferences.fontFamily ?? 'serif'
    const fontSize = preferences.fontSize ?? 18

    // Remove all theme classes
    root.classList.remove('dark', 'sepia', 'high-contrast')

    // Add the selected theme class (light is default, no class needed)
    if (theme !== 'light') {
      root.classList.add(theme)
    }

    // Apply font family class
    root.classList.remove('font-family-serif', 'font-family-sans')
    root.classList.add(`font-family-${fontFamily}`)

    // Apply font size as CSS variable
    root.style.setProperty('--reader-font-size', `${fontSize}px`)
  }, [preferences])

  return <>{children}</>
}
