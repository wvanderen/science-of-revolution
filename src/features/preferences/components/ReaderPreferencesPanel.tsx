import { useState, useEffect } from 'react'
import { useReaderPreferences } from '../hooks/useReaderPreferences'

interface ReaderPreferencesPanelProps {
  isOpen: boolean
  onClose: () => void
}

type Theme = 'light' | 'dark'
type FontFamily = 'serif' | 'sans'
type ReadingSpeed = 'slow' | 'normal' | 'fast'

/**
 * Panel for adjusting reader preferences (theme, font, size)
 */
export function ReaderPreferencesPanel ({ isOpen, onClose }: ReaderPreferencesPanelProps): JSX.Element | null {
  const { preferences, updatePreferences } = useReaderPreferences()

  const [theme, setTheme] = useState<Theme>(preferences.theme ?? 'light')
  const [fontFamily, setFontFamily] = useState<FontFamily>(preferences.font_family ?? 'serif')
  const [fontSize, setFontSize] = useState<number>(preferences.font_size ?? 18)
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>(preferences.reading_speed ?? 'normal')

  // Sync local state with preferences
  useEffect(() => {
    setTheme(preferences.theme ?? 'light')
    setFontFamily(preferences.font_family ?? 'serif')
    setFontSize(preferences.font_size ?? 18)
    setReadingSpeed(preferences.reading_speed ?? 'normal')
  }, [preferences])

  const handleThemeChange = async (newTheme: Theme): Promise<void> => {
    setTheme(newTheme)
    await updatePreferences({ theme: newTheme })
  }

  const handleFontFamilyChange = async (newFontFamily: FontFamily): Promise<void> => {
    setFontFamily(newFontFamily)
    await updatePreferences({ font_family: newFontFamily })
  }

  const handleFontSizeChange = async (newSize: number): Promise<void> => {
    setFontSize(newSize)
    await updatePreferences({ font_size: newSize })
  }

  const handleReadingSpeedChange = async (newSpeed: ReadingSpeed): Promise<void> => {
    setReadingSpeed(newSpeed)
    await updatePreferences({ reading_speed: newSpeed })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border shadow-xl z-50 overflow-y-auto"
        role="dialog"
        aria-labelledby="preferences-title"
        aria-modal="true"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="preferences-title" className="text-xl font-semibold text-foreground">
              Reader Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Close preferences"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => { void handleThemeChange(themeOption) }}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    theme === themeOption
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-surface'
                  }`}
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Font Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['serif', 'sans'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => { void handleFontFamilyChange(font) }}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    fontFamily === font
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-surface'
                  }`}
                  style={{
                    fontFamily: font === 'serif'
                      ? 'ui-serif, Georgia, serif'
                      : 'ui-sans-serif, system-ui, sans-serif'
                  }}
                >
                  {font === 'serif' ? 'Serif' : 'Sans Serif'}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="font-size-slider" className="block text-sm font-medium text-foreground">
                Font Size
              </label>
              <span className="text-sm text-foreground-muted">{fontSize}px</span>
            </div>
            <input
              id="font-size-slider"
              type="range"
              min="12"
              max="32"
              step="1"
              value={fontSize}
              onChange={(e) => { void handleFontSizeChange(Number(e.target.value)) }}
              className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>Small (12px)</span>
              <span>Large (32px)</span>
            </div>
          </div>

          {/* Reading Speed */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Reading Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => { void handleReadingSpeedChange(speed) }}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    readingSpeed === speed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-surface'
                  }`}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Text */}
          <div className="p-4 border border-border rounded-lg bg-background">
            <p className="text-foreground-muted text-xs mb-2">Preview</p>
            <p
              className="text-foreground"
              style={{
                fontFamily: fontFamily === 'serif'
                  ? 'ui-serif, Georgia, serif'
                  : 'ui-sans-serif, system-ui, sans-serif',
                fontSize: `${fontSize}px`
              }}
            >
              The quick brown fox jumps over the lazy dog. This is how your reading text will appear.
              <br />
              <span className="text-sm text-foreground-muted">
                Reading pace: <span className="font-semibold capitalize text-foreground">{readingSpeed}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
