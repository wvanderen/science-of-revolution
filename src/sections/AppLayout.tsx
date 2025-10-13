import { Link, Outlet, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { useSession } from '../hooks/useSession'
import { useToast } from '../components/providers/ToastProvider'

const AppLayout = (): JSX.Element => {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const { showToast } = useToast()

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Science of Revolution
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>
              Signed in as <span className="font-semibold">{session.user.email}</span>
            </span>
            <button
              onClick={() => { void handleSignOut() }}
              className="rounded border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
