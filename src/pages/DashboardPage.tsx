import { useSession } from '../hooks/useSession'

const DashboardPage = (): JSX.Element => {
  const { session } = useSession()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Dashboard</h1>
          <p className="text-foreground-muted mt-2">Welcome back! We will surface your current assignment and streaks here.</p>
        </header>
        <div className="card">
          <p className="text-sm text-foreground-muted">
            Session placeholder:
            <span className="ml-2 font-mono text-foreground font-medium">{session?.user?.email ?? 'anonymous'}</span>
          </p>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
