import { ProfileConfiguration } from '../components/ProfileConfiguration'

export function ProfilePage (): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-wide text-primary">
            Profile
          </p>
          <h1 className="text-3xl font-bold text-foreground">Configure your profile</h1>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Personalize how you appear to comrades, fine-tune reading preferences, and control how your learning data is shared across the Science of Revolution platform.
          </p>
        </header>

        <ProfileConfiguration />
      </div>
    </div>
  )
}
