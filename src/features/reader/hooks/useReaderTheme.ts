import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReaderTheme = 'light' | 'dark'
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl'

interface ReaderThemeState {
  theme: ReaderTheme
  fontSize: ReaderFontSize
  setTheme: (theme: ReaderTheme) => void
  setFontSize: (fontSize: ReaderFontSize) => void
}

/**
 * Reader theme and preferences store
 * Persists to localStorage and syncs with document root class
 */
export const useReaderTheme = create<ReaderThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 'base',

      setTheme: (theme) => {
        set({ theme })
        applyThemeToDocument(theme)
      },

      setFontSize: (fontSize) => {
        set({ fontSize })
      }
    }),
    {
      name: 'reader-preferences',
      onRehydrateStorage: () => (state) => {
        // Apply theme to document when rehydrating from storage
        if (state?.theme != null) {
          applyThemeToDocument(state.theme)
        }
      }
    }
  )
)

/**
 * Apply theme classes to document root element
 */
function applyThemeToDocument (theme: ReaderTheme): void {
  const root = document.documentElement

  // Remove all theme classes
  root.classList.remove('dark')

  // Add the selected theme class (light is default, no class needed)
  if (theme === 'dark') {
    root.classList.add('dark')
  }
}

/**
 * Get font size class for reader content
 */
export function getReaderFontClass (fontSize: ReaderFontSize): string {
  const fontMap: Record<ReaderFontSize, string> = {
    sm: 'text-reader-sm',
    base: 'text-reader-base',
    lg: 'text-reader-lg',
    xl: 'text-reader-xl'
  }
  return fontMap[fontSize]
}
