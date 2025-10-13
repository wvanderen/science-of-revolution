import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../components/providers/SupabaseProvider'
import { useSession } from './useSession'
import { type Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UseProfileOptions {
  enabled?: boolean
}

/**
 * Fetch the current user's profile, including roles.
 */
export function useProfile (options: UseProfileOptions = {}) {
  const supabase = useSupabase()
  const { session, loading: sessionLoading } = useSession()
  const userId = session?.user?.id

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (userId == null) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error != null) throw error
      return data
    },
    enabled: options.enabled ?? (!sessionLoading && userId != null)
  })

  const isFacilitator = query.data?.roles?.includes('facilitator') ?? false

  return {
    ...query,
    isFacilitator,
    session
  }
}

