import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../../hooks/useSession'
import supabase from '../../../lib/supabaseClient'
import { type Database } from '../../../lib/database.types'

type ReaderPreferences = Database['public']['Tables']['profiles']['Row']['reader_preferences']

interface UseReaderPreferencesResult {
  preferences: ReaderPreferences
  isLoading: boolean
  error: Error | null
  updatePreferences: (preferences: Partial<ReaderPreferences>) => Promise<void>
}

const DEFAULT_PREFERENCES: ReaderPreferences = {
  theme: 'light',
  fontFamily: 'serif',
  fontSize: 18
}

/**
 * Hook to fetch and update user reader preferences
 */
export function useReaderPreferences (): UseReaderPreferencesResult {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  // Fetch user preferences
  const { data, isLoading, error } = useQuery({
    queryKey: ['readerPreferences', userId],
    queryFn: async () => {
      if (userId == null) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('reader_preferences')
        .eq('id', userId)
        .single()

      if (error != null) {
        throw error
      }

      return data.reader_preferences ?? DEFAULT_PREFERENCES
    },
    enabled: userId != null
  })

  // Mutation to update preferences
  const mutation = useMutation({
    mutationFn: async (newPreferences: Partial<ReaderPreferences>) => {
      if (userId == null) {
        throw new Error('User not authenticated')
      }

      const currentPreferences = data ?? DEFAULT_PREFERENCES
      const updatedPreferences = {
        ...currentPreferences,
        ...newPreferences
      }

      const { error } = await supabase
        .from('profiles')
        .update({ reader_preferences: updatedPreferences })
        .eq('id', userId)

      if (error != null) {
        throw error
      }

      return updatedPreferences
    },
    onSuccess: (updatedPreferences) => {
      // Update cache with new preferences
      queryClient.setQueryData(['readerPreferences', userId], updatedPreferences)
    }
  })

  return {
    preferences: data ?? DEFAULT_PREFERENCES,
    isLoading,
    error: error as Error | null,
    updatePreferences: async (preferences: Partial<ReaderPreferences>) => {
      await mutation.mutateAsync(preferences)
    }
  }
}
