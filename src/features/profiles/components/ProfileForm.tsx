import { type ProfileFormValues } from '../types/profile.types'
import { AvatarUpload } from './AvatarUpload'

interface ProfileFormProps {
  values: ProfileFormValues
  errors: Partial<Record<'displayName' | 'bio', string>>
  onFieldChange: (field: 'displayName' | 'bio', value: string) => void
  onAvatarChange: (value: string | null) => void
}

export function ProfileForm ({
  values,
  errors,
  onFieldChange,
  onAvatarChange
}: ProfileFormProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
        <p className="text-sm text-foreground-muted">
          Update your display name, bio, and avatar to tailor how others see you across the platform.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="display-name" className="text-sm font-medium text-foreground">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              maxLength={80}
              value={values.displayName}
              onChange={(event) => { onFieldChange('displayName', event.target.value) }}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.displayName != null && (
              <p className="mt-1 text-xs text-rose-500" role="alert">{errors.displayName}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="bio" className="text-sm font-medium text-foreground">
                Bio
              </label>
              <span className="text-xs text-foreground-muted">
                {values.bio.length}/280
              </span>
            </div>
            <textarea
              id="bio"
              maxLength={280}
              rows={4}
              value={values.bio}
              onChange={(event) => { onFieldChange('bio', event.target.value) }}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.bio != null && (
              <p className="mt-1 text-xs text-rose-500" role="alert">{errors.bio}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-background/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Avatar</h3>
          <p className="mt-1 text-xs text-foreground-muted">
            Pick an image that represents you. Uploading is coming soon, but you can link to a hosted image today.
          </p>
          <div className="mt-4">
            <AvatarUpload value={values.avatarUrl} onChange={onAvatarChange} />
          </div>
        </div>
      </div>
    </section>
  )
}
