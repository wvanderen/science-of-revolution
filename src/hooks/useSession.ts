import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import supabase from '../lib/supabaseClient'

export interface SessionState {
  session: Session | null
  loading: boolean
}

export const useSession = (): SessionState => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession (): Promise<void> {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(currentSession)
      setLoading(false)
    }

    loadSession().catch(() => setLoading(false))

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
