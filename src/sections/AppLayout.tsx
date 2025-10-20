import { Link, Outlet, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { useSession } from '../hooks/useSession'
import { useToast } from '../components/providers/ToastProvider'
import { useProfileDetails } from '../features/profiles/hooks/useProfileDetails'

const AppLayout = (): JSX.Element => {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: profile, isLoading: profileLoading } = useProfileDetails()

  const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error != null) {
      console.error('Failed to sign out', error)
      showToast('Failed to sign out', { type: 'error' })
      return
    }

    showToast('Signed out', { type: 'success' })
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-lg">Loading session…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <Link className="rounded bg-primary px-4 py-2 font-medium" to="/invite">
          Go to invite portal
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Left: Brand + Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary-hover transition-colors">
              Science of Revolution
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link to="/" className="text-foreground-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-background">
                Dashboard
              </Link>
              <Link to="/library" className="text-foreground-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-background">
                Library
              </Link>
              <Link to="/education-plans" className="text-foreground-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-background">
                Education Plans
              </Link>
            </nav>
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/profile"
              className="hidden sm:inline text-foreground-muted hover:text-foreground transition-colors"
            >
              <span className="font-medium text-foreground">
                {profileLoading ? 'Loading...' : (profile?.display_name ?? session.user.email)}
              </span>
            </Link>
            <button
              onClick={() => { void handleSignOut() }}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
