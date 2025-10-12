import { useSession } from '../hooks/useSession'

const DashboardPage = (): JSX.Element => {
  const { session } = useSession()

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-300">Welcome back! We will surface your current assignment and streaks here.</p>
      </header>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-300">
          Session placeholder:
          <span className="ml-2 font-mono text-slate-100">{session?.user?.email ?? 'anonymous'}</span>
        </p>
      </div>
    </section>
  )
}

export default DashboardPage
