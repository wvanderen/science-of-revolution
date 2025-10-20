import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProfileDetails } from '../hooks/useProfileDetails'
import { useProfileUpdate } from '../hooks/useProfileUpdate'
import { ProfileForm } from './ProfileForm'
import { ReadingPreferencesPanel } from './ReadingPreferencesPanel'
import { PrivacySettingsPanel } from './PrivacySettingsPanel'
import { ProfilePreview } from './ProfilePreview'
import { type ProfileFormValues, type ReadingPreferences, type PrivacySettings } from '../types/profile.types'

interface FormErrors {
  displayName?: string
  bio?: string
}

function clampFontSize (value: number): number {
  if (Number.isNaN(value)) return 18
  return Math.min(26, Math.max(14, value))
}

function normalizeReadingPreferences (preferences: ReadingPreferences): ReadingPreferences {
  return {
    ...preferences,
    font_size: clampFontSize(preferences.font_size)
  }
}

function normalizePrivacySettings (settings: PrivacySettings): PrivacySettings {
  return {
    ...settings,
    share_reading_progress: Boolean(settings.share_reading_progress),
    allow_shared_notes: Boolean(settings.allow_shared_notes)
  }
}

const INITIAL_FORM_STATE: ProfileFormValues = {
  displayName: '',
  bio: '',
  avatarUrl: null,
  readingPreferences: normalizeReadingPreferences({
    font_size: 18,
    font_family: 'serif',
    theme: 'light',
    reading_speed: 'normal'
  }),
  privacySettings: normalizePrivacySettings({
    profile_visibility: 'private',
    share_reading_progress: false,
    allow_shared_notes: false
  })
}

export function ProfileConfiguration (): JSX.Element {
  const { showToast } = useToast()
  const {
    data: profile,
    formValues,
    isLoading,
    isError,
    error,
    userId,
    isSessionLoading
  } = useProfileDetails()

  const [values, setValues] = useState<ProfileFormValues>(INITIAL_FORM_STATE)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  const updateProfile = useProfileUpdate(userId)

  useEffect(() => {
    if (profile != null) {
      setValues({
        displayName: formValues.displayName,
        bio: formValues.bio,
        avatarUrl: formValues.avatarUrl,
        readingPreferences: normalizeReadingPreferences(formValues.readingPreferences),
        privacySettings: normalizePrivacySettings(formValues.privacySettings)
      })
      setIsDirty(false)
      setErrors({})
    }
  }, [profile, formValues])

  const isSaving = updateProfile.isPending
  const disableActions = isSaving || isLoading || isSessionLoading

  const validationErrors = useMemo(() => errors, [errors])

  const validate = (nextValues: ProfileFormValues): boolean => {
    const nextErrors: FormErrors = {}

    if (nextValues.displayName.trim().length === 0) {
      nextErrors.displayName = 'Display name is required.'
    } else if (nextValues.displayName.trim().length < 2) {
      nextErrors.displayName = 'Display name must be at least 2 characters.'
    }

    if (nextValues.bio.length > 0 && nextValues.bio.trim().length < 10) {
      nextErrors.bio = 'Bio must be at least 10 characters or left empty.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleFieldChange = (field: 'displayName' | 'bio', value: string) => {
    setValues(prev => ({
      ...prev,
      [field]: field === 'bio' ? value.slice(0, 280) : value
    }))
    setIsDirty(true)
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleAvatarChange = (avatarUrl: string | null) => {
    setValues(prev => ({ ...prev, avatarUrl }))
    setIsDirty(true)
  }

  const handlePreferencesChange = (update: Partial<ReadingPreferences>) => {
    setValues(prev => ({
      ...prev,
      readingPreferences: normalizeReadingPreferences({
        ...prev.readingPreferences,
        ...update
      })
    }))
    setIsDirty(true)
  }

  const handlePrivacyChange = (update: Partial<PrivacySettings>) => {
    setValues(prev => ({
      ...prev,
      privacySettings: normalizePrivacySettings({
        ...prev.privacySettings,
        ...update
      })
    }))
    setIsDirty(true)
  }

  const handleReset = () => {
    if (profile == null) return
    setValues({
      displayName: formValues.displayName,
      bio: formValues.bio,
      avatarUrl: formValues.avatarUrl,
      readingPreferences: normalizeReadingPreferences(formValues.readingPreferences),
      privacySettings: normalizePrivacySettings(formValues.privacySettings)
    })
    setIsDirty(false)
    setErrors({})
    showToast('Changes reverted', { type: 'info' })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disableActions) return

    const normalizedValues: ProfileFormValues = {
      ...values,
      displayName: values.displayName.trim(),
      bio: values.bio.trim(),
      readingPreferences: normalizeReadingPreferences(values.readingPreferences),
      privacySettings: normalizePrivacySettings(values.privacySettings)
    }

    if (!validate(normalizedValues)) return

    try {
      await updateProfile.mutateAsync(normalizedValues)
      setIsDirty(false)
      showToast('Profile updated successfully', { type: 'success' })
    } catch (mutationError) {
      console.error('Profile update failed', mutationError)
      showToast('Failed to save profile changes', { type: 'error' })
    }
  }

  if (isSessionLoading || (isLoading && profile == null)) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card/60">
        <div className="space-y-2 text-center">
          <span className="text-sm font-medium text-foreground">Loading profile...</span>
          <p className="text-xs text-foreground-muted">Fetching your latest profile details.</p>
        </div>
      </div>
    )
  }

  if (isError || profile == null || userId == null) {
    return (
      <div className="rounded-xl border border-dashed border-rose-400 bg-rose-500/5 p-6 text-sm text-rose-500">
        Unable to load your profile right now. {error != null ? error.message : 'Please try refreshing the page.'}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
        <div className="space-y-6">
          <ProfileForm
            values={values}
            errors={validationErrors}
            onFieldChange={handleFieldChange}
            onAvatarChange={handleAvatarChange}
          />

          <ReadingPreferencesPanel
            preferences={values.readingPreferences}
            onChange={handlePreferencesChange}
          />

          <PrivacySettingsPanel
            settings={values.privacySettings}
            onChange={handlePrivacyChange}
          />
        </div>

        <ProfilePreview values={values} isSaving={isSaving} isDirty={isDirty} />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={disableActions || !isDirty}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface transition"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={disableActions || !isDirty}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-muted"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
