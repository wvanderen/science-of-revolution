import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { validateInviteCode } from '../lib/auth'

const InviteGatePage = (): JSX.Element => {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)

    if (!inviteCode) {
      setError('Invite code required')
      return
    }

    if (!displayName) {
      setError('Display name required')
      return
    }

    if (!email || !password) {
      setError('Email and password required')
      return
    }

    setLoading(true)

    // Step 1: Validate invite code
    const inviteValidation = await validateInviteCode(inviteCode)
    if (!inviteValidation.valid) {
      setError(inviteValidation.error ?? 'Invalid invite code')
      setLoading(false)
      return
    }

    // Step 2: Sign up user (trigger will auto-create profile and assign cohort)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          invite_code: inviteCode,
          display_name: displayName
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Enter your invite code</h1>
          <p className="text-sm text-slate-300">
            Use the code provided by your facilitator to create your account.
          </p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit} data-testid="invite-form">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="invite">
              Invite code
            </label>
            <input
              id="invite"
              name="invite"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.trim())}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error != null ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default InviteGatePage
