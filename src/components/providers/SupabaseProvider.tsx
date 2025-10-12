import { createContext, ReactNode, useContext } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import supabase from '../../lib/supabaseClient'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export const useSupabase = (): SupabaseClient => {
  const client = useContext(SupabaseContext)
  if (!client) {
    throw new Error('Supabase client missing from context')
  }
  return client
}

interface Props {
  children: ReactNode
}

const SupabaseProvider = ({ children }: Props): JSX.Element => (
  <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>
)

export default SupabaseProvider
