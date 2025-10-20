import { type ReadingPreferences } from '../types/profile.types'

interface ReadingPreferencesPanelProps {
  preferences: ReadingPreferences
  onChange: (update: Partial<ReadingPreferences>) => void
}

const THEME_OPTIONS: Array<{ value: ReadingPreferences['theme'], label: string, description: string }> = [
  { value: 'light', label: 'Light', description: 'Balanced for bright environments' },
  { value: 'dark', label: 'Dark', description: 'Reduced glare for night reading' }
]

const FONT_FAMILY_OPTIONS: Array<{ value: ReadingPreferences['font_family'], label: string, sample: string }> = [
  { value: 'serif', label: 'Serif', sample: 'ui-serif, Georgia, serif' },
  { value: 'sans', label: 'Sans Serif', sample: 'ui-sans-serif, system-ui, sans-serif' }
]

const SPEED_OPTIONS: Array<{ value: ReadingPreferences['reading_speed'], label: string, description: string }> = [
  { value: 'slow', label: 'Slow', description: 'Extra spacing and deliberate pacing' },
  { value: 'normal', label: 'Normal', description: 'Default pacing for most readers' },
  { value: 'fast', label: 'Fast', description: 'Compact layout for skimming' }
]

export function ReadingPreferencesPanel ({
  preferences,
  onChange
}: ReadingPreferencesPanelProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Reading Preferences</h2>
        <p className="text-sm text-foreground-muted">
          Tune the reader to match your comfort level. These settings apply across the entire application.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="font-size" className="text-sm font-medium text-foreground">
                Font Size
              </label>
              <span className="text-xs text-foreground-muted">{preferences.font_size}px</span>
            </div>
            <input
              id="font-size"
              type="range"
              min={14}
              max={26}
              step={1}
              value={preferences.font_size}
              onChange={(event) => {
                onChange({ font_size: Number(event.target.value) })
              }}
              className="mt-3 w-full cursor-pointer accent-primary"
            />
            <div className="mt-2 flex justify-between text-xs text-foreground-muted">
              <span>14px</span>
              <span>26px</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Reading Pace</span>
            <div className="space-y-2">
              {SPEED_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition ${
                    preferences.reading_speed === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-background'
                  }`}
                >
                  <input
                    type="radio"
                    name="reading-speed"
                    value={option.value}
                    checked={preferences.reading_speed === option.value}
                    onChange={() => { onChange({ reading_speed: option.value }) }}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-foreground-muted">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Theme</span>
            <div className="grid gap-3">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange({ theme: option.value }) }}
                  className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                    preferences.theme === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-background'
                  }`}
                  aria-pressed={preferences.theme === option.value}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-foreground-muted">{option.description}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    {preferences.theme === option.value ? 'Selected' : 'Choose'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Font Style</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {FONT_FAMILY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange({ font_family: option.value }) }}
                  className={`rounded-md border px-3 py-3 text-sm transition ${
                    preferences.font_family === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:bg-background'
                  }`}
                  style={{ fontFamily: option.sample }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Live Preview
            </p>
            <p
              className="mt-2 text-sm text-foreground"
              style={{
                fontSize: `${preferences.font_size}px`,
                fontFamily: preferences.font_family === 'serif'
                  ? 'ui-serif, Georgia, serif'
                  : 'ui-sans-serif, system-ui, sans-serif'
              }}
            >
              “The philosophers have only interpreted the world, in various ways; the point, however, is to change it.”
            </p>
            <p className="mt-2 text-xs text-foreground-muted">
              Reading pace: <span className="font-semibold capitalize text-foreground">{preferences.reading_speed}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
