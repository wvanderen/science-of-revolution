import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../components/providers/SupabaseProvider'
import { type Database } from '../lib/database.types'
import { useSession } from './useSession'

export interface UserCohort {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Hook to get cohorts that the current user belongs to
 */
export function useUserCohorts() {
  const { session } = useSession()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['user-cohorts', session?.user?.id],
    queryFn: async (): Promise<UserCohort[]> => {
      if (!session?.user?.id) return []

      const { data, error } = await supabase
        .from('user_cohorts')
        .select(`
          cohort_id,
          cohorts!inner (
            id,
            name,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', session.user.id)

      if (error) throw error

      if (!data) return []

      type QueryResult = {
        cohort_id: string
        cohorts: Pick<Database['public']['Tables']['cohorts']['Row'], 'id' | 'name' | 'description' | 'created_at' | 'updated_at'>
      }

      const rows = Array.isArray(data) ? data : []

      return rows.flatMap((row) => {
        const rawCohort = (row as { cohorts?: QueryResult['cohorts'] | QueryResult['cohorts'][] | null }).cohorts
        const cohort = Array.isArray(rawCohort) ? rawCohort[0] : rawCohort

        if (!cohort) return []

        return [{
          id: cohort.id,
          name: cohort.name,
          description: cohort.description,
          created_at: cohort.created_at,
          updated_at: cohort.updated_at
        }]
      })
    },
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}
