import { Fragment } from 'react'
import { type ProfileFormValues } from '../types/profile.types'

interface ProfilePreviewProps {
  values: ProfileFormValues
  isSaving: boolean
  isDirty: boolean
}

export function ProfilePreview ({ values, isSaving, isDirty }: ProfilePreviewProps): JSX.Element {
  const visibilityLabels: Record<string, string> = {
    public: 'Public',
    cohorts: 'Visible to Cohorts',
    private: 'Private'
  }

  return (
    <aside className="space-y-4 rounded-xl border border-border bg-card/80 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-background">
          {values.avatarUrl != null && values.avatarUrl.length > 0
            ? (
              <img src={values.avatarUrl} alt="Profile preview avatar" className="h-full w-full object-cover" />
              )
            : (
              <div className="flex h-full w-full items-center justify-center text-sm text-foreground-muted">
                Avatar
              </div>
              )}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{values.displayName || 'Unnamed comrade'}</p>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {visibilityLabels[values.privacySettings.profile_visibility] ?? 'Private'}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Bio</p>
        <p className="mt-1 text-sm text-foreground-muted">
          {values.bio.length > 0 ? values.bio : 'You have not written a bio yet.'}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-semibold text-foreground">Reader Setup</p>
        <div className="rounded-lg border border-border bg-background/40 p-3 text-foreground-muted">
          <p>
            <span className="font-medium text-foreground">Theme:</span> {values.readingPreferences.theme}
          </p>
          <p>
            <span className="font-medium text-foreground">Font:</span> {values.readingPreferences.font_family} @ {values.readingPreferences.font_size}px
          </p>
          <p>
            <span className="font-medium text-foreground">Pace:</span> {values.readingPreferences.reading_speed}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-semibold text-foreground">Sharing Preferences</p>
        <dl className="space-y-2 text-foreground-muted">
          <Fragment>
            <div className="flex justify-between">
              <dt>Reading progress</dt>
              <dd>{values.privacySettings.share_reading_progress ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shared notes</dt>
              <dd>{values.privacySettings.allow_shared_notes ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </Fragment>
        </dl>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-background/40 p-4 text-xs text-foreground-muted">
        {isSaving
          ? 'Saving changes... hold tight.'
          : isDirty
            ? 'Unsaved changes — remember to save before leaving.'
            : 'All changes saved.'}
      </div>
    </aside>
  )
}
