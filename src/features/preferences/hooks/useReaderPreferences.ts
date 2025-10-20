import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../../hooks/useSession'
import supabase from '../../../lib/supabaseClient'
import { type Database } from '../../../lib/database.types'

type ReadingPreferences = Database['public']['Tables']['profiles']['Row']['reading_preferences']

interface UseReaderPreferencesResult {
  preferences: ReadingPreferences
  isLoading: boolean
  error: Error | null
  updatePreferences: (preferences: Partial<ReadingPreferences>) => Promise<void>
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  font_size: 18,
  font_family: 'serif',
  theme: 'light',
  reading_speed: 'normal'
}

/**
 * Hook to fetch and update user reading preferences
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
        .select('reading_preferences')
        .eq('id', userId)
        .single()

      if (error != null) {
        throw error
      }

      return data.reading_preferences ?? DEFAULT_PREFERENCES
    },
    enabled: userId != null
  })

  // Mutation to update preferences
  const mutation = useMutation({
    mutationFn: async (newPreferences: Partial<ReadingPreferences>) => {
      if (userId == null) {
        throw new Error('User not authenticated')
      }

      const currentPreferences = data ?? DEFAULT_PREFERENCES
      const updatedPreferences: ReadingPreferences = {
        ...currentPreferences,
        ...newPreferences
      }

      const { error } = await supabase
        .from('profiles')
        .update({ reading_preferences: updatedPreferences })
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
    updatePreferences: async (preferences: Partial<ReadingPreferences>) => {
      await mutation.mutateAsync(preferences)
    }
  }
}
