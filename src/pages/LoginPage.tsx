import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { useToast } from '../components/providers/ToastProvider'

const LoginPage = (): JSX.Element => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)

    if (email.trim().length === 0 || password.trim().length === 0) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (signInError != null) {
      setError(signInError.message)
      showToast('Sign in failed', { type: 'error' })
      setLoading(false)
      return
    }

    showToast('Signed in successfully', { type: 'success' })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-slate-300">
            Use the credentials associated with your invite code.
          </p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit} data-testid="login-form">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              autoComplete="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value) }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              autoComplete="current-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value) }}
            />
          </div>
          {error != null && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="text-center text-sm text-slate-300">
          Need a facilitator or member invite?{' '}
          <Link to="/invite" className="text-primary underline">
            Request access
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

