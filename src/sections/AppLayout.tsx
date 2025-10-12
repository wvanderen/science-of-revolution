import { Link, Outlet } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

const AppLayout = (): JSX.Element => {
  const { session, loading } = useSession()

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
          <div className="text-sm text-slate-300">
            Signed in as <span className="font-semibold">{session.user.email}</span>
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
