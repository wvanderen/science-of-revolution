import { type PrivacySettings } from '../types/profile.types'

interface PrivacySettingsPanelProps {
  settings: PrivacySettings
  onChange: (update: Partial<PrivacySettings>) => void
}

const VISIBILITY_OPTIONS: Array<{
  value: PrivacySettings['profile_visibility']
  title: string
  description: string
}> = [
  {
    value: 'public',
    title: 'Public',
    description: 'Anyone in the network can view your profile details.'
  },
  {
    value: 'cohorts',
    title: 'Cohorts',
    description: 'Only members of your cohorts can view your profile.'
  },
  {
    value: 'private',
    title: 'Private',
    description: 'Only you can view your profile details.'
  }
]

export function PrivacySettingsPanel ({
  settings,
  onChange
}: PrivacySettingsPanelProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Privacy Controls</h2>
        <p className="text-sm text-foreground-muted">
          Decide how visible your learning progress is to facilitators, cohorts, and study partners.
        </p>
      </header>

      <div className="space-y-6">
        <div className="space-y-3">
          <span className="text-sm font-medium text-foreground">Profile Visibility</span>
          <div className="grid gap-3 md:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange({ profile_visibility: option.value }) }}
                className={`rounded-lg border px-4 py-4 text-left transition ${
                  settings.profile_visibility === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-background'
                }`}
                aria-pressed={settings.profile_visibility === option.value}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{option.title}</p>
                  {settings.profile_visibility === option.value && (
                    <span className="text-xs font-medium text-primary">Selected</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition hover:bg-background">
            <input
              type="checkbox"
              checked={settings.share_reading_progress}
              onChange={(event) => { onChange({ share_reading_progress: event.target.checked }) }}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Share reading progress</p>
              <p className="text-xs text-foreground-muted">
                Allow facilitators to see how far you are in each reading selection.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition hover:bg-background">
            <input
              type="checkbox"
              checked={settings.allow_shared_notes}
              onChange={(event) => { onChange({ allow_shared_notes: event.target.checked }) }}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Allow shared annotations</p>
              <p className="text-xs text-foreground-muted">
                Enable study partners to collaborate on highlights and notes you explicitly share.
              </p>
            </div>
          </label>
        </div>
      </div>
    </section>
  )
}
